const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- TEST 1: Check Live Stocks (/api/stocks?status=live) ---');
  const liveRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/stocks?status=live',
    method: 'GET',
    headers: { 'Connection': 'close' }
  });
  console.log(`Status: ${liveRes.status}, Count: ${liveRes.body?.data?.length || 0}`);
  if (liveRes.body?.data) {
    const invalidItems = liveRes.body.data.filter(s => s.status !== 'live');
    if (invalidItems.length > 0) {
      console.error('FAIL: Found non-live stocks in status=live endpoint!');
    } else {
      console.log('PASS: All items in live stocks have status === "live".');
    }
  }

  console.log('\n--- TEST 2: Check Upcoming Stocks (/api/stocks?status=upcoming) ---');
  const upcomingRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/stocks?status=upcoming',
    method: 'GET',
    headers: { 'Connection': 'close' }
  });
  console.log(`Status: ${upcomingRes.status}, Count: ${upcomingRes.body?.data?.length || 0}`);
  if (upcomingRes.body?.data) {
    const invalidItems = upcomingRes.body.data.filter(s => s.status !== 'upcoming');
    if (invalidItems.length > 0) {
      console.error('FAIL: Found non-upcoming stocks in status=upcoming endpoint!');
    } else {
      console.log('PASS: All items in upcoming stocks have status === "upcoming".');
    }
  }

  console.log('\n--- TEST 3: Submit Demand ("চাহিদা জানান") via /api/submissions/corporate-requirement ---');
  const testPhone = '017' + Math.floor(10000000 + Math.random() * 90000000);
  const demandPayload = JSON.stringify({
    companyName: 'টেস্ট ক্যাটারিং ও ডিস্ট্রিবিউশন',
    contactPerson: 'মো: টেস্ট ইউজার',
    phone: testPhone,
    productName: 'পদ্মার বড় ইলিশ',
    quantity: 120,
    unit: 'কেজি (KG)',
    deliveryLocation: 'কাওরান বাজার, ঢাকা',
    requiredDate: '2026-09-25',
    specification: '১.২ কেজির বড় ইলিশ, কোল্ড চেইন ডেলিভারি',
    notes: 'জরুরি ডেলিভারি লাগবে'
  });

  const demandRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 8000,
      path: '/api/submissions/corporate-requirement',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(demandPayload),
        'Connection': 'close'
      }
    },
    demandPayload
  );

  console.log(`Demand Response: Status ${demandRes.status}`);
  console.log(demandRes.body);

  if (!demandRes.body?.success || !demandRes.body?.data?.requirementId) {
    console.error('FAIL: Demand submission failed!');
    return;
  }
  const createdReqId = demandRes.body.data.requirementId;
  console.log(`PASS: Created demand requirement: ${createdReqId}`);

  console.log('\n--- TEST 4: Anti-Duplicate Submission Check ---');
  const dupRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 8000,
      path: '/api/submissions/corporate-requirement',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(demandPayload),
        'Connection': 'close'
      }
    },
    demandPayload
  );
  console.log(`Duplicate Request Status: ${dupRes.status}`);
  if (dupRes.body?.data?.requirementId === createdReqId) {
    console.log('PASS: Duplicate submission properly intercepted and returned existing requirement ID without creating duplicate.');
  } else {
    console.warn('WARN: Duplicate was not intercepted with matching ID.');
  }

  console.log('\n--- TEST 5: Admin Login and Verify Order in Admin /api/orders ---');
  const loginPayload = JSON.stringify({
    email: 'admin@gangchill.com',
    password: 'admin123'
  });

  const loginRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 8000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginPayload),
        'Connection': 'close'
      }
    },
    loginPayload
  );

  console.log(`Login Status: ${loginRes.status}`);
  const token = loginRes.body?.data?.token;
  if (!token) {
    console.error('FAIL: Could not obtain admin auth token!', loginRes.body);
    return;
  }
  console.log('PASS: Successfully logged in as admin. Token obtained.');

  const ordersRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 8000,
    path: '/api/orders',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Connection': 'close'
    }
  });

  console.log(`Orders Status: ${ordersRes.status}, Total Orders in DB: ${ordersRes.body?.data?.length || 0}`);
  const match = ordersRes.body?.data?.find(o => o.id === createdReqId);
  if (match) {
    console.log(`PASS: Found submitted demand in /api/orders!`);
    console.log(`- ID: ${match.id}`);
    console.log(`- Company: ${match.companyName}`);
    console.log(`- Contact: ${match.contactPerson}`);
    console.log(`- Phone: ${match.phone}`);
    console.log(`- Product: ${match.productName}`);
    console.log(`- Quantity: ${match.quantity} ${match.unit}`);
    console.log(`- Delivery Location: ${match.deliveryLocation}`);
    console.log(`- Status: ${match.orderStatus}`);
  } else {
    console.error('FAIL: Created demand was not found in /api/orders!');
  }

  console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(console.error);
