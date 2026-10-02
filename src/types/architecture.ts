// Enterprise Architecture Types: Auth0, Microservices, Elasticsearch, CDC, Kafka, Flink, Middlewares, Controllers

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// ==========================================
// 1. AUTH0 TYPES
// ==========================================
export interface Auth0User {
  sub: string; // e.g. "auth0|65f2a1b9c8d7"
  name: string;
  email: string;
  email_verified: boolean;
  picture?: string;
  nickname?: string;
  updated_at: string;
  'https://exampro.ai/roles': string[];
  'https://exampro.ai/permissions': string[];
  'https://exampro.ai/is_premium': boolean;
  'https://exampro.ai/subscription_plan'?: string;
}

export interface Auth0TokenPayload {
  iss: string;
  sub: string;
  aud: string[];
  iat: number;
  exp: number;
  azp: string;
  scope: string;
  permissions: string[];
  roles: string[];
}

export interface Auth0Config {
  domain: string;
  clientId: string;
  audience: string;
  redirectUri: string;
  scope: string;
}

// ==========================================
// 2. MICROSERVICE TYPES
// ==========================================
export type MicroserviceId =
  | 'user-service'
  | 'question-service'
  | 'quiz-service'
  | 'payment-service'
  | 'auth-service'
  | 'search-service'
  | 'analytics-service';

export interface ServiceHealth {
  serviceId: MicroserviceId;
  name: string;
  port: number;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  uptimeSeconds: number;
  circuitState: 'CLOSED' | 'HALF_OPEN' | 'OPEN';
  requestCount: number;
  errorCount: number;
  avgLatencyMs: number;
  lastHeartbeat: string;
}

export interface MicroserviceRequest<T = any> {
  correlationId: string;
  sourceService: string;
  targetService: MicroserviceId;
  endpoint: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: T;
  timestamp: string;
}

export interface MicroserviceResponse<T = any> {
  correlationId: string;
  statusCode: number;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  durationMs: number;
  servedBy: MicroserviceId;
}

// ==========================================
// 3. ELASTICSEARCH TYPES
// ==========================================
export interface EsQuizDocument {
  id: string;
  title: string;
  slug: string;
  description: string;
  subjectId: string;
  subjectName: string;
  categoryId: string;
  categoryName: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isPaid: boolean;
  price: number;
  durationMinutes: number;
  totalQuestions: number;
  passMarks: number;
  tags: string[];
  createdAt: string;
}

export interface EsQuestionDocument {
  id: string;
  quizId: string;
  quizTitle: string;
  text: string;
  explanation: string;
  difficulty: string;
  subjectId: string;
  tags: string[];
}

export interface EsSearchQuery {
  q?: string;
  subjectId?: string;
  difficulty?: string;
  isPaid?: boolean;
  minPrice?: number;
  maxPrice?: number;
  from?: number;
  size?: number;
  fuzziness?: 'AUTO' | '0' | '1' | '2';
  highlight?: boolean;
}

export interface EsHit<T> {
  _index: string;
  _id: string;
  _score: number;
  _source: T;
  highlight?: Record<string, string[]>;
}

export interface EsSearchResult<T> {
  took: number; // ms
  timed_out: boolean;
  hits: {
    total: { value: number; relation: 'eq' | 'gte' };
    max_score: number;
    hits: EsHit<T>[];
  };
  aggregations?: {
    by_subject?: { buckets: { key: string; doc_count: number }[] };
    by_difficulty?: { buckets: { key: string; doc_count: number }[] };
    by_pricing?: { buckets: { key: string; doc_count: number }[] };
  };
}

// ==========================================
// 4. CDC PIPELINE (CHANGE DATA CAPTURE)
// ==========================================
export type CdcOperation = 'c' | 'u' | 'd' | 'r'; // create, update, delete, read/snapshot

export interface DebeziumSource {
  version: string;
  connector: 'postgresql';
  name: string;
  ts_ms: number;
  snapshot: 'true' | 'false';
  db: string;
  schema: string;
  table: string;
  txId: number;
  lsn: number;
}

export interface CdcPayload<T = any> {
  before: T | null;
  after: T | null;
  source: DebeziumSource;
  op: CdcOperation;
  ts_ms: number;
  transaction?: {
    id: string;
    total_order: number;
    data_collection_order: number;
  };
}

export interface CdcEvent<T = any> {
  eventId: string;
  topic: string;
  key: string;
  payload: CdcPayload<T>;
  timestamp: string;
}

// ==========================================
// 5. APACHE KAFKA TYPES
// ==========================================
export interface KafkaHeader {
  key: string;
  value: string;
}

export interface KafkaRecord<T = any> {
  topic: string;
  partition: number;
  offset: number;
  key: string;
  value: T;
  headers?: KafkaHeader[];
  timestamp: string;
}

export interface KafkaTopicMetadata {
  name: string;
  partitionsCount: number;
  replicationFactor: number;
  messageCount: number;
  retentionHours: number;
  bytesInPerSec: number;
}

export interface KafkaConsumerGroupState {
  groupId: string;
  topic: string;
  activeMembers: number;
  totalLag: number;
  state: 'Stable' | 'Rebalancing' | 'Empty';
}

// ==========================================
// 6. APACHE FLINK TYPES
// ==========================================
export interface FlinkJobStats {
  jobId: string;
  name: string;
  state: 'RUNNING' | 'FINISHED' | 'FAILED' | 'CANCELED';
  uptimeSeconds: number;
  recordsInPerSec: number;
  recordsOutPerSec: number;
  watermark: string;
  parallelism: number;
}

export interface FlinkWindowSummary {
  windowStart: string;
  windowEnd: string;
  windowType: 'TUMBLING' | 'SLIDING';
  durationSeconds: number;
  totalAttempts: number;
  averageScore: number;
  passPercentage: number;
  topScorer: {
    userId: string;
    userName: string;
    score: number;
  };
}

export interface FlinkCepAlert {
  alertId: string;
  patternName: 'RAPID_FIRE_CHEATING' | 'BRUTE_FORCE_SUBMISSION' | 'SCORE_ANOMALY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId: string;
  userName: string;
  quizId: string;
  quizTitle: string;
  details: string;
  triggeredAt: string;
  confidenceScore: number;
}

// ==========================================
// 7. PAYMENT MICROSERVICE TYPES
// ==========================================
export type GatewayProvider = 'BKASH' | 'NAGAD' | 'SSLCOMMERZ' | 'STRIPE';

export type PaymentState =
  | 'INITIATED'
  | 'PROCESSING'
  | 'GATEWAY_REDIRECT'
  | 'VERIFIED'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED';

export interface PaymentTransactionRecord {
  transactionId: string;
  idempotencyKey: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  plan: string;
  gateway: GatewayProvider;
  state: PaymentState;
  gatewayRef?: string;
  gatewayFee: number;
  netAmount: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  account: 'CUSTOMER_RECEIVABLE' | 'BKASH_CLEARING' | 'NAGAD_CLEARING' | 'PLATFORM_REVENUE' | 'GATEWAY_FEES';
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
  timestamp: string;
  narration: string;
}

// ==========================================
// 8. MIDDLEWARE & CONTROLLER PIPELINE TYPES
// ==========================================
export interface RequestContext {
  correlationId: string;
  startTime: number;
  ip: string;
  userAgent: string;
  auth?: {
    isAuthenticated: boolean;
    token?: string;
    user?: Auth0User;
    roles: string[];
    permissions: string[];
  };
  idempotencyKey?: string;
}

export interface MiddlewareResult {
  proceed: boolean;
  statusCode?: number;
  errorMessage?: string;
  headers?: Record<string, string>;
}
