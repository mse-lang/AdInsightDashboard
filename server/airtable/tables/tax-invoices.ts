import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);

export interface TaxInvoiceFields {
  mgtKey: string; // 관리번호
  advertiserId: string; // 광고주 ID (Advertisers 테이블 링크)
  invoiceType: '세금계산서' | '수정세금계산서' | '계산서' | '수정계산서';
  taxType: '과세' | '영세' | '면세';
  writeDate: string; // 작성일자
  supplyPriceTotal: number; // 공급가액 합계
  taxTotal: number; // 세액 합계
  totalAmount: number; // 합계금액
  status: '작성중' | '발행완료' | '발행실패' | '취소';
  ntsConfirmNum?: string; // 국세청 승인번호
  printUrl?: string; // 인쇄 URL
  remark?: string; // 비고
  items: string; // 품목 (JSON 문자열)
  issuerInfo: string; // 공급자 정보 (JSON 문자열)
  recipientInfo: string; // 공급받는자 정보 (JSON 문자열)
  createdAt: string;
  errorMessage?: string; // 발행 실패 시 오류 메시지
}

export interface TaxInvoice {
  id: string;
  fields: TaxInvoiceFields;
}

/**
 * Get all tax invoices
 */
export async function getAllTaxInvoices(): Promise<TaxInvoice[]> {
  try {
    const records = await base('TaxInvoices')
      .select({
        sort: [{ field: 'createdAt', direction: 'desc' }],
      })
      .all();

    return records.map((record) => ({
      id: record.id,
      fields: record.fields as TaxInvoiceFields,
    }));
  } catch (error) {
    console.error('Failed to get tax invoices:', error);
    throw new Error('세금계산서 목록 조회 실패');
  }
}

/**
 * Get tax invoice by ID
 */
export async function getTaxInvoiceById(id: string): Promise<TaxInvoice | null> {
  try {
    const record = await base('TaxInvoices').find(id);
    return {
      id: record.id,
      fields: record.fields as TaxInvoiceFields,
    };
  } catch (error) {
    console.error('Failed to get tax invoice:', error);
    return null;
  }
}

/**
 * Get tax invoices by advertiser ID
 */
export async function getTaxInvoicesByAdvertiserId(advertiserId: string): Promise<TaxInvoice[]> {
  try {
    const records = await base('TaxInvoices')
      .select({
        filterByFormula: `{advertiserId} = '${advertiserId}'`,
        sort: [{ field: 'createdAt', direction: 'desc' }],
      })
      .all();

    return records.map((record) => ({
      id: record.id,
      fields: record.fields as TaxInvoiceFields,
    }));
  } catch (error) {
    console.error('Failed to get tax invoices by advertiser:', error);
    throw new Error('광고주 세금계산서 조회 실패');
  }
}

/**
 * Create tax invoice
 */
export async function createTaxInvoice(fields: Omit<TaxInvoiceFields, 'createdAt'>): Promise<TaxInvoice> {
  try {
    const record = await base('TaxInvoices').create({
      ...fields,
      createdAt: new Date().toISOString(),
    });

    return {
      id: record.id,
      fields: record.fields as TaxInvoiceFields,
    };
  } catch (error) {
    console.error('Failed to create tax invoice:', error);
    throw new Error('세금계산서 생성 실패');
  }
}

/**
 * Update tax invoice
 */
export async function updateTaxInvoice(
  id: string,
  fields: Partial<Omit<TaxInvoiceFields, 'createdAt'>>
): Promise<TaxInvoice> {
  try {
    const record = await base('TaxInvoices').update(id, fields);

    return {
      id: record.id,
      fields: record.fields as TaxInvoiceFields,
    };
  } catch (error) {
    console.error('Failed to update tax invoice:', error);
    throw new Error('세금계산서 수정 실패');
  }
}

/**
 * Delete tax invoice
 */
export async function deleteTaxInvoice(id: string): Promise<void> {
  try {
    await base('TaxInvoices').destroy(id);
  } catch (error) {
    console.error('Failed to delete tax invoice:', error);
    throw new Error('세금계산서 삭제 실패');
  }
}
