import {
  GatewayProvider,
  PaymentState,
  PaymentTransactionRecord,
  LedgerEntry
} from '../../types/architecture';
import { kafkaClient } from '../kafka/kafkaClient';
import { cdcPipeline } from '../cdc/cdcPipeline';

class PaymentMicroservice {
  private transactions: Map<string, PaymentTransactionRecord> = new Map();
  private idempotencyStore: Map<string, PaymentTransactionRecord> = new Map();
  private ledger: LedgerEntry[] = [];

  constructor() {
    this.seedDefaultTransactions();
  }

  private seedDefaultTransactions() {
    const defaultTx: PaymentTransactionRecord = {
      transactionId: 'TX-BK-982401',
      idempotencyKey: 'idemp_key_seed_01',
      userId: 'usr-student-pro',
      userName: 'Tasmia Sultana',
      userEmail: 'tasmia.du@gmail.com',
      amount: 1499,
      currency: 'BDT',
      plan: 'ANNUAL_BCS_MASTER',
      gateway: 'BKASH',
      state: 'COMPLETED',
      gatewayRef: 'BKASH_TRX_928173491',
      gatewayFee: 22.48, // 1.5% fee
      netAmount: 1476.52,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    };

    this.transactions.set(defaultTx.transactionId, defaultTx);
    this.recordLedgerEntries(defaultTx);
  }

  private recordLedgerEntries(tx: PaymentTransactionRecord) {
    const clearingAccount = tx.gateway === 'BKASH' ? 'BKASH_CLEARING' : 'NAGAD_CLEARING';

    const debitEntry: LedgerEntry = {
      id: `led-${Date.now()}-1`,
      transactionId: tx.transactionId,
      account: clearingAccount,
      direction: 'DEBIT',
      amount: tx.amount,
      currency: tx.currency,
      timestamp: new Date().toISOString(),
      narration: `Funds received via ${tx.gateway} for subscription ${tx.plan}`,
    };

    const feeEntry: LedgerEntry = {
      id: `led-${Date.now()}-2`,
      transactionId: tx.transactionId,
      account: 'GATEWAY_FEES',
      direction: 'DEBIT',
      amount: tx.gatewayFee,
      currency: tx.currency,
      timestamp: new Date().toISOString(),
      narration: `Gateway fee deducted by ${tx.gateway}`,
    };

    const revenueEntry: LedgerEntry = {
      id: `led-${Date.now()}-3`,
      transactionId: tx.transactionId,
      account: 'PLATFORM_REVENUE',
      direction: 'CREDIT',
      amount: tx.netAmount,
      currency: tx.currency,
      timestamp: new Date().toISOString(),
      narration: `Net subscription revenue recognized`,
    };

    this.ledger.unshift(debitEntry, feeEntry, revenueEntry);
  }

  /**
   * Initiate Checkout with Idempotency Protection
   */
  public async initiateCheckout(params: {
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    plan: string;
    gateway: GatewayProvider;
    idempotencyKey: string;
  }): Promise<{ transaction: PaymentTransactionRecord; isReplay: boolean }> {
    // Check Idempotency Key
    if (params.idempotencyKey && this.idempotencyStore.has(params.idempotencyKey)) {
      const cached = this.idempotencyStore.get(params.idempotencyKey)!;
      return { transaction: cached, isReplay: true };
    }

    const transactionId = `TX-${params.gateway.slice(0, 2)}-${Math.floor(100000 + Math.random() * 900000)}`;
    const feeRate = params.gateway === 'BKASH' ? 0.015 : params.gateway === 'NAGAD' ? 0.012 : 0.025;
    const gatewayFee = Math.round(params.amount * feeRate * 100) / 100;
    const netAmount = Math.round((params.amount - gatewayFee) * 100) / 100;

    const tx: PaymentTransactionRecord = {
      transactionId,
      idempotencyKey: params.idempotencyKey,
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      amount: params.amount,
      currency: 'BDT',
      plan: params.plan,
      gateway: params.gateway,
      state: 'PROCESSING',
      gatewayFee,
      netAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.transactions.set(transactionId, tx);
    if (params.idempotencyKey) {
      this.idempotencyStore.set(params.idempotencyKey, tx);
    }

    // Publish to Kafka
    kafkaClient.produce('exampro.payments.transactions', transactionId, tx, [
      { key: 'payment.action', value: 'INITIATED' },
      { key: 'gateway', value: params.gateway },
    ]);

    // CDC Pipeline capture
    cdcPipeline.captureMutation('Payment', 'c', null, tx);

    return { transaction: tx, isReplay: false };
  }

  /**
   * Complete payment verification (simulates bKash/Nagad webhook callback)
   */
  public async executeVerification(
    transactionId: string,
    success: boolean = true
  ): Promise<PaymentTransactionRecord> {
    const tx = this.transactions.get(transactionId);
    if (!tx) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const previous = { ...tx };

    if (success) {
      tx.state = 'COMPLETED';
      tx.gatewayRef = `${tx.gateway}_VERIFIED_${Date.now()}`;
      tx.updatedAt = new Date().toISOString();
      this.recordLedgerEntries(tx);
    } else {
      tx.state = 'FAILED';
      tx.updatedAt = new Date().toISOString();
    }

    this.transactions.set(transactionId, tx);

    // Kafka event
    kafkaClient.produce('exampro.payments.transactions', transactionId, tx, [
      { key: 'payment.action', value: tx.state },
      { key: 'gateway', value: tx.gateway },
    ]);

    // CDC Pipeline update
    cdcPipeline.captureMutation('Payment', 'u', previous, tx);

    return tx;
  }

  public getTransactions(): PaymentTransactionRecord[] {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getLedger(): LedgerEntry[] {
    return this.ledger;
  }
}

export const paymentMicroservice = new PaymentMicroservice();
