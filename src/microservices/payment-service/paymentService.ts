import {
  GatewayProvider,
  PaymentState,
  PaymentTransactionRecord,
  LedgerEntry
} from '../../types/architecture';
import { kafkaClient } from '../kafka/kafkaClient';
import { KAFKA_TOPICS } from '../kafka/kafkaTopics';
import { cdcPipeline } from '../../services/cdc/cdcPipeline';
import {
  createPaymentKafkaEvent,
  PaymentInitiatedPayload,
  PaymentCompletedPayload
} from './paymentEvents';

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
      narration: `Processing commission deducted by ${tx.gateway}`,
    };

    const creditEntry: LedgerEntry = {
      id: `led-${Date.now()}-3`,
      transactionId: tx.transactionId,
      account: 'PLATFORM_REVENUE',
      direction: 'CREDIT',
      amount: tx.netAmount,
      currency: tx.currency,
      timestamp: new Date().toISOString(),
      narration: `Earned subscription revenue from ${tx.userName}`,
    };

    this.ledger.unshift(debitEntry, feeEntry, creditEntry);
  }

  public async initiateCheckout(params: {
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    plan: string;
    gateway: GatewayProvider;
    idempotencyKey: string;
  }): Promise<{ transaction: PaymentTransactionRecord; isReplay: boolean }> {
    // 1. Idempotency Check
    if (this.idempotencyStore.has(params.idempotencyKey)) {
      return {
        transaction: this.idempotencyStore.get(params.idempotencyKey)!,
        isReplay: true,
      };
    }

    const feeRate = params.gateway === 'BKASH' ? 0.015 : 0.012; // 1.5% bKash, 1.2% Nagad
    const gatewayFee = Math.round(params.amount * feeRate * 100) / 100;
    const netAmount = Math.round((params.amount - gatewayFee) * 100) / 100;

    const tx: PaymentTransactionRecord = {
      transactionId: `TX-${params.gateway.substring(0, 2)}-${Math.floor(100000 + Math.random() * 900000)}`,
      idempotencyKey: params.idempotencyKey,
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      amount: params.amount,
      currency: 'BDT',
      plan: params.plan,
      gateway: params.gateway,
      state: 'INITIATED',
      gatewayFee,
      netAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.transactions.set(tx.transactionId, tx);
    this.idempotencyStore.set(params.idempotencyKey, tx);

    // 2. Publish to Kafka: exampro.payments.events
    const event = createPaymentKafkaEvent<PaymentInitiatedPayload>('PAYMENT_INITIATED', tx.transactionId, {
      transactionId: tx.transactionId,
      userId: tx.userId,
      amount: tx.amount,
      plan: tx.plan,
      gateway: tx.gateway,
      idempotencyKey: params.idempotencyKey,
    });

    kafkaClient.produce(KAFKA_TOPICS.PAYMENTS, tx.transactionId, event, [
      { key: 'event.type', value: 'PAYMENT_INITIATED' },
      { key: 'gateway', value: params.gateway },
      { key: 'service', value: 'payment-service' },
    ]);

    return { transaction: tx, isReplay: false };
  }

  public async executeVerification(
    transactionId: string,
    gatewaySuccess: boolean = true
  ): Promise<PaymentTransactionRecord> {
    const tx = this.transactions.get(transactionId);
    if (!tx) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const newState: PaymentState = gatewaySuccess ? 'COMPLETED' : 'FAILED';
    tx.state = newState;
    tx.gatewayRef = `${tx.gateway}_VERIFIED_${Date.now()}`;
    tx.updatedAt = new Date().toISOString();

    if (gatewaySuccess) {
      this.recordLedgerEntries(tx);
    }

    // Capture DB mutation via Debezium CDC
    cdcPipeline.captureMutation('Payment', 'u', { ...tx, state: 'INITIATED' }, tx);

    // Publish to Kafka: exampro.payments.events
    // This event is consumed by user-service to upgrade user plan, and quiz-service to unlock content!
    const event = createPaymentKafkaEvent<PaymentCompletedPayload>(
      gatewaySuccess ? 'PAYMENT_COMPLETED' : 'PAYMENT_FAILED',
      tx.transactionId,
      {
        transactionId: tx.transactionId,
        userId: tx.userId,
        amount: tx.amount,
        plan: tx.plan,
        gateway: tx.gateway,
        gatewayRef: tx.gatewayRef,
        netAmount: tx.netAmount,
        completedAt: tx.updatedAt,
      }
    );

    kafkaClient.produce(KAFKA_TOPICS.PAYMENTS, tx.transactionId, event, [
      { key: 'event.type', value: event.eventType },
      { key: 'gateway', value: tx.gateway },
      { key: 'status', value: newState },
      { key: 'service', value: 'payment-service' },
    ]);

    return { ...tx };
  }

  public getTransactions(): PaymentTransactionRecord[] {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getLedger(): LedgerEntry[] {
    return [...this.ledger];
  }
}

export const paymentMicroservice = new PaymentMicroservice();
