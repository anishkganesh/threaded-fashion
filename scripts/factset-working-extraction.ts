#!/usr/bin/env npx tsx

import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import * as pdfParse from 'pdf-parse'

config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Correct FactSet configuration based on research
const FACTSET_CONFIG = {
  username: 'LITHOS-2220379',
  apiKey: 'REDACTED',
  baseUrl: 'https://api.factset.com/content/global-filings/v2'
}

// Mining companies to search for
const MINING_COMPANIES = [
  { ticker: 'ABX-CA', name: 'Barrick Gold', source: 'SDRP' },
  { ticker: 'K-CA', name: 'Kinross Gold', source: 'SDRP' },
  { ticker: 'AEM-CA', name: 'Agnico Eagle', source: 'SDRP' },
  { ticker: 'TKO-CA', name: 'Taseko Mines', source: 'SDRP' },
  { ticker: 'LUN-CA', name: 'Lundin Mining', source: 'SDRP' },
  { ticker: 'NEM-US', name: 'Newmont', source: 'EDG' },
  { ticker: 'FCX-US', name: 'Freeport-McMoRan', source: 'EDG' },
  { ticker: 'SCCO-US', name: 'Southern Copper', source: 'EDG' },
  { ticker: 'BHP-AU', name: 'BHP Group', source: 'ASXD' },
  { ticker: 'RIO-AU', name: 'Rio Tinto', source: 'ASXD' }
]

// Keywords to identify technical reports
const TECHNICAL_KEYWORDS = [
  'NI 43-101',
  'NI43-101',
  '43-101',
  'technical report',
  'feasibility study',
  'preliminary economic assessment',
  'PEA',
  'resource estimate',
  'reserve estimate',
  'mineral resource',
  'mineral reserve'
]

async function searchFactSetFilings(ticker: string, source: string) {
  try {
    console.log(`\n🔍 Searching FactSet for ${ticker} on ${source}...`)

    // Using the correct API endpoint and parameters discovered through research
    const url = `${FACTSET_CONFIG.baseUrl}/search`

    const params = {
      ids: ticker,
      sources: source,
      startDate: '20200101',
      endDate: '20241231'
    }

    const response = await axios.get(url, {
      params,
      auth: {
        username: FACTSET_CONFIG.username,
        password: FACTSET_CONFIG.apiKey
      },
      headers: {
        'Accept': 'application/json'
      }
    })

    if (response.data?.data) {
      const filings = response.data.data
      console.log(`  📄 Found ${filings.length} total filings`)

      // Filter for technical reports
      const technicalReports = []
      for (const filing of filings) {
        if (filing.documents) {
          for (const doc of filing.documents) {
            const headline = (doc.headline || '').toLowerCase()
            const formType = (doc.form_types?.[0] || '').toLowerCase()

            // Check if this is a technical report
            const isTechnical = TECHNICAL_KEYWORDS.some(keyword =>
              headline.includes(keyword.toLowerCase()) ||
              formType.includes(keyword.toLowerCase())
            )

            if (isTechnical) {
              technicalReports.push(doc)
              console.log(`  ✅ Found technical report: ${doc.headline}`)
            }
          }
        }
      }

      return technicalReports
    }

    return []
  } catch (error: any) {
    console.error(`  ❌ Error searching FactSet:`, error.response?.data || error.message)
    return []
  }
}

async function downloadPDF(url: string, filename: string): Promise<Buffer | null> {
  try {
    console.log(`  📥 Downloading PDF: ${filename}`)

    // Using Basic Auth for document download as per email guidance
    const response = await axios.get(url, {
      auth: {
        username: FACTSET_CONFIG.username,
        password: FACTSET_CONFIG.apiKey
      },
      responseType: 'arraybuffer',
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000
    })

    const buffer = Buffer.from(response.data)
    console.log(`  ✅ Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`)
    return buffer
  } catch (error: any) {
    console.error(`  ❌ Download error:`, error.message)
    return null
  }
}

