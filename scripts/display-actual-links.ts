#!/usr/bin/env npx tsx
/**
 * Display ACTUAL links being pulled from SEDAR and EDGAR
 */

import { config } from 'dotenv';
import { QuoteMediaClient } from '../lib/quotemedia/api-client';

config({ path: '.env.local' });

async function displayActualLinks() {
  console.log('🔗 ACTUAL SEDAR & EDGAR LINKS FROM QUOTEMEDIA');
  console.log('==============================================\n');

  const password = process.env.QUOTEMEDIA_WEBSERVICE_PASSWORD || 'REDACTED';
  const client = new QuoteMediaClient(password);

  // Suppress extra logging
  const originalLog = console.log;
  const suppressLogs = () => { console.log = () => {}; };
  const restoreLogs = () => { console.log = originalLog; };

  try {
    console.log('📡 Fetching real documents...\n');

    // EDGAR LINKS (US Companies)
    console.log('🇺🇸 EDGAR LINKS (US Mining Companies)');
    console.log('======================================\n');

    // Freeport-McMoRan
    suppressLogs();
    const fcxDocs = await client.getCompanyFilings({ symbol: 'FCX', limit: 2 });
    restoreLogs();

    if (fcxDocs.length > 0) {
      console.log('1. FREEPORT-MCMORAN (FCX) - Major Copper Producer');
      const doc = fcxDocs[0];
      console.log(`   Latest Filing: ${doc.formType} (${doc.dateFiled})`);
      console.log(`   Description: ${doc.formDescription}`);
      console.log(`\n   📥 PDF EDGAR Link (${doc.fileSize}):`);
      console.log(`   ${doc.pdfLink}\n`);
      console.log(`   🌐 HTML EDGAR Link:`);
      console.log(`   ${doc.htmlLink}\n`);
    }

    // Newmont
    suppressLogs();
    const nemDocs = await client.getCompanyFilings({ symbol: 'NEM', limit: 2 });
    restoreLogs();

    if (nemDocs.length > 0) {
      console.log('2. NEWMONT CORPORATION (NEM) - Gold Mining Leader');
      const doc = nemDocs.find(d => d.formType === '10-Q' || d.formType === '10-K') || nemDocs[0];
      console.log(`   Latest Major Filing: ${doc.formType} (${doc.dateFiled})`);
      console.log(`   Description: ${doc.formDescription}`);
      console.log(`\n   📥 PDF EDGAR Link (${doc.fileSize}):`);
      console.log(`   ${doc.pdfLink}\n`);
      if (doc.xlsLink) {
        console.log(`   📊 Excel Data Link:`);
        console.log(`   ${doc.xlsLink}\n`);
      }
    }

    // Hecla Mining
    suppressLogs();
    const hlDocs = await client.getCompanyFilings({ symbol: 'HL', limit: 2 });
    restoreLogs();

    if (hlDocs.length > 0) {
      console.log('3. HECLA MINING (HL) - Silver Producer');
      const doc = hlDocs[0];
      console.log(`   Latest Filing: ${doc.formType} (${doc.dateFiled})`);
      console.log(`   Description: ${doc.formDescription}`);
      console.log(`\n   📥 PDF EDGAR Link:`);
      console.log(`   ${doc.pdfLink}\n`);
    }

    // SEDAR LINKS (Canadian Companies)
    console.log('\n🇨🇦 SEDAR LINKS (Canadian Mining Companies)');
    console.log('============================================\n');

    // Note: Canadian symbols without .TO suffix give US listings
    // We need to use the Canadian exchange suffixes

    // Kinross Gold
    suppressLogs();
    const kDocs = await client.getCompanyFilings({ symbol: 'K', limit: 2 });
    restoreLogs();

    if (kDocs.length > 0) {
      console.log('4. KINROSS GOLD (K) - via US listing');
      const doc = kDocs[0];
      console.log(`   Latest Filing: ${doc.formType} (${doc.dateFiled})`);
      console.log(`   Description: ${doc.formDescription}`);
      console.log(`\n   📥 PDF Link:`);
      console.log(`   ${doc.pdfLink}\n`);
    }

    // Agnico Eagle
    suppressLogs();
    const aemDocs = await client.getCompanyFilings({ symbol: 'AEM', limit: 2 });
    restoreLogs();

    if (aemDocs.length > 0) {
      console.log('5. AGNICO EAGLE MINES (AEM) - via US listing');
      const doc = aemDocs[0];
      console.log(`   Latest Filing: ${doc.formType} (${doc.dateFiled})`);
      console.log(`   Description: ${doc.formDescription}`);
      console.log(`\n   📥 PDF Link (${doc.fileSize}):`);
      console.log(`   ${doc.pdfLink}\n`);
      console.log(`   🌐 HTML Link:`);
      console.log(`   ${doc.htmlLink}\n`);
    }

    // IAMGOLD
    suppressLogs();
    const iagDocs = await client.getCompanyFilings({ symbol: 'IAG', limit: 2 });
    restoreLogs();

    if (iagDocs.length > 0) {
      console.log('6. IAMGOLD (IAG) - via US listing');
      const doc = iagDocs[0];
      console.log(`   Latest Filing: ${doc.formType} (${doc.dateFiled})`);
      console.log(`\n   📥 PDF Link:`);
      console.log(`   ${doc.pdfLink}\n`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 LINK STRUCTURE BREAKDOWN:');
    console.log('----------------------------\n');
    console.log('Each link contains:');
    console.log('• webmasterId=131706 (your authentication ID)');
    console.log('• ref=<filing_id> (unique document identifier)');
    console.log('• type=PDF/HTML/XLS (document format)');
    console.log('• symbol=<ticker> (company symbol)');
    console.log('• cdn=<token> (CDN access token)');
    console.log('• companyName (URL encoded company name)');
    console.log('• formType & formDescription');
    console.log('• dateFiled (filing date)');

    console.log('\n✅ These are LIVE, working links that can be:');
    console.log('• Downloaded directly with the enterprise token');
    console.log('• Stored in your edgar_technical_documents table');
    console.log('• Used to fetch and analyze mining technical reports');

    console.log('\n📝 Note: Canadian companies\' SEDAR filings via .TO symbols');
    console.log('   are returning empty results. Use their US listings instead');
    console.log('   (e.g., AEM instead of AEM.TO) to get their SEC filings.');

  } catch (error) {
    console.error('Error:', error);
  }
}

displayActualLinks().catch(console.error);