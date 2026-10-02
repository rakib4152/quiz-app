import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Server,
  Search,
  Activity,
  CreditCard,
  Layers,
  Zap,
  Cpu,
  Database,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Play,
  Key,
  Flame
} from 'lucide-react';

import {
  AUTH0_PRESET_USERS,
  generateAuth0Jwt,
  verifyAndDecodeAuth0Token
} from '../services/auth0/auth0Service';
import { kafkaClient } from '../services/kafka/kafkaClient';
import { elasticsearchEngine } from '../services/elasticsearch/elasticsearchClient';
import { cdcPipeline } from '../services/cdc/cdcPipeline';
import { flinkStreamEngine } from '../services/flink/flinkStreamEngine';
import { paymentMicroservice } from '../services/payment/paymentService';
import { serviceRegistry } from '../services/microservices/serviceRegistry';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { SearchController } from '../controllers/SearchController';
import { PaymentController } from '../controllers/PaymentController';
import {
  KafkaRecord,
  CdcEvent,
  FlinkCepAlert,
  PaymentTransactionRecord,
  LedgerEntry,
  ServiceHealth,
  EsSearchResult,
  EsQuizDocument
} from '../types/architecture';
import { User, Quiz } from '../types';

interface ArchitectureHubViewProps {
  currentUser: User;
  quizzes: Quiz[];
  onSwitchUser: (user: User) => void;
  onClose: () => void;
}

