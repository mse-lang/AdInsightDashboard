// Barobill Tax Invoice Types

export interface BarobillConfig {
  certKey: string;
  corpNum: string;
  wsdlUrl: string;
}

export interface TaxInvoiceIssuer {
  corpNum: string;
  taxRegID?: string;
  corpName: string;
  ceoName: string;
  addr: string;
  bizType: string;
  bizClass: string;
  contactName: string;
  telNum: string;
  email: string;
}

export interface TaxInvoiceRecipient {
  corpNum: string;
  taxRegID?: string;
  corpName: string;
  ceoName: string;
  addr: string;
  bizType: string;
  bizClass: string;
  contactName: string;
  telNum: string;
  email: string;
}

export interface TaxInvoiceItem {
  purchaseDate: string;
  itemName: string;
  spec: string;
  qty: number;
  unitPrice: number;
  supplyPrice: number;
  tax: number;
  remark: string;
}

export interface TaxInvoiceData {
  mgtKey: string; // 관리번호 (회사에서 부여하는 고유번호)
  invoiceType: '01' | '02' | '03' | '04'; // 01:세금계산서, 02:수정세금계산서, 03:계산서, 04:수정계산서
  taxType: '01' | '02' | '03'; // 01:과세, 02:영세, 03:면세
  writeDate: string; // 작성일자 YYYYMMDD
  taxTotal: number; // 세액합계
  supplyPriceTotal: number; // 공급가액합계
  totalAmount: number; // 합계금액
  remark1?: string; // 비고1
  remark2?: string; // 비고2
  remark3?: string; // 비고3
  invoicer: TaxInvoiceIssuer; // 공급자 정보
  invoicee: TaxInvoiceRecipient; // 공급받는자 정보
  items: TaxInvoiceItem[]; // 품목
}

export interface BarobillResponse {
  result: number; // 0:성공, 음수:실패
  resultMessage: string;
  ntsConfirmNum?: string; // 국세청 승인번호
}

export interface TaxInvoiceStatus {
  mgtKey: string;
  state: string; // 상태값
  stateDateTime: string; // 상태 변경일시
  ntsConfirmNum: string; // 국세청 승인번호
}
