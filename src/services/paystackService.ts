interface PaystackConfig {
  publicKey: string;
}

interface PaymentData {
  email: string;
  amount: number; // in kobo (smallest currency unit)
  currency?: string;
  reference?: string;
  callback_url?: string;
  metadata?: any;
  channels?: string[];
}

interface PaystackResponse {
  status: boolean;
  message: string;
  data?: any;
}

class PaystackService {
  private config: PaystackConfig;

  constructor(config: PaystackConfig) {
    this.config = config;
  }

  // Initialize payment and redirect to Paystack
  initializePayment(paymentData: PaymentData): Promise<PaystackResponse> {
    return new Promise((resolve, reject) => {
      const handler = window.PaystackPop.setup({
        key: this.config.publicKey,
        email: paymentData.email,
        amount: paymentData.amount,
        currency: paymentData.currency || 'NGN',
        ref: paymentData.reference || this.generateReference(),
        callback_url: paymentData.callback_url,
        metadata: paymentData.metadata,
        channels: paymentData.channels,
        onClose: () => {
          reject({
            status: false,
            message: 'Payment was cancelled by user'
          });
        },
        callback: (response: any) => {
          resolve({
            status: true,
            message: 'Payment successful',
            data: response
          });
        }
      });

      handler.openIframe();
    });
  }

  // Generate a unique reference
  generateReference(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `ref_${timestamp}_${random}`;
  }

  // Verify payment (this should be done on the backend)
  async verifyPayment(reference: string): Promise<PaystackResponse> {
    try {
      // Note: In production, this should be done on your backend
      // Here we're using a mock implementation
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${this.config.publicKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return {
        status: data.status,
        message: data.message,
        data: data.data
      };
    } catch (error) {
      return {
        status: false,
        message: 'Payment verification failed'
      };
    }
  }
}

// Create a singleton instance
let paystackService: PaystackService | null = null;

export const initializePaystack = (publicKey: string) => {
  paystackService = new PaystackService({ publicKey });
  return paystackService;
};

export const getPaystackService = () => {
  if (!paystackService) {
    throw new Error('Paystack service not initialized. Call initializePaystack first.');
  }
  return paystackService;
};

export type { PaymentData, PaystackResponse };