export function ArchitectureHubView({
  currentUser,
  quizzes,
  onSwitchUser,
  onClose,
}: ArchitectureHubViewProps) {
  const [activeTab, setActiveTab] = useState<
    'topology' | 'auth0' | 'kafka' | 'cdc' | 'flink' | 'elasticsearch' | 'payment' | 'microservices'
  >('topology');

  // Real-time state
  const [kafkaRecords, setKafkaRecords] = useState<KafkaRecord[]>([]);
  const [cdcEvents, setCdcEvents] = useState<CdcEvent[]>([]);
  const [cepAlerts, setCepAlerts] = useState<FlinkCepAlert[]>([]);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransactionRecord[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  // Elasticsearch Playground state
  const [searchQuery, setSearchQuery] = useState('bcs preliminary bangla');
  const [searchFuzziness, setSearchFuzziness] = useState<'AUTO' | '0' | '1'>('AUTO');
  const [searchResult, setSearchResult] = useState<EsSearchResult<EsQuizDocument> | null>(null);

  // Auth0 Token State
  const activeAuth0User =
    AUTH0_PRESET_USERS[currentUser.id] || AUTH0_PRESET_USERS['usr-student-free'];
  const [jwtToken, setJwtToken] = useState<string>(() => generateAuth0Jwt(activeAuth0User));

  // Payment Simulation State
  const [simAmount, setSimAmount] = useState(1499);
  const [simGateway, setSimGateway] = useState<'BKASH' | 'NAGAD'>('BKASH');
  const [simIdempKey, setSimIdempKey] = useState(`idemp-${Date.now().toString(36)}`);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  // Sync state & live listeners
  const refreshData = () => {
    setKafkaRecords(kafkaClient.getRecords(25));
    setCdcEvents(cdcPipeline.getEvents(20));
    setCepAlerts(flinkStreamEngine.getCepAlerts());
    setServices(serviceRegistry.getServices());
    setTransactions(paymentMicroservice.getTransactions());
    setLedger(paymentMicroservice.getLedger());
  };

  useEffect(() => {
    refreshData();

    // Subscribe to live Kafka events
    const unsubscribeKafka = kafkaClient.subscribe('*', (record) => {
      setKafkaRecords((prev) => [record, ...prev.slice(0, 24)]);
    });

    // Subscribe to live CDC events
    const unsubscribeCdc = cdcPipeline.subscribe((event) => {
      setCdcEvents((prev) => [event, ...prev.slice(0, 19)]);
    });

    // Initial search
    executeSearch('bcs');

    const interval = setInterval(refreshData, 3000);
    return () => {
      unsubscribeKafka();
      unsubscribeCdc();
      clearInterval(interval);
    };
  }, []);

  // Update JWT when user changes
  useEffect(() => {
    const user = AUTH0_PRESET_USERS[currentUser.id] || AUTH0_PRESET_USERS['usr-student-free'];
    setJwtToken(generateAuth0Jwt(user));
  }, [currentUser]);

  const executeSearch = (q: string) => {
    const res = elasticsearchEngine.searchQuizzes({
      q,
      fuzziness: searchFuzziness,
      highlight: true,
    });
    setSearchResult(res);
  };

  const handleFireKafkaEvent = async () => {
    await AnalyticsController.simulateKafkaTraffic();
    refreshData();
  };

  const handleSimulatePayment = async () => {
    const res = await PaymentController.checkout({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      amount: simAmount,
      plan: 'ANNUAL_BCS_MASTER',
      gateway: simGateway,
      idempotencyKey: simIdempKey,
    });

    if (res.success && res.transaction) {
      if (res.isReplay) {
        setPaymentNotice(`Replay detected! Idempotency key preserved: ${res.transaction.transactionId}`);
      } else {
        // Auto verify to complete transaction
        await PaymentController.verifyPayment(res.transaction.transactionId, true);
        setPaymentNotice(`Payment succeeded via ${simGateway}! Trans ID: ${res.transaction.transactionId}`);
      }
    }
    refreshData();
  };

  const decodedJwt = verifyAndDecodeAuth0Token(jwtToken);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 overflow-y-auto font-sans flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-emerald-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/20">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-wide">
                Enterprise System Architecture Console
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ACTIVE PIPELINE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Auth0 • Microservices • Elasticsearch • PostgreSQL CDC • Kafka • Apache Flink • Payment Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleFireKafkaEvent}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Emit Test Kafka Event</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
          >
            Exit Console
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 flex items-center gap-2 overflow-x-auto text-xs font-semibold py-2">
        {[
          { id: 'topology', label: 'Architecture Topology', icon: Layers },
          { id: 'auth0', label: 'Auth0 Identity & RBAC', icon: ShieldCheck },
          { id: 'kafka', label: 'Apache Kafka Event Bus', icon: Activity },
          { id: 'cdc', label: 'CDC (Debezium Postgres)', icon: Database },
          { id: 'flink', label: 'Apache Flink Streaming', icon: Flame },
          { id: 'elasticsearch', label: 'Elasticsearch Engine', icon: Search },
          { id: 'payment', label: 'Payment Microservice & Ledger', icon: CreditCard },
          { id: 'microservices', label: 'Microservices & Middlewares', icon: Server },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Body */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* ============================================================== */}
        {/* TAB 1: TOPOLOGY MAP */}
        {/* ============================================================== */}
        {activeTab === 'topology' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    Distributed System Data Flow & Event Streaming Pipeline
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    End-to-end pipeline handling identity, database mutations, real-time analytics, and search
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1 rounded-lg">
                  Kafka Lag: 0 ms • Latency: 2.1 ms
                </span>
              </div>

              {/* Topology Visual Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                {/* Node 1: Client & Auth0 */}
                <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    1. Identity & Ingress
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded bg-indigo-950/40 border border-indigo-800/50 text-xs">
                      <div className="font-bold text-white">Auth0 OIDC Provider</div>
                      <div className="text-[11px] text-indigo-300">RS256 JWT • RBAC Claims</div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-xs">
                      <div className="font-bold text-white">API Middlewares</div>
                      <div className="text-[11px] text-slate-400">Rate Limiter • Tracing CID • Idempotency</div>
                    </div>
                  </div>
                  <div className="mt-4 text-[10px] text-indigo-400 flex items-center gap-1 font-mono">
                    <span>Target: Microservices</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Node 2: Microservices Layer */}
                <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <Server className="w-4 h-4" />
                    2. Microservices Core
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="font-semibold text-slate-200">Quiz Engine</span>
                      <span className="text-emerald-400 font-mono">:4002</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="font-semibold text-slate-200">Payment Service</span>
                      <span className="text-emerald-400 font-mono">:4003</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex justify-between">
                      <span className="font-semibold text-slate-200">Search Service</span>
                      <span className="text-emerald-400 font-mono">:4004</span>
                    </div>
                  </div>
                  <div className="mt-4 text-[10px] text-cyan-400 flex items-center gap-1 font-mono">
                    <span>Database Mutation</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Node 3: PostgreSQL & CDC (Debezium) */}
                <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <Database className="w-4 h-4" />
                    3. PostgreSQL & CDC
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-xs">
                      <div className="font-bold text-white">PostgreSQL WAL Engine</div>
                      <div className="text-[11px] text-amber-300">Prisma ORM • pgoutput</div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-xs">
                      <div className="font-bold text-white">Debezium CDC Connector</div>
                      <div className="text-[11px] text-slate-400">Log-tailing INSERT/UPDATE/DELETE</div>
                    </div>
                  </div>
                  <div className="mt-4 text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                    <span>Stream to Kafka</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Node 4: Kafka & Apache Flink & Elasticsearch */}
                <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <Zap className="w-4 h-4" />
                    4. Streaming & Indexing
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/40 text-xs">
                      <div className="font-bold text-white">Apache Kafka</div>
                      <div className="text-[11px] text-emerald-300">5 Partitioned Topics • CG Sink</div>
                    </div>
                    <div className="p-2 rounded bg-orange-950/40 border border-orange-800/40 text-xs">
                      <div className="font-bold text-white">Apache Flink & ES</div>
                      <div className="text-[11px] text-orange-300">Tumbling Windows • CEP Fraud Engine</div>
                    </div>
                  </div>
                  <div className="mt-4 text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span>Near Real-Time</span>
                    <CheckCircle className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Elasticsearch Docs</span>
                  <Search className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {elasticsearchEngine.getIndexStats().quizzesCount + elasticsearchEngine.getIndexStats().questionsCount}
                </div>
                <div className="text-[11px] text-cyan-400 font-mono mt-1">
                  Avg Query: {elasticsearchEngine.getIndexStats().avgLatencyMs} ms
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Kafka Events Tracked</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {kafkaClient.getTotalMessagesCount()}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono mt-1">
                  Across 5 Event Topics
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>CDC PostgreSQL LSN</span>
                  <Database className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2 font-mono">
                  {cdcPipeline.getStatus().currentLsn.toString(16).toUpperCase()}
                </div>
                <div className="text-[11px] text-amber-400 font-mono mt-1">
                  Debezium Connector Running
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Flink CEP Alerts</span>
                  <Flame className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-2xl font-black text-white mt-2">
                  {cepAlerts.length}
                </div>
                <div className="text-[11px] text-orange-400 font-mono mt-1">
                  Active Complex Event Processing
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: AUTH0 IDENTITY & RBAC */}
        {/* ============================================================== */}
        {activeTab === 'auth0' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    Auth0 Universal Identity & Token Claims
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    OIDC JSON Web Token (RS256) with custom namespace claims for roles and permissions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {Object.values(AUTH0_PRESET_USERS).map((u) => (
                    <button
                      key={u.sub}
                      onClick={() => {
                        const localUser: User = {
                          id: u.sub.includes('785') ? 'usr-admin' : u.sub.includes('123') ? 'usr-student-free' : 'usr-student-pro',
                          name: u.name,
                          email: u.email,
                          role: u['https://exampro.ai/roles'].includes('ADMIN') ? 'ADMIN' : 'STUDENT',
                          isPremium: u['https://exampro.ai/is_premium'],
                          subscriptionPlan: (u['https://exampro.ai/subscription_plan'] as any) || 'FREE',
                          avatarUrl: u.picture,
                          createdAt: '2026-01-01',
                        };
                        onSwitchUser(localUser);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        currentUser.email === u.email
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {u.name} ({u['https://exampro.ai/roles'][0]})
                    </button>
                  ))}
                </div>
              </div>

              {/* JWT Decoder View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Raw JWT Token */}
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-indigo-400 flex items-center justify-between">
                    <span>RAW BEARER TOKEN (RS256)</span>
                    <span className="text-[10px] text-slate-500">Header.Payload.Signature</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 break-all leading-relaxed h-72 overflow-y-auto">
                    {jwtToken}
                  </div>
                </div>

                {/* Decoded Claims Payload */}
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-between">
                    <span>DECODED CLAIMS & ROLES</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      SIGNATURE VERIFIED
                    </span>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 h-72 overflow-y-auto leading-relaxed">
                    {JSON.stringify(decodedJwt.payload, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Permissions & Scopes Checklist */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Active User Granted Permissions & Scopes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(decodedJwt.payload?.permissions || []).map((perm) => (
                    <span
                      key={perm}
                      className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-medium flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                      {perm}
                    </span>
                  ))}
                  {(decodedJwt.payload?.roles || []).map((role) => (
                    <span
                      key={role}
                      className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold flex items-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5 text-purple-400" />
                      ROLE: {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: APACHE KAFKA */}
        {/* ============================================================== */}
        {activeTab === 'kafka' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    Apache Kafka Event Streaming Broker
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Distributed commit log with partitioned topics, consumer groups, and replay capability
                  </p>
                </div>
                <button
                  onClick={handleFireKafkaEvent}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Produce Test Message</span>
                </button>
              </div>

              {/* Topics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {kafkaClient.getTopics().map((t) => (
                  <div key={t.name} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white truncate">{t.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                        {t.partitionsCount}P
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-2 font-mono">
                      <span>Messages: {t.messageCount}</span>
                      <span>{t.bytesInPerSec} B/s</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Event Stream Table */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                  <span>LIVE EVENT FEED (RING BUFFER)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">AUTO-REBALANCED</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Topic</th>
                        <th className="p-3">Partition</th>
                        <th className="p-3">Offset</th>
                        <th className="p-3">Key</th>
                        <th className="p-3">Payload Preview</th>
                        <th className="p-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {kafkaRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-500">
                            No Kafka records in buffer. Click "Produce Test Message" above.
                          </td>
                        </tr>
                      ) : (
                        kafkaRecords.map((r, i) => (
                          <tr key={`${r.topic}-${r.offset}-${i}`} className="hover:bg-slate-900/60">
                            <td className="p-3 font-bold text-cyan-400">{r.topic}</td>
                            <td className="p-3 text-slate-400">P{r.partition}</td>
                            <td className="p-3 text-amber-400">#{r.offset}</td>
                            <td className="p-3 text-indigo-300">{r.key}</td>
                            <td className="p-3 text-slate-300 max-w-xs truncate">
                              {JSON.stringify(r.value)}
                            </td>
                            <td className="p-3 text-slate-500 text-[11px]">
                              {new Date(r.timestamp).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: CDC (CHANGE DATA CAPTURE) */}
        {/* ============================================================== */}
        {activeTab === 'cdc' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-400" />
                    PostgreSQL Change Data Capture (Debezium WAL)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Capturing table mutations (Prisma) from Write-Ahead Logs and streaming to Kafka & Elasticsearch
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      cdcPipeline.captureMutation('Quiz', 'u', { id: 'quiz-bcs-model-1', title: 'Old Title' }, { id: 'quiz-bcs-model-1', title: '47th BCS Preliminary Live Exam' });
                      refreshData();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                  >
                    Simulate DB Update Mutation
                  </button>
                </div>
              </div>

              {/* Connector Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400">CONNECTOR</div>
                  <div className="text-white font-bold mt-1">debezium-postgres-connector</div>
                  <div className="text-emerald-400 text-[11px]">PLUGIN: pgoutput</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400">CURRENT LSN / WAL OFFSET</div>
                  <div className="text-amber-400 font-bold mt-1">
                    0/{cdcPipeline.getStatus().currentLsn.toString(16).toUpperCase()}
                  </div>
                  <div className="text-slate-500 text-[11px]">TX ID: {cdcPipeline.getStatus().txCounter}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400">TABLES MONITORED</div>
                  <div className="text-cyan-400 font-bold mt-1">Quiz, Question, Attempt, Payment</div>
                  <div className="text-slate-500 text-[11px]">AUTO-SYNC TO ELASTICSEARCH</div>
                </div>
              </div>

              {/* CDC Events Stream */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-slate-300">
                  CAPTURED DEBEZIUM ENVELOPES
                </div>
                <div className="space-y-2">
                  {cdcEvents.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950 text-center text-slate-500 text-xs">
                      No CDC events logged yet. Trigger an exam submission or click "Simulate DB Update Mutation".
                    </div>
                  ) : (
                    cdcEvents.map((ev) => (
                      <div
                        key={ev.eventId}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ev.payload.op === 'c'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : ev.payload.op === 'u'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              OP: {ev.payload.op === 'c' ? 'CREATE' : ev.payload.op === 'u' ? 'UPDATE' : 'DELETE'}
                            </span>
                            <span className="font-bold text-white">
                              TABLE: public.{ev.payload.source.table}
                            </span>
                          </div>
                          <span className="text-slate-500 text-[11px]">
                            LSN: {ev.payload.source.lsn} • {new Date(ev.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px] truncate">
                          {JSON.stringify(ev.payload.after || ev.payload.before)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: APACHE FLINK */}
        {/* ============================================================== */}
        {activeTab === 'flink' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    Apache Flink Stateful Stream Engine
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Event-time window aggregations & Complex Event Processing (CEP) fraud detection
                  </p>
                </div>
              </div>

              {/* Flink Jobs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {flinkStreamEngine.getJobs().map((job) => (
                  <div key={job.jobId} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{job.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                        {job.state}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 font-mono text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Parallelism:</span>
                        <span className="text-slate-200">{job.parallelism} slots</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Throughput:</span>
                        <span className="text-cyan-400">{job.recordsInPerSec} records/s</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CEP Cheating & Anomaly Alerts */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-orange-400 flex items-center justify-between">
                  <span>COMPLEX EVENT PROCESSING (CEP) ALERTS</span>
                  <span className="text-[10px] text-slate-400 font-mono">RULE PATTERN MATCHER</span>
                </div>

                {cepAlerts.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 text-center text-slate-500 text-xs">
                    No CEP anomalies detected in current stream window. Cheating patterns (e.g. submitting 20 MCQs in under 15 seconds) will appear here instantly.
                  </div>
                ) : (
                  cepAlerts.map((alert) => (
                    <div
                      key={alert.alertId}
                      className="p-4 rounded-xl bg-orange-950/30 border border-orange-800/40 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-400" />
                          <span className="font-bold text-white">{alert.patternName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {alert.severity}
                          </span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">
                          Confidence: {Math.round(alert.confidenceScore * 100)}%
                        </span>
                      </div>
                      <p className="text-slate-300 mt-2">{alert.details}</p>
                      <div className="mt-2 text-slate-400 text-[11px] font-mono">
                        Candidate: {alert.userName} • Quiz: {alert.quizTitle} • {new Date(alert.triggeredAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: ELASTICSEARCH */}
        {/* ============================================================== */}
        {activeTab === 'elasticsearch' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-cyan-400" />
                    Elasticsearch Query DSL & BM25 Relevance Engine
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-match full-text indexing, fuzzy token tolerance, facets, and term highlighting
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSearchQuery('bangladsh'); // typo for fuzzy
                      executeSearch('bangladsh');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-xs font-semibold"
                  >
                    Test Typo ("bangladsh")
                  </button>
                </div>
              </div>

              {/* Interactive Query Box */}
              <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800 mb-6">
                <Search className="w-5 h-5 text-slate-400 ml-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    executeSearch(e.target.value);
                  }}
                  placeholder="Execute Elasticsearch Query DSL..."
                  className="bg-transparent border-none outline-none text-white text-xs w-full font-mono"
                />
                <select
                  value={searchFuzziness}
                  onChange={(e) => setSearchFuzziness(e.target.value as any)}
                  className="bg-slate-900 text-xs text-slate-300 font-mono px-3 py-1.5 rounded-lg border border-slate-800 outline-none"
                >
                  <option value="AUTO">Fuzziness: AUTO</option>
                  <option value="1">Fuzziness: 1</option>
                  <option value="0">Fuzziness: Exact</option>
                </select>
              </div>

              {/* Search Result Statistics */}
              {searchResult && (
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-4 px-1">
                  <span>
                    Found <strong className="text-white">{searchResult.hits.total.value}</strong> hits in{' '}
                    <strong className="text-emerald-400">{searchResult.took} ms</strong> (Max Score:{' '}
                    {searchResult.hits.max_score.toFixed(2)})
                  </span>
                  <span>Index: exampro-quizzes</span>
                </div>
              )}

              {/* Hits Listing */}
              <div className="space-y-3">
                {searchResult?.hits.hits.map((hit) => (
                  <div
                    key={hit._id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-bold text-white text-sm">
                        {hit.highlight?.title ? (
                          <span
                            dangerouslySetInnerHTML={{ __html: hit.highlight.title[0] }}
                          />
                        ) : (
                          hit._source.title
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                        Score: {hit._score}
                      </span>
                    </div>

                    <div className="text-slate-300 text-xs mt-1">
                      {hit.highlight?.description ? (
                        <span
                          dangerouslySetInnerHTML={{ __html: hit.highlight.description[0] }}
                        />
                      ) : (
                        hit._source.description
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-3 text-[11px] font-mono text-slate-400">
                      <span>Subject: {hit._source.subjectName}</span>
                      <span>Difficulty: {hit._source.difficulty}</span>
                      <span>{hit._source.isPaid ? 'Paid Pro' : 'Free'}</span>
                      <span>Duration: {hit._source.durationMinutes} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: PAYMENT MICROSERVICE & LEDGER */}
        {/* ============================================================== */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    Dedicated Payment Microservice & Double-Entry Ledger
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-gateway orchestration (bKash / Nagad), idempotency key safety, and double-entry accounting
                  </p>
                </div>
              </div>

              {/* Simulation Form */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-6 space-y-4">
                <div className="text-xs font-mono font-bold text-slate-300">
                  DISPATCH CHECKOUT WITH IDEMPOTENCY KEY
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400">Gateway</label>
                    <select
                      value={simGateway}
                      onChange={(e) => setSimGateway(e.target.value as any)}
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="BKASH">bKash (Tokenized API)</option>
                      <option value="NAGAD">Nagad (Direct Merchant)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Amount (BDT)</label>
                    <input
                      type="number"
                      value={simAmount}
                      onChange={(e) => setSimAmount(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Idempotency-Key Header</label>
                    <input
                      type="text"
                      value={simIdempKey}
                      onChange={(e) => setSimIdempKey(e.target.value)}
                      className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono truncate"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSimulatePayment}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                    >
                      Execute Checkout
                    </button>
                  </div>
                </div>

                {paymentNotice && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono">
                    {paymentNotice}
                  </div>
                )}
              </div>

              {/* Double-Entry Ledger Table */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                  <span>DOUBLE-ENTRY ACCOUNTING LEDGER</span>
                  <span className="text-[10px] text-emerald-400">BALANCED DEBIT = CREDIT</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Account</th>
                        <th className="p-3">Direction</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Narration</th>
                        <th className="p-3">Transaction</th>
                        <th className="p-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {ledger.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-900/60">
                          <td className="p-3 font-bold text-slate-200">{entry.account}</td>
                          <td className="p-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                entry.direction === 'DEBIT'
                                  ? 'bg-cyan-500/20 text-cyan-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {entry.direction}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-white">৳{entry.amount.toFixed(2)}</td>
                          <td className="p-3 text-slate-400">{entry.narration}</td>
                          <td className="p-3 text-amber-400">{entry.transactionId}</td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 8: MICROSERVICES & MIDDLEWARES */}
        {/* ============================================================== */}
        {activeTab === 'microservices' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-indigo-400" />
                    Microservices Registry & Middlewares Pipeline
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Service health, circuit breaker states, and modular request interceptors
                  </p>
                </div>
              </div>

              {/* Microservices Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {services.map((srv) => (
                  <div key={srv.serviceId} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{srv.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        {srv.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 font-mono text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Port:</span>
                        <span className="text-slate-200">:{srv.port}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Circuit:</span>
                        <span
                          className={`font-bold ${
                            srv.circuitState === 'CLOSED' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {srv.circuitState}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Latency:</span>
                        <span className="text-cyan-400">{srv.avgLatencyMs} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Requests:</span>
                        <span className="text-slate-200">{srv.requestCount}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={() => {
                          serviceRegistry.toggleCircuitBreaker(srv.serviceId);
                          refreshData();
                        }}
                        className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-700 font-mono"
                      >
                        Toggle Circuit Breaker
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Middlewares Pipeline Diagram */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs font-mono font-bold text-slate-300 mb-3">
                  HTTP REQUEST MIDDLEWARES CHAIN
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono text-center">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-indigo-400 font-bold">1. Correlation ID</div>
                    <div className="text-[10px] text-slate-400 mt-1">X-Correlation-ID</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-cyan-400 font-bold">2. Rate Limiter</div>
                    <div className="text-[10px] text-slate-400 mt-1">Token Bucket (60/m)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-purple-400 font-bold">3. Auth0 JWT</div>
                    <div className="text-[10px] text-slate-400 mt-1">RS256 Bearer</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-amber-400 font-bold">4. Idempotency</div>
                    <div className="text-[10px] text-slate-400 mt-1">Idempotency-Key</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-emerald-400 font-bold">5. RBAC Guard</div>
                    <div className="text-[10px] text-slate-400 mt-1">Roles & Scopes</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-rose-400 font-bold">6. RFC 7807</div>
                    <div className="text-[10px] text-slate-400 mt-1">Problem Details</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
