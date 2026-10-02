import { paymentMicroservice } from './paymentService';
import { GatewayProvider } from '../../types/architecture';

export class PaymentController {
  public static async checkout(params: {
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    plan: string;
    gateway: GatewayProvider;
    idempotencyKey: string;
  }) {
    const res = await paymentMicroservice.initiateCheckout(params);
    return {
      success: true,
      service: 'payment-service',
      ...res,
    };
  }

  public static async verifyPayment(transactionId: string, success: boolean = true) {
    const tx = await paymentMicroservice.executeVerification(transactionId, success);
    return {
      success: true,
      service: 'payment-service',
      transaction: tx,
    };
  }

  public static getLedger() {
    return {
      success: true,
      service: 'payment-service',
      ledger: paymentMicroservice.getLedger(),
    };
  }

  public static getTransactions() {
    return {
      success: true,
      service: 'payment-service',
      transactions: paymentMicroservice.getTransactions(),
    };
  }
}
