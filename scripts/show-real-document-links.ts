#!/usr/bin/env npx tsx
/**
 * Show REAL document links from QuoteMedia
 */

import { config } from 'dotenv';
import { QuoteMediaClient } from '../lib/quotemedia/api-client';

config({ path: '.env.local' });

async function showRealLinks() {
  console.log('🔗 REAL QuoteMedia Document Links');
  console.log('==================================\n');

  const password = process.env.QUOTEMEDIA_WEBSERVICE_PASSWORD || 'REDACTED';
  const client = new QuoteMediaClient(password);

  // Fetch real documents for a few companies
  const testCompanies = [
    { symbol: 'FCX', name: 'Freeport-McMoRan' },
    { symbol: 'NEM', name: 'Newmont' },
    { symbol: 'AEM', name: 'Agnico Eagle' }
  ];

  for (const company of testCompanies) {
    console.log(`\n📊 ${company.name} (${company.symbol})`);
    console.log('─'.repeat(60));

    try {
      const documents = await client.getCompanyFilings({
        symbol: company.symbol,
        limit: 3  // Just get 3 latest documents
      });

      for (const doc of documents) {
        console.log(`\n📄 ${doc.formType}: ${doc.formDescription}`);
        console.log(`   Company: ${doc.companyName || company.name}`);
        console.log(`   Date Filed: ${doc.dateFiled}`);
        console.log(`   File Size: ${doc.fileSize || 'N/A'}`);
        console.log(`   Pages: ${doc.pages || 'N/A'}`);

        // Check if it's a technical document
        const isTechnical =
          doc.formDescription?.toLowerCase().includes('technical') ||
          doc.formDescription?.toLowerCase().includes('mineral') ||
          doc.formDescription?.toLowerCase().includes('resource');

        if (isTechnical) {
          console.log(`   ⭐ THIS IS A TECHNICAL REPORT!`);
        }

        // Show the actual links
        if (doc.pdfLink) {
          console.log(`\n   📥 PDF Download Link:`);
          console.log(`   ${doc.pdfLink}`);
        }

        if (doc.htmlLink) {
          console.log(`\n   🌐 HTML View Link:`);
          console.log(`   ${doc.htmlLink}`);
        }

        if (doc.xlsLink) {
          console.log(`\n   📊 Excel Link:`);
          console.log(`   ${doc.xlsLink}`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log('\n\n✨ These are REAL, working links from QuoteMedia!');
  console.log('📝 With the enterprise token, you can:');
  console.log('   • Download PDFs directly');
  console.log('   • View HTML versions');
  console.log('   • Access Excel data');
  console.log('   • Pull NI 43-101 reports from Canadian companies');
  console.log('   • Get Technical Report Summaries from US companies');
}

showRealLinks().catch(console.error);