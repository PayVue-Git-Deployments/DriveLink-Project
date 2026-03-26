export interface PaymentRequest {
  amount: number;
  currency: string;
  paymentLinkId: string;
  customerEmail?: string;
  customerName?: string;
  provider: 'stripe' | 'paygate' | 'dpo' | 'payfast';
  merchantId: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  providerTransactionId?: string;
  redirectUrl?: string;
  error?: string;
}

export interface PaymentProvider {
  name: string;
  processPayment(request: PaymentRequest, credentials: any): Promise<PaymentResponse>;
}

// Mock implementations for MVP
class StripeProvider implements PaymentProvider {
  name = 'stripe';
  async processPayment(request: PaymentRequest, credentials: any): Promise<PaymentResponse> {
    // In a real app, use stripe-node
    console.log('Processing via Stripe', request);
    return {
      success: true,
      transactionId: `txn_${Date.now()}`,
      providerTransactionId: `ch_${Date.now()}`,
      redirectUrl: 'https://checkout.stripe.com/pay/cs_test_...',
    };
  }
}

class PayGateProvider implements PaymentProvider {
  name = 'paygate';
  async processPayment(request: PaymentRequest, credentials: any): Promise<PaymentResponse> {
    console.log('Processing via PayGate', request);
    return {
      success: true,
      transactionId: `txn_${Date.now()}`,
      providerTransactionId: `pg_${Date.now()}`,
      redirectUrl: 'https://secure.paygate.co.za/payweb3/process.trans',
    };
  }
}

class DPOProvider implements PaymentProvider {
  name = 'dpo';
  async processPayment(request: PaymentRequest, credentials: any): Promise<PaymentResponse> {
    console.log('Processing via DPO', request);
    return {
      success: true,
      transactionId: `txn_${Date.now()}`,
      providerTransactionId: `dpo_${Date.now()}`,
      redirectUrl: 'https://secure.3gdirectpay.com/payv2.php',
    };
  }
}

class PayFastProvider implements PaymentProvider {
  name = 'payfast';
  async processPayment(request: PaymentRequest, credentials: any): Promise<PaymentResponse> {
    console.log('Processing via PayFast', request);
    return {
      success: true,
      transactionId: `txn_${Date.now()}`,
      providerTransactionId: `pf_${Date.now()}`,
      redirectUrl: 'https://sandbox.payfast.co.za/eng/process',
    };
  }
}

export class PaymentService {
  private providers: Record<string, PaymentProvider> = {
    stripe: new StripeProvider(),
    paygate: new PayGateProvider(),
    dpo: new DPOProvider(),
    payfast: new PayFastProvider(),
  };

  async processPayment(request: PaymentRequest, credentials: any): Promise<PaymentResponse> {
    const provider = this.providers[request.provider];
    
    if (!provider) {
      return {
        success: false,
        error: `Provider ${request.provider} not supported`,
      };
    }

    try {
      const result = await provider.processPayment(request, credentials);
      return result;
    } catch (error: any) {
      console.error(`Payment processing failed for ${request.provider}:`, error);
      
      // Trigger fallback logic here if needed (e.g., edge function call)
      // For MVP, we just return the error
      return {
        success: false,
        error: error.message || 'Payment processing failed',
      };
    }
  }
}

export const paymentService = new PaymentService();
