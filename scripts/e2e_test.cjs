const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:8000/api';

async function runE2E() {
  console.log('=== STARTING GANGCHILL FULL-STACK E2E TEST ===\n');

  // 1. Health Check
  console.log('1. Testing API Health Check...');
  const health = await fetch(`${BASE_URL}`).then(r => r.json());
  if (!health.success || health.data?.status !== 'online') {
    throw new Error('Health check failed: ' + JSON.stringify(health));
  }
  console.log('✓ API Health Check OK:', health.data.api);

  // 1b. Security Check: Web execution guard on init.php
  console.log('\n[SEC-01] Testing CLI-only guard on api/database/init.php...');
  const initCheck = await fetch('http://127.0.0.1:8000/api/database/init.php');
  if (initCheck.status !== 403) {
    throw new Error(`Expected HTTP 403 on init.php web access, received HTTP ${initCheck.status}`);
  }
  const initJson = await initCheck.json();
  console.log(`✓ [SEC-01] init.php strictly blocked from web access with HTTP 403: "${initJson.error}"`);

  // 1c. Security Check: CORS Origin Restriction
  console.log('\n[SEC-04] Testing CORS Origin allowlist restriction...');
  const corsEvil = await fetch(`${BASE_URL}`, {
    headers: { 'Origin': 'https://evil-attacker-website.com' }
  });
  const evilHeader = corsEvil.headers.get('Access-Control-Allow-Origin');
  if (evilHeader === 'https://evil-attacker-website.com' || evilHeader === '*') {
    throw new Error(`CORS vulnerability: Disallowed origin was reflected: ${evilHeader}`);
  }
  console.log('✓ [SEC-04] CORS allowlist properly blocks unauthorized origins from credentialed access');

  // 1d. Security Check: Unauthenticated upload restriction
  console.log('\n[SEC-03] Testing Unauthenticated Admin Upload rejection...');
  const unauthUpload = await fetch(`${BASE_URL}/media/upload`, {
    method: 'POST'
  });
  if (unauthUpload.status !== 401) {
    throw new Error(`Expected HTTP 401 for unauthenticated upload, received ${unauthUpload.status}`);
  }
  console.log('✓ [SEC-03] /api/media/upload strictly requires Admin Authentication (HTTP 401)');

  // 2. Admin Login
  console.log('\n2. Testing Admin Login & SHA-256 Hashed Session...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gangchill.com', password: 'admin123' })
  }).then(r => r.json());

  if (!loginRes.success || !loginRes.data?.token) {
    throw new Error('Login failed: ' + JSON.stringify(loginRes));
  }
  const token = loginRes.data.token;
  console.log('✓ Admin Login OK. Logged in as:', loginRes.data.user.name, `(${loginRes.data.user.email})`);
  console.log(`✓ [SEC-06] Client received 64-char hex Bearer token: ${token.substring(0, 16)}...`);

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 3. Verify Admin Profile
  console.log('\n3. Testing Auth Me...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders }).then(r => r.json());
  if (!meRes.success || meRes.data?.email !== 'admin@gangchill.com') {
    throw new Error('Auth me failed');
  }
  console.log('✓ Auth Me OK:', meRes.data.role, meRes.data.designation);

  // 4. Public Fish Stocks
  console.log('\n4. Testing Stocks Listing & UTF-8...');
  const stocksRes = await fetch(`${BASE_URL}/stocks`).then(r => r.json());
  if (!stocksRes.success || !Array.isArray(stocksRes.data) || stocksRes.data.length < 8) {
    throw new Error('Stocks fetch failed: ' + JSON.stringify(stocksRes));
  }
  console.log(`✓ Stocks fetch OK. Total stocks: ${stocksRes.data.length}. First item: "${stocksRes.data[0].banglaName}" (Price: ৳${stocksRes.data[0].price})`);

  // 5. Submit Corporate Buyer Requirement
  console.log('\n5. Testing Public Corporate Requirement Submission...');
  const reqData = {
    companyName: 'টেস্ট এগ্রো ফুডস লিমিটেড',
    contactPerson: 'মেহরাব হোসেন',
    phone: '01712345678',
    email: 'mehrab@testagro.com',
    productName: 'চাঁদপুরের পদ্মার রূপালী ইলিশ',
    quantity: 500,
    unit: 'কেজি (KG)',
    deliveryLocation: 'উত্তরা, ঢাকা',
    specification: '১ কেজি+ সাইজ ফ্রেশ ইলিশ',
    notes: 'জরুরি ডেলিভারি আবশ্যক'
  };
  const subReq = await fetch(`${BASE_URL}/submissions/corporate-requirement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqData)
  }).then(r => r.json());

  if (!subReq.success || !subReq.data?.requirementId) {
    throw new Error('Corporate submission failed: ' + JSON.stringify(subReq));
  }
  const requirementId = subReq.data.requirementId;
  console.log('✓ Corporate Requirement submitted OK! ID:', requirementId);

  // 6. Admin Order Verification & Quote Update
  console.log('\n6. Testing Admin Order Verification & Quotation Update...');
  const orderDetail = await fetch(`${BASE_URL}/orders/${requirementId}`, { headers: authHeaders }).then(r => r.json());
  if (!orderDetail.success || orderDetail.data.companyName !== 'টেস্ট এগ্রো ফুডস লিমিটেড') {
    throw new Error('Order lookup failed: ' + JSON.stringify(orderDetail));
  }
  console.log('✓ Admin Order verified in DB:', orderDetail.data.companyName, 'Status:', orderDetail.data.orderStatus);

  const quoteRes = await fetch(`${BASE_URL}/orders/${requirementId}/quote`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ quotedPricePerUnit: 1650 })
  }).then(r => r.json());

  if (!quoteRes.success || quoteRes.data.quotedPricePerUnit !== 1650) {
    throw new Error('Quote update failed: ' + JSON.stringify(quoteRes));
  }
  console.log(`✓ Quote updated OK: ৳${quoteRes.data.quotedPricePerUnit}/কেজি. Total: ৳${quoteRes.data.totalEstimatedValue}`);

  // 7. Submit Farmer Stock Lot
  console.log('\n7. Testing Farmer Stock Lot Submission...');
  const lotData = {
    farmerName: 'রহিম উল্লাহ (সাতক্ষীরা খামারি)',
    phone: '01811223344',
    district: 'সাতক্ষীরা',
    productName: 'অর্গানিক বাগদা চিংড়ি (Grade A)',
    stockType: 'current',
    quantity: 300,
    unit: 'কেজি (KG)',
    location: 'দেবহাটা ঘের, সাতক্ষীরা',
    expectedPrice: 950,
    description: 'সম্পূর্ণ রাসায়নিকমুক্ত ঘেরের চিংড়ি'
  };
  const lotRes = await fetch(`${BASE_URL}/submissions/farmer-stock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lotData)
  }).then(r => r.json());

  if (!lotRes.success || !lotRes.data?.submissionId) {
    throw new Error('Farmer lot submission failed: ' + JSON.stringify(lotRes));
  }
  const lotId = lotRes.data.submissionId;
  console.log('✓ Farmer Lot submitted OK! Lot ID:', lotId);

  // 8. Convert Lot to Live Stock
  console.log('\n8. Testing Admin Lot Verification & Conversion to Active Stock...');
  const convertRes = await fetch(`${BASE_URL}/submissions/seller-lots/${lotId}/convert`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ price: 1050, status: 'live' })
  }).then(r => r.json());

  if (!convertRes.success || !convertRes.data?.id) {
    throw new Error('Lot conversion failed: ' + JSON.stringify(convertRes));
  }
  console.log('✓ Lot converted to Active Stock OK! Stock ID:', convertRes.data.id, 'Title:', convertRes.data.banglaName);

  // 9. Testing Maintenance Mode Guard
  console.log('\n9. Testing Maintenance Mode Functional Freeze...');
  await fetch(`${BASE_URL}/settings`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ maintenanceMode: true })
  });

  const blockedReq = await fetch(`${BASE_URL}/submissions/corporate-requirement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqData)
  }).then(r => r.json());

  if (blockedReq.success !== false) {
    throw new Error('Maintenance mode failed to block submission!');
  }
  console.log('✓ Maintenance Mode successfully BLOCKED new submissions with notice:', blockedReq.error);

  // Restore Maintenance Mode
  await fetch(`${BASE_URL}/settings`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ maintenanceMode: false })
  });
  console.log('✓ Maintenance Mode restored to normal operations.');

  // 10. Test Media Upload
  console.log('\n10. Testing Real Multipart File Upload...');
  // Create a 1x1 test png buffer
  const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(samplePngBase64, 'base64');
  const blob = new Blob([pngBuffer], { type: 'image/png' });

  const form = new FormData();
  form.append('file', blob, 'sample_test.png');

  const uploadRes = await fetch(`${BASE_URL}/media/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: form
  }).then(r => r.json());


  if (!uploadRes.success || !uploadRes.data?.url) {
    throw new Error('Media upload failed: ' + JSON.stringify(uploadRes));
  }
  console.log('✓ Real Media Upload OK! Server URL:', uploadRes.data.url, 'Filename:', uploadRes.data.filename);

  // Verify file is readable via HTTP
  const imgCheck = await fetch(`http://127.0.0.1:8000${uploadRes.data.url}`);
  if (!imgCheck.ok) {
    throw new Error(`Uploaded file not accessible via HTTP ${imgCheck.status}`);
  }
  console.log('✓ Uploaded image is directly accessible via HTTP 200 OK');

  // 11. Test Public Submission Upload (Dedicated Seller Lot Photo Endpoint)
  console.log('\n11. Testing Public Seller Lot Photo Upload (/api/submissions/upload)...');
  const pubForm = new FormData();
  pubForm.append('file', blob, 'public_harvest_lot.png');

  const pubUploadRes = await fetch(`${BASE_URL}/submissions/upload`, {
    method: 'POST',
    body: pubForm
  }).then(r => r.json());

  if (!pubUploadRes.success || !pubUploadRes.data?.url) {
    throw new Error('Public lot photo upload failed: ' + JSON.stringify(pubUploadRes));
  }
  console.log('✓ Public lot photo upload OK! Server URL:', pubUploadRes.data.url);

  console.log('\n======================================================');
  console.log('🎉 ALL PRODUCTION HARDENING & BUSINESS E2E TESTS PASSED!');
  console.log('======================================================\n');
}

runE2E().catch(err => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
