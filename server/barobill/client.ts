import soap from 'soap';
import type { BarobillConfig, TaxInvoiceData, BarobillResponse, TaxInvoiceStatus } from './types';

export class BarobillClient {
  private certKey: string;
  private corpNum: string;
  private wsdlUrl: string;

  constructor(config: BarobillConfig) {
    this.certKey = config.certKey;
    this.corpNum = config.corpNum;
    this.wsdlUrl = config.wsdlUrl;
  }

  /**
   * Create SOAP client
   */
  private async createClient() {
    try {
      const client = await soap.createClientAsync(this.wsdlUrl, {
        wsdl_options: {
          timeout: 30000,
        },
      });
      return client;
    } catch (error) {
      console.error('Failed to create SOAP client:', error);
      throw new Error('바로빌 API 클라이언트 생성 실패');
    }
  }

  /**
   * Issue tax invoice (발행)
   */
  async issueTaxInvoice(invoiceData: TaxInvoiceData): Promise<BarobillResponse> {
    try {
      const client = await this.createClient();

      const args = {
        CERTKEY: this.certKey,
        CorpNum: this.corpNum,
        MgtKey: invoiceData.mgtKey,
        InvoiceType: invoiceData.invoiceType,
        TaxType: invoiceData.taxType,
        WriteDate: invoiceData.writeDate,
        TaxTotal: invoiceData.taxTotal,
        SupplyPriceTotal: invoiceData.supplyPriceTotal,
        TotalAmount: invoiceData.totalAmount,
        Remark1: invoiceData.remark1 || '',
        Remark2: invoiceData.remark2 || '',
        Remark3: invoiceData.remark3 || '',
        InvoicerCorpNum: invoiceData.invoicer.corpNum,
        InvoicerTaxRegID: invoiceData.invoicer.taxRegID || '',
        InvoicerCorpName: invoiceData.invoicer.corpName,
        InvoicerCEOName: invoiceData.invoicer.ceoName,
        InvoicerAddr: invoiceData.invoicer.addr,
        InvoicerBizType: invoiceData.invoicer.bizType,
        InvoicerBizClass: invoiceData.invoicer.bizClass,
        InvoicerContactName: invoiceData.invoicer.contactName,
        InvoicerTEL: invoiceData.invoicer.telNum,
        InvoicerEmail: invoiceData.invoicer.email,
        InvoiceeCorpNum: invoiceData.invoicee.corpNum,
        InvoiceeTaxRegID: invoiceData.invoicee.taxRegID || '',
        InvoiceeCorpName: invoiceData.invoicee.corpName,
        InvoiceeCEOName: invoiceData.invoicee.ceoName,
        InvoiceeAddr: invoiceData.invoicee.addr,
        InvoiceeBizType: invoiceData.invoicee.bizType,
        InvoiceeBizClass: invoiceData.invoicee.bizClass,
        InvoiceeContactName: invoiceData.invoicee.contactName,
        InvoiceeTEL: invoiceData.invoicee.telNum,
        InvoiceeEmail: invoiceData.invoicee.email,
        TaxInvoiceItemList: invoiceData.items.map(item => ({
          PurchaseDate: item.purchaseDate,
          ItemName: item.itemName,
          Spec: item.spec,
          Qty: item.qty,
          UnitPrice: item.unitPrice,
          SupplyPrice: item.supplyPrice,
          Tax: item.tax,
          Remark: item.remark || '',
        })),
      };

      const result = await client.IssueTaxInvoiceExAsync(args);
      
      return {
        result: result[0].IssueTaxInvoiceExResult.Result,
        resultMessage: result[0].IssueTaxInvoiceExResult.ResultMessage,
        ntsConfirmNum: result[0].IssueTaxInvoiceExResult.NtsConfirmNum,
      };
    } catch (error: any) {
      console.error('Failed to issue tax invoice:', error);
      throw new Error(error.message || '세금계산서 발행 실패');
    }
  }

  /**
   * Get tax invoice status
   */
  async getTaxInvoiceStatus(mgtKey: string): Promise<TaxInvoiceStatus> {
    try {
      const client = await this.createClient();

      const args = {
        CERTKEY: this.certKey,
        CorpNum: this.corpNum,
        MgtKey: mgtKey,
      };

      const result = await client.GetTaxInvoiceStateAsync(args);
      const state = result[0].GetTaxInvoiceStateResult;

      return {
        mgtKey: mgtKey,
        state: state.State,
        stateDateTime: state.StateDateTime,
        ntsConfirmNum: state.NtsConfirmNum || '',
      };
    } catch (error: any) {
      console.error('Failed to get tax invoice status:', error);
      throw new Error(error.message || '세금계산서 상태 조회 실패');
    }
  }

  /**
   * Get tax invoice print URL
   */
  async getTaxInvoicePrintURL(mgtKey: string): Promise<string> {
    try {
      const client = await this.createClient();

      const args = {
        CERTKEY: this.certKey,
        CorpNum: this.corpNum,
        MgtKey: mgtKey,
      };

      const result = await client.GetTaxInvoicePrintURLAsync(args);
      return result[0].GetTaxInvoicePrintURLResult.URL || '';
    } catch (error: any) {
      console.error('Failed to get print URL:', error);
      throw new Error(error.message || '세금계산서 인쇄 URL 조회 실패');
    }
  }

  /**
   * Check business registration status
   */
  async checkBusinessStatus(corpNum: string): Promise<{ status: string; companyName: string }> {
    try {
      const client = await this.createClient();

      const args = {
        CERTKEY: this.certKey,
        CorpNum: this.corpNum,
        CheckCorpNum: corpNum,
      };

      const result = await client.CheckCorpNumAsync(args);
      const data = result[0].CheckCorpNumResult;

      return {
        status: data.State, // 1:사업중, 2:폐업, 3:휴업
        companyName: data.CompanyName || '',
      };
    } catch (error: any) {
      console.error('Failed to check business status:', error);
      throw new Error(error.message || '사업자 상태 조회 실패');
    }
  }
}

// Singleton instance
let barobillClient: BarobillClient | null = null;

export function getBarobillClient(): BarobillClient {
  if (!barobillClient) {
    const certKey = process.env.BAROBILL_CERT_KEY;
    const corpNum = process.env.BAROBILL_CORP_NUM;
    const wsdlUrl = process.env.BAROBILL_WSDL_URL || 'https://ws.baroservice.com/ti.asmx?WSDL';

    if (!certKey || !corpNum) {
      throw new Error('BAROBILL_CERT_KEY and BAROBILL_CORP_NUM are required');
    }

    barobillClient = new BarobillClient({
      certKey,
      corpNum,
      wsdlUrl,
    });
  }

  return barobillClient;
}
