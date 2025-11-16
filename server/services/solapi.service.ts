import { SolapiMessageService } from 'solapi';

interface SMSMessage {
  to: string;
  text: string;
  from?: string;
}

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  from?: string;
}

interface KakaoMessage {
  to: string;
  pfId: string;
  templateId: string;
  variables?: Record<string, string>;
  from?: string;
}

export class SolapiServiceError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'SolapiServiceError';
  }
}

export class SolapiService {
  private messageService: SolapiMessageService | null = null;
  private senderPhone: string;
  private apiKey: string | undefined;
  private apiSecret: string | undefined;

  constructor() {
    this.apiKey = process.env.SOLAPI_API_KEY;
    this.apiSecret = process.env.SOLAPI_API_SECRET;
    this.senderPhone = process.env.SOLAPI_SENDER_PHONE || '';
  }

  private ensureInitialized(): SolapiMessageService {
    if (!this.apiKey || !this.apiSecret) {
      throw new SolapiServiceError(
        'Solapi service unavailable: API credentials not configured. Please set SOLAPI_API_KEY and SOLAPI_API_SECRET environment variables.',
        503
      );
    }

    if (!this.messageService) {
      this.messageService = new SolapiMessageService(this.apiKey, this.apiSecret);
    }

    return this.messageService;
  }

  /**
   * Send SMS message
   */
  async sendSMS(message: SMSMessage): Promise<any> {
    try {
      const messageService = this.ensureInitialized();
      const from = message.from || this.senderPhone;
      
      if (!from) {
        throw new Error('Sender phone number not configured');
      }

      const result = await messageService.send({
        to: message.to,
        from: from,
        text: message.text,
      });

      return result;
    } catch (error) {
      console.error('Solapi SMS send error:', error);
      throw error;
    }
  }

  /**
   * Send multiple SMS messages
   * Note: For single message use sendSMS, for batch use this method
   */
  async sendBulkSMS(messages: SMSMessage[]): Promise<any> {
    try {
      const messageService = this.ensureInitialized();
      const from = this.senderPhone;
      
      if (!from) {
        throw new Error('Sender phone number not configured');
      }

      // Send messages one by one using the standard send method
      // Solapi SDK send() accepts single message or array directly
      const results = [];
      for (const msg of messages) {
        const result = await messageService.send({
          to: msg.to,
          from: msg.from || from,
          text: msg.text,
        });
        results.push(result);
      }

      return results;
    } catch (error) {
      console.error('Solapi bulk SMS send error:', error);
      throw error;
    }
  }

  /**
   * Send KakaoTalk Alimtalk message
   * Note: Requires pre-registered template and PF (channel) in Solapi dashboard
   */
  async sendKakaoTalk(message: KakaoMessage): Promise<any> {
    try {
      const messageService = this.ensureInitialized();
      const from = message.from || this.senderPhone;
      
      if (!from) {
        throw new Error('Sender phone number not configured');
      }

      const result = await messageService.send({
        to: message.to,
        from: from,
        kakaoOptions: {
          pfId: message.pfId,
          templateId: message.templateId,
          variables: message.variables || {},
        },
      });

      return result;
    } catch (error) {
      console.error('Solapi KakaoTalk send error:', error);
      throw error;
    }
  }

  /**
   * Get message delivery status
   */
  async getMessageStatus(messageId: string): Promise<any> {
    try {
      const messageService = this.ensureInitialized();
      return await messageService.getMessages({
        messageId: messageId,
      } as any);
    } catch (error) {
      console.error('Solapi status check error:', error);
      throw error;
    }
  }

  /**
   * Check account balance
   */
  async getBalance(): Promise<any> {
    try {
      const messageService = this.ensureInitialized();
      return await messageService.getBalance();
    } catch (error) {
      console.error('Solapi balance check error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const solapiService = new SolapiService();
