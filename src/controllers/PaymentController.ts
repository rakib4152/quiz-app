import { GatewayProvider } from '../types/architecture';
import { paymentMicroservice } from '../services/payment/paymentService';
import { runMiddlewarePipeline } from '../middleware';

export class PaymentController {
  /**
   * Initiate Checkout session (bKash / Nagad / SSLCommerz) with Idempotency Key validation
   */
  public static async checkout(params: {
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    plan: string;
    gateway: GatewayProvider;
    idempotencyKey?: string;
    reqHeaders?: Record<string, string>;
  }) {
    const { userId, userName, userEmail, amount, plan, gateway, idempotencyKey, reqHeaders = {} } = params;

    const pipeline = runMiddlewarePipeline({ method: 'POST', headers: reqHeaders });
    if (!pipeline.passed) {
      return { success: false, error: pipeline.errorResponse?.detail || 'Validation failed' };
    }

    const effectiveIdempotencyKey = idempotencyKey || pipeline.ctx.idempotencyKey || `idemp-${Date.now()}`;

    const result = await paymentMicroservice.initiateCheckout({
      userId,
      userName,
      userEmail,
      amount,
      plan,
      gateway,
      idempotencyKey: effectiveIdempotencyKey,
    });

    return {
      success: true,
      transaction: result.transaction,
      isReplay: result.isReplay,
      correlationId: pipeline.ctx.correlationId,
      gatewayRedirectUrl: `https://checkout.${gateway.toLowerCase()}.com/v1/session/${result.transaction.transactionId}`,
    };
  }

  /**
   * Webhook verification callback from payment gateway
   */
  public static async verifyPayment(transactionId: string, success: boolean = true) {
    const updated = await paymentMicroservice.executeVerification(transactionId, success);
    return {
      success: true,
      transaction: updated,
    };
  }

  /**
   * Retrieve double-entry ledger journals
   */
  public static async getLedger() {
    return {
      success: true,
      ledger: paymentMicroservice.getLedger(),
      transactions: paymentMicroservice.getTransactions(),
    };
  }
}