async function extractMetricsFromPDF(buffer: Buffer) {
  try {
    console.log(`  🔬 Extracting financial metrics...`)

    const data = await pdfParse(buffer)
    const text = data.text.toLowerCase()

    const metrics: any = {}

    // Extract NPV
    const npvMatch = text.match(/npv[^\d]*\$?([\d,]+(?:\.\d+)?)\s*(?:million|m)/i)
    if (npvMatch) {
      metrics.npv = parseFloat(npvMatch[1].replace(/,/g, ''))
      console.log(`    💰 NPV: $${metrics.npv}M`)
    }

    // Extract IRR
    const irrMatch = text.match(/irr[^\d]*([\d.]+)%/i)
    if (irrMatch) {
      metrics.irr = parseFloat(irrMatch[1])
      console.log(`    📈 IRR: ${metrics.irr}%`)
    }

    // Extract CAPEX
    const capexMatch = text.match(/(?:capex|capital expenditure)[^\$]*\$?([\d,]+(?:\.\d+)?)\s*(?:million|m)/i)
    if (capexMatch) {
      metrics.capex = parseFloat(capexMatch[1].replace(/,/g, ''))
      console.log(`    🏗️ CAPEX: $${metrics.capex}M`)
    }

    // Extract Resource
    const resourceMatch = text.match(/(?:measured|indicated|inferred|resource)[^\d]*([\d,]+(?:\.\d+)?)\s*(?:mt|million tonnes)/i)
    if (resourceMatch) {
      metrics.resource = parseFloat(resourceMatch[1].replace(/,/g, ''))
      console.log(`    ⛏️ Resource: ${metrics.resource} Mt`)
    }

    // Extract Reserve
    const reserveMatch = text.match(/(?:proven|probable|reserve)[^\d]*([\d,]+(?:\.\d+)?)\s*(?:mt|million tonnes)/i)
    if (reserveMatch) {
      metrics.reserve = parseFloat(reserveMatch[1].replace(/,/g, ''))
      console.log(`    🎯 Reserve: ${metrics.reserve} Mt`)
    }

    return metrics
  } catch (error: any) {
    console.error(`  ❌ Extraction error:`, error.message)
    return {}
  }
}

async function uploadToSupabase(buffer: Buffer, filename: string) {
  try {
    console.log(`  ☁️ Uploading to Supabase storage...`)

    const bucketName = 'factset-documents'
    const filePath = `pdfs/${filename}`

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets?.find(b => b.name === bucketName)) {
      await supabase.storage.createBucket(bucketName, { public: false })
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (error) throw error

    console.log(`  ✅ Uploaded to: ${filePath}`)
    return filePath
  } catch (error: any) {
    console.error(`  ❌ Upload error:`, error.message)
    return null
  }
}

async function main() {
  console.log('=' .repeat(80))
  console.log('🚀 FACTSET COMPREHENSIVE EXTRACTION PIPELINE')
  console.log('=' .repeat(80))

  let totalProcessed = 0
  let totalExtracted = 0

  for (const company of MINING_COMPANIES) {
    console.log('\n' + '='.repeat(60))
    console.log(`Processing: ${company.name} (${company.ticker})`)
    console.log('='.repeat(60))

    // Search for technical reports
    const reports = await searchFactSetFilings(company.ticker, company.source)

    if (reports.length === 0) {
      console.log('  ⚠️ No technical reports found')
      continue
    }

    // Process each report
    for (const report of reports) {
      totalProcessed++

      if (!report.filings_link) {
        console.log('  ⚠️ No download link available')
        continue
      }

      // Generate filename
      const filename = `${company.ticker}_${report.document_id || crypto.randomUUID()}.pdf`

      // Download PDF
      const pdfBuffer = await downloadPDF(report.filings_link, filename)
      if (!pdfBuffer) continue

      // Extract metrics
      const metrics = await extractMetricsFromPDF(pdfBuffer)

      // Upload to Supabase storage
      const storagePath = await uploadToSupabase(pdfBuffer, filename)

      // Create project entry if we have metrics
      if (Object.keys(metrics).length > 0) {
        totalExtracted++

        // Find or create company
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .eq('ticker', company.ticker)
          .limit(1)

        let companyId = companies?.[0]?.id

        if (!companyId) {
          const { data: newCompany } = await supabase
            .from('companies')
            .insert({
              name: company.name,
              ticker: company.ticker,
              exchange: company.source
            })
            .select('id')
            .single()

          companyId = newCompany?.id
        }

        // Create project
        if (companyId) {
          const projectName = report.headline?.replace(/[^a-zA-Z0-9 -]/g, '').slice(0, 50) || 'Mining Project'

          const { error } = await supabase
            .from('projects')
            .insert({
              id: crypto.randomUUID(),
              company_id: companyId,
              name: projectName,
              npv: metrics.npv || null,
              irr: metrics.irr || null,
              capex: metrics.capex || null,
              resource: metrics.resource?.toString() || null,
              reserve: metrics.reserve?.toString() || null,
              document_storage_path: storagePath,
              urls: [report.filings_link],
              description: `Technical report extracted from FactSet: ${report.headline}`,
              stage: 'Feasibility',
              status: 'Active'
            })

          if (error) {
            console.error('  ❌ Database error:', error.message)
          } else {
            console.log('  ✅ Project created in database!')
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('📊 EXTRACTION COMPLETE')
  console.log('='.repeat(80))
  console.log(`Total reports processed: ${totalProcessed}`)
  console.log(`Reports with extracted metrics: ${totalExtracted}`)

  // Show final database status
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })

  const { count: companyCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })

  console.log(`\n📈 Database Status:`)
  console.log(`  Companies: ${companyCount}`)
  console.log(`  Projects: ${projectCount}`)
}

main().catch(console.error)