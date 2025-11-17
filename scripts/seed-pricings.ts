import 'dotenv/config';
import Airtable from 'airtable';

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error('❌ Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID');
  process.exit(1);
}

const airtable = new Airtable({ apiKey });
const base = airtable.base(baseId);

// Sample ad products from previous database (adSlots table)
// Note: These will be added to Ad_Products table
const samplePricings = [
  {
    productName: '네이버 메인 배너',
    format: 'Banner',
    unitPrice: 2400000,
    dimensions: 'PC: 1900×400px, Mobile: 600×300px',
    description: '네이버 메인 페이지 상단 배너 광고 (월 단위)',
  },
  {
    productName: '네이버 DA 광고',
    format: 'Banner',
    unitPrice: 3000000,
    dimensions: '다양한 사이즈 지원',
    description: '네이버 디스플레이 광고 네트워크 (월 단위)',
  },
  {
    productName: '카카오 DA 광고',
    format: 'Banner',
    unitPrice: 3500000,
    dimensions: '320x100, 640x200, 기타',
    description: '카카오 디스플레이 광고 (월 단위)',
  },
  {
    productName: '카카오톡 채널 배너',
    format: 'Banner',
    unitPrice: 2000000,
    dimensions: '1000x180px',
    description: '카카오톡 채널 상단 배너 (월 단위)',
  },
  {
    productName: '구글 디스플레이 광고',
    format: 'Banner',
    unitPrice: 2800000,
    dimensions: '반응형 (자동 조정)',
    description: 'Google Display Network 광고 (월 단위)',
  },
  {
    productName: '구글 검색 광고',
    format: 'Native',
    unitPrice: 3200000,
    dimensions: '텍스트 광고',
    description: 'Google Search Ads (CPC 기반, 월 단위)',
  },
  {
    productName: '유튜브 영상 광고',
    format: 'Video',
    unitPrice: 4000000,
    dimensions: '6초~30초 영상',
    description: 'YouTube 인스트림 광고 (월 단위)',
  },
  {
    productName: '페이스북 광고',
    format: 'Native',
    unitPrice: 2500000,
    dimensions: '피드 광고, 스토리 광고',
    description: 'Facebook Ads Manager 광고 (월 단위)',
  },
  {
    productName: '인스타그램 광고',
    format: 'Native',
    unitPrice: 2500000,
    dimensions: '피드 광고, 스토리 광고, 릴스 광고',
    description: 'Instagram 광고 (월 단위)',
  },
  {
    productName: '벤처스퀘어 메인 배너',
    format: 'Banner',
    unitPrice: 1500000,
    dimensions: '728x90px 또는 300x250px',
    description: '벤처스퀘어 메인 페이지 배너 (월 단위)',
  },
  {
    productName: '벤처스퀘어 사이드 배너',
    format: 'Banner',
    unitPrice: 1000000,
    dimensions: '300x250px',
    description: '벤처스퀘어 사이드바 배너 (월 단위)',
  },
  {
    productName: '벤처스퀘어 기사형 광고',
    format: 'Native',
    unitPrice: 2000000,
    dimensions: '기사 형태 (PR)',
    description: '벤처스퀘어 PR 기사 게재 (1회)',
  },
  {
    productName: '리타게팅 광고 패키지',
    format: 'Banner',
    unitPrice: 5000000,
    dimensions: '멀티 채널 (네이버+카카오+구글)',
    description: '리타게팅 통합 패키지 (월 단위)',
  },
  {
    productName: '브랜딩 캠페인 패키지',
    format: 'Native',
    unitPrice: 10000000,
    dimensions: '멀티 채널 + 크리에이티브 제작',
    description: '종합 브랜딩 캠페인 (3개월)',
  },
  {
    productName: '모바일 앱 광고',
    format: 'Native',
    unitPrice: 3500000,
    dimensions: '앱 설치 광고 (iOS + Android)',
    description: '모바일 앱 마케팅 캠페인 (월 단위)',
  },
];

async function seedPricings() {
  console.log('🌱 Seeding Ad Products (Pricings) table...\n');

  try {
    // Check if Ad_Products table exists and is accessible
    console.log('1️⃣ Checking Ad_Products table access...');
    const existingRecords = await base('Ad_Products').select({ maxRecords: 1 }).all();
    console.log(`   ✅ Ad_Products table accessible (${existingRecords.length} existing records)\n`);

    console.log('2️⃣ Creating ad product records...');
    
    // Create records in batches of 10 (Airtable limit)
    const batchSize = 10;
    let createdCount = 0;

    for (let i = 0; i < samplePricings.length; i += batchSize) {
      const batch = samplePricings.slice(i, i + batchSize);
      
      const records = batch.map(pricing => ({
        fields: {
          'Product Name': pricing.productName,
          'Format': pricing.format,
          'Unit Price': pricing.unitPrice,
          'Dimensions': pricing.dimensions,
          'Description': pricing.description,
          'Status': 'Active',
        }
      }));

      try {
        await base('Ad_Products').create(records);
        createdCount += records.length;
        console.log(`   ✅ Created ${records.length} records (${createdCount}/${samplePricings.length})`);
      } catch (error: any) {
        console.error(`   ❌ Failed to create batch:`, error.message);
        throw error;
      }
    }

    console.log(`\n✅ Success! Created ${createdCount} ad product records\n`);
    
    // List created records
    console.log('📊 Created ad products:');
    const allRecords = await base('Ad_Products').select().all();
    allRecords.forEach((record, index) => {
      const fields: any = record.fields;
      const unitPrice = fields['Unit Price'] || 0;
      console.log(`   ${index + 1}. ${fields['Product Name']} - ₩${unitPrice.toLocaleString()}`);
    });

  } catch (error: any) {
    console.error('\n❌ Error seeding ad products:', error.message);
    
    if (error.statusCode === 404) {
      console.error('\n📋 Ad_Products table does not exist. Please check your Airtable base.');
      console.error('\nRequired fields:');
      console.error('   - Product Name (Single line text)');
      console.error('   - Format (Single select: Banner, Newsletter, Native, Video)');
      console.error('   - Unit Price (Number)');
      console.error('   - Dimensions (Single line text)');
      console.error('   - Description (Long text)');
      console.error('   - Status (Single select: Active, Inactive)');
    } else if (error.error === 'NOT_AUTHORIZED') {
      console.error('\n📋 Permission denied. Add Ad_Products table to your Personal Access Token:');
      console.error('   1. Go to https://airtable.com/create/tokens');
      console.error('   2. Edit your token');
      console.error('   3. Add base access with read/write permissions for Ad_Products table');
    }
    
    process.exit(1);
  }
}

seedPricings();
