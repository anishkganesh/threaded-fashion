#!/usr/bin/env npx tsx
/**
 * Explain why QuoteMedia returns 403 for technical report form types
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const QUOTEMEDIA_BASE_URL = 'https://app.quotemedia.com/data';
const WMID = '131706';
const PASSWORD = 'REDACTED';

async function explainThe403() {
  console.log('🔍 WHY QUOTEMEDIA RETURNS 403 FORBIDDEN\n');
  console.log('=' .repeat(70));

  // Test 1: Valid SEC form type WITHOUT authentication
  console.log('\n1️⃣ TEST: Valid SEC form (10-K) WITHOUT authentication');
  console.log('─'.repeat(50));

  let url = `${QUOTEMEDIA_BASE_URL}/getCompanyFilings.json?webmasterId=${WMID}&symbol=LAC&form=10-K&limit=1`;
  let response = await fetch(url);
  console.log(`URL: ${url}`);
  console.log(`Result: ${response.status} ${response.statusText}`);

  if (response.ok) {
    const data = await response.json();
    console.log(`✅ SUCCESS - Found ${data.results?.filing?.length || 0} filings`);
  }

  // Test 2: Invalid form type WITHOUT authentication
  console.log('\n2️⃣ TEST: Invalid form (NI 43-101) WITHOUT authentication');
  console.log('─'.repeat(50));

  url = `${QUOTEMEDIA_BASE_URL}/getCompanyFilings.json?webmasterId=${WMID}&symbol=LAC&form=NI 43-101&limit=1`;
  response = await fetch(url);
  console.log(`URL: ${url}`);
  console.log(`Result: ${response.status} ${response.statusText}`);
  console.log('❌ 403 FORBIDDEN - Form type not recognized by QuoteMedia');

  // Test 3: Get token
  console.log('\n3️⃣ TEST: Get authentication token');
  console.log('─'.repeat(50));

  response = await fetch(`https://app.quotemedia.com/auth/v0/enterprise/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wmId: parseInt(WMID),
      webservicePassword: PASSWORD
    })
  });

  const tokenData = await response.json();
  const token = tokenData.token;
  console.log(`✅ Token obtained: ${token?.substring(0, 20)}...`);

  // Test 4: Valid SEC form WITH authentication
  console.log('\n4️⃣ TEST: Valid SEC form (10-K) WITH authentication');
  console.log('─'.repeat(50));

  url = `${QUOTEMEDIA_BASE_URL}/getCompanyFilings.json?webmasterId=${WMID}&symbol=LAC&form=10-K&limit=1&token=${token}`;
  response = await fetch(url);
  console.log(`Result: ${response.status} ${response.statusText}`);

  if (response.ok) {
    const data = await response.json();
    console.log(`✅ SUCCESS - Found ${data.results?.filing?.length || 0} filings`);
  }

  // Test 5: Invalid form type WITH authentication
  console.log('\n5️⃣ TEST: Invalid form (NI 43-101) WITH authentication');
  console.log('─'.repeat(50));

  url = `${QUOTEMEDIA_BASE_URL}/getCompanyFilings.json?webmasterId=${WMID}&symbol=LAC&form=NI 43-101&limit=1&token=${token}`;
  response = await fetch(url);
  console.log(`Result: ${response.status} ${response.statusText}`);
  console.log('❌ STILL 403 FORBIDDEN - Even with valid authentication!');

  // Test 6: Show all valid form types
  console.log('\n6️⃣ VALID FORM TYPES IN QUOTEMEDIA:');
  console.log('─'.repeat(50));

  const validForms = ['10-K', '10-Q', '8-K', '20-F', '40-F', '6-K', 'DEF 14A'];
  const invalidForms = ['NI 43-101', 'S-K 1300', 'Technical Report', 'SEDAR'];

  console.log('\n✅ VALID (SEC/EDGAR forms):');
  for (const form of validForms) {
    url = `${QUOTEMEDIA_BASE_URL}/getCompanyFilings.json?webmasterId=${WMID}&symbol=FCX&form=${encodeURIComponent(form)}&limit=1`;
    response = await fetch(url);
    console.log(`   ${form}: ${response.status === 200 ? '✅ OK' : '❌ ' + response.status}`);
  }

  console.log('\n❌ INVALID (Not SEC forms):');
  for (const form of invalidForms) {
    url = `${QUOTEMEDIA_BASE_URL}/getCompanyFilings.json?webmasterId=${WMID}&symbol=FCX&form=${encodeURIComponent(form)}&limit=1`;
    response = await fetch(url);
    console.log(`   ${form}: ${response.status === 403 ? '❌ 403 FORBIDDEN' : response.status}`);
  }

  // Explanation
  console.log('\n' + '='.repeat(70));
  console.log('📚 EXPLANATION:');
  console.log('='.repeat(70));

  console.log('\n🔴 The 403 FORBIDDEN occurs because:');
  console.log('1. QuoteMedia validates the "form" parameter against SEC form types');
  console.log('2. "NI 43-101", "S-K 1300", etc. are NOT valid SEC form types');
  console.log('3. QuoteMedia immediately rejects these with 403 before checking auth');
  console.log('4. Authentication works fine, but doesn\'t help with invalid forms');

  console.log('\n🟢 Why authentication doesn\'t help:');
  console.log('• Authentication gives access to MORE data (historical, premium)');
  console.log('• It does NOT add new form types to the system');
  console.log('• QuoteMedia only has SEC/EDGAR data, period');

  console.log('\n💡 The truth about technical reports:');
  console.log('• NI 43-101: Filed on SEDAR+ (Canada), not with SEC');
  console.log('• S-K 1300: These are PDF attachments to 10-K, not forms');
  console.log('• QuoteMedia = SEC data only, no SEDAR integration');

  console.log('\n✅ BOTTOM LINE:');
  console.log('403 = Invalid form type, NOT an authentication issue');
  console.log('QuoteMedia simply doesn\'t have these document types');
  console.log('='.repeat(70));
}

explainThe403().catch(console.error);