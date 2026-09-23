const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:8000/api';

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const body = data ? JSON.stringify(data) : null;

    const headers = {
      'Accept': 'application/json'
    };
    if (body) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, { method, headers }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runAudit() {
  console.log('====================================================');
  console.log(' GANGCHILL PRODUCTION SECURITY & FLOW VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. API Health
    const health = await request('GET', '/');
    assert(health.status === 200 && health.data?.data?.status === 'online', '1. API Root Health Check');

    // 2. Error Masking Check
    const badReq = await request('GET', '/non-existent-route-' + Date.now());
    assert(badReq.status === 404 && !JSON.stringify(badReq).includes('Exception') && !JSON.stringify(badReq).includes('Stack trace'), '2. Safe 404 & Error Masking (No stack trace disclosure)');

    // 3. Admin Authentication
    const login = await request('POST', '/auth/login', {
      email: 'admin@gangchill.com',
      password: 'admin123'
    });
    assert(login.status === 200 && login.data.success && login.data.data.token, '3. Admin Login & Bearer Token Generation');
    const token = login.data?.data?.token;

    // 4. Unauthorized Access Prevention
    const unauthOrders = await request('GET', '/orders');
    assert(unauthOrders.status === 401, '4. Unauthorized API Call Rejection (HTTP 401 on /orders)');

    const badTokenOrders = await request('GET', '/orders', null, 'fake-invalid-token-12345');
    assert(badTokenOrders.status === 401, '5. Invalid Token Rejection (HTTP 401)');

    // 5. BUY FLOW: Price Retrieval & Server-Side Calculation
    const stocksRes = await request('GET', '/stocks');
    assert(stocksRes.status === 200 && Array.isArray(stocksRes.data.data) && stocksRes.data.data.length > 0, '6. Public Stock Retrieval');
    const targetStock = stocksRes.data.data.find(s => s.price > 0) || stocksRes.data.data[0];

    const testBuyerQty = 25;
    const testPhone = '01719' + Math.floor(100000 + Math.random() * 900000);
    const buyerOrderRes = await request('POST', '/submissions/corporate-requirement', {
      companyName: 'টেস্ট এগ্রো বিডি লিমিটেড',
      contactPerson: 'কবির আহমেদ',
      phone: testPhone,
      productName: targetStock.banglaName,
      stockId: targetStock.id,
      quantity: testBuyerQty
    });
    assert(buyerOrderRes.status === 200 && buyerOrderRes.data.success, '7. Buyer Requirement Submission ("এই স্টকটি প্রয়োজন")');

    // Fetch order in Admin
    const adminOrders = await request('GET', '/orders', null, token);
    const createdOrder = adminOrders.data.data.find(o => o.phone === testPhone);
    assert(createdOrder !== undefined, '8. Admin Sees Created Buyer Order with Contact Phone & Company Name');

    if (createdOrder) {
      const expectedTotal = Math.round(targetStock.price * testBuyerQty);
      assert(
        createdOrder.quotedPricePerUnit === targetStock.price &&
        createdOrder.totalEstimatedValue === expectedTotal,
        `9. Server-Side Price Locking (Stock Price: ৳${targetStock.price} × ${testBuyerQty}kg = ৳${expectedTotal})`
      );

      // Admin Quotation Update
      const newQuotedPrice = targetStock.price + 50;
      const quoteUpdate = await request('PATCH', `/orders/${createdOrder.id}/quote`, {
        quotedPricePerUnit: newQuotedPrice
      }, token);
      const expectedNewTotal = Math.round(newQuotedPrice * createdOrder.quantity);
      assert(
        quoteUpdate.status === 200 &&
        quoteUpdate.data.data.quotedPricePerUnit === newQuotedPrice &&
        quoteUpdate.data.data.totalEstimatedValue === expectedNewTotal,
        `10. Admin Quotation Update & Total Recalculation (৳${newQuotedPrice} × ${createdOrder.quantity}kg = ৳${expectedNewTotal})`
      );
    }

    // 6. SELL FLOW: Submission, Verification, Stock Conversion & Soft Delete
    const sellerSubmission = await request('POST', '/submissions/farmer-stock', {
      farmerName: 'করিম উল্লাহ মাঝি',
      phone: '01812345678',
      district: 'কক্সবাজার',
      location: 'ফিশারি ঘাট',
      productName: 'তাজা রুপচান্দা অডিট লট',
      stockType: 'upcoming',
      availabilityDate: '২০২৬-০৯-২৮',
      quantity: 150,
      unit: 'কেজি (KG)',
      expectedPrice: 850,
      description: 'অডিট টেস্ট লট'
    });
    assert(sellerSubmission.status === 200 && sellerSubmission.data.success, '11. Seller Lot Submission (ঘাট সরবরাহ লট)');
    const lotId = sellerSubmission.data.data.submissionId;

    // Verify Lot in Admin
    const verifyLot = await request('PATCH', `/submissions/seller-lots/${lotId}/status`, {
      status: 'verified',
      notes: 'মাঠ পরিদর্শন সম্পন্ন'
    }, token);
    assert(verifyLot.status === 200 && verifyLot.data.data.verificationStatus === 'verified', '12. Admin Verifies Seller Lot');

    // Convert Lot to Stock
    const convertLot = await request('POST', `/submissions/seller-lots/${lotId}/convert`, {}, token);
    assert(convertLot.status === 200 && convertLot.data.data.id, '13. Admin Converts Lot to Live Stock');
    const convertedStockId = convertLot.data.data.id;

    // Delete Converted Stock
    const deleteStock = await request('DELETE', `/stocks/${convertedStockId}`, null, token);
    assert(deleteStock.status === 200 && deleteStock.data.success, '14. Admin Deletes Stock Post');

    // Verify Seller Lot is preserved in MySQL and marked as deleted stock
    const lotsAfterDelete = await request('GET', '/submissions/seller-lots', null, token);
    const preservedLot = lotsAfterDelete.data.data.find(l => l.id === lotId);
    assert(
      preservedLot &&
      preservedLot.isStockDeleted === true &&
      preservedLot.stockDeletedAt !== null &&
      preservedLot.convertedStockId === convertedStockId,
      '15. Seller Lot Historical Preservation & "🗑️ ডিলিট করা লট" Lifecycle Synchronization'
    );

    // 7. INVEST FLOW
    const investList = await request('GET', '/investments');
    assert(investList.status === 200 && Array.isArray(investList.data.data), '16. Public Investment Campaigns List');

    const testInvestApp = await request('POST', '/submissions/investor-interest', {
      investorName: 'রফিকুল ইসলাম',
      phone: '01912345678',
      email: 'rafiq@example.com',
      opportunityId: investList.data.data[0]?.id || 'inv-fish-1',
      opportunityTitle: investList.data.data[0]?.title || 'ইলিশ সংগ্রহ',
      interestedAmount: 200000
    });
    assert(testInvestApp.status === 200 && testInvestApp.data.success, '17. Investor Application Submission');

    const adminInterests = await request('GET', '/submissions/investor-interests', null, token);
    const createdInterest = adminInterests.data.data.find(i => i.phone === '01912345678');
    assert(createdInterest && createdInterest.investorName === 'রফিকুল ইসলাম', '18. Admin Sees Investor Application with Contact Number');

    if (createdInterest) {
      const updateInterest = await request('PATCH', `/submissions/investor-interests/${createdInterest.id}/status`, {
        status: 'contacted'
      }, token);
      assert(updateInterest.status === 200 && updateInterest.data.data.status === 'contacted', '19. Admin Updates Investor Application Status');
      await request('DELETE', `/submissions/investor-interests/${createdInterest.id}`, null, token);
    }

    // 8. BLOG FLOW
    const testBlogSlug = 'audit-test-article-' + Date.now();
    const blogCreate = await request('POST', '/blog', {
      title: 'টেস্ট মৎস্য অডিট আর্টিকেল',
      slug: testBlogSlug,
      category: 'গবেষণা ও উন্নয়ন',
      content: [
        { type: 'paragraph', text: 'এটি একটি টেস্ট আর্টিকেল যা সিস্টেম সুরক্ষার অংশ হিসেবে যাচাই করা হয়েছে।' }
      ]
    }, token);
    assert(blogCreate.status === 200 && blogCreate.data.data.slug === testBlogSlug, '20. Admin Blog Article Creation');

    const blogGet = await request('GET', `/blog/${testBlogSlug}`);
    assert(blogGet.status === 200 && blogGet.data.data.title === 'টেস্ট মৎস্য অডিট আর্টিকেল', '21. Public Blog Retrieval & Content Structure');

    const blogDelete = await request('DELETE', `/blog/${testBlogSlug}`, null, token);
    assert(blogDelete.status === 200 && blogDelete.data.success, '22. Admin Blog Deletion');

    // 9. SQL Injection Resistance
    const sqliTest = await request('GET', "/stocks?searchQuery=' OR 1=1 -- ");
    assert(sqliTest.status === 200 && Array.isArray(sqliTest.data.data), '23. SQL Injection Resistance (Prepared Parameterized Queries)');

    // 10. Numeric Bounds Checking
    const negativeStock = await request('POST', '/stocks', {
      banglaName: 'টেস্ট ঋণাত্মক স্টক',
      category: 'দেশি মাছ',
      quantity: -50,
      price: -200,
      minimumOrder: -10
    }, token);
    assert(
      negativeStock.status === 200 &&
      negativeStock.data.data.quantity >= 0 &&
      negativeStock.data.data.price >= 0 &&
      negativeStock.data.data.minimumOrder >= 1,
      '24. Numeric Bounds Enforcement (Negative numbers sanitized to >= 0, MOQ >= 1)'
    );
    if (negativeStock.data?.data?.id) {
      await request('DELETE', `/stocks/${negativeStock.data.data.id}`, null, token);
    }

    console.log(`\n====================================================`);
    console.log(` VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`====================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test Execution Error:', err);
    process.exit(1);
  }
}

runAudit();
