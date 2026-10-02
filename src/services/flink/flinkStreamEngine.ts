import {
  FlinkJobStats,
  FlinkWindowSummary,
  FlinkCepAlert
} from '../../types/architecture';
import { kafkaClient } from '../kafka/kafkaClient';
import { QuizAttempt, Quiz } from '../../types';

class FlinkStreamEngine {
  private jobs: FlinkJobStats[] = [];
  private windowSummaries: FlinkWindowSummary[] = [];
  private cepAlerts: FlinkCepAlert[] = [];
  private recordsInCounter = 18420;
  private recordsOutCounter = 17950;
  private attemptHistory: Map<string, { timestamp: number; score: number; quizId: string }[]> = new Map();

  constructor() {
    this.initDefaultJobs();
    this.initDefaultWindows();

    // Subscribe to Kafka attempts topic to process streaming records
    kafkaClient.subscribe('exampro.attempts.events', (record) => {
      this.processAttemptStream(record.value);
    });
  }

  private initDefaultJobs() {
    this.jobs = [
      {
        jobId: 'flink-job-attempt-aggregator',
        name: 'Tumbling Window Attempt Aggregator (5m)',
        state: 'RUNNING',
        uptimeSeconds: 84200,
        recordsInPerSec: 142.5,
        recordsOutPerSec: 139.8,
        watermark: new Date().toISOString(),
        parallelism: 8,
      },
      {
        jobId: 'flink-job-cep-fraud-detector',
        name: 'CEP Anomaly & Cheating Pattern Engine',
        state: 'RUNNING',
        uptimeSeconds: 84200,
        recordsInPerSec: 88.2,
        recordsOutPerSec: 2.1,
        watermark: new Date().toISOString(),
        parallelism: 4,
      },
      {
        jobId: 'flink-job-leaderboard-sliding',
        name: 'Real-Time Sliding Rank Aggregator (10m slide 1m)',
        state: 'RUNNING',
        uptimeSeconds: 84200,
        recordsInPerSec: 110.0,
        recordsOutPerSec: 108.4,
        watermark: new Date().toISOString(),
        parallelism: 6,
      },
    ];
  }

  private initDefaultWindows() {
    this.windowSummaries = [
      {
        windowStart: new Date(Date.now() - 300000).toISOString(),
        windowEnd: new Date().toISOString(),
        windowType: 'TUMBLING',
        durationSeconds: 300,
        totalAttempts: 48,
        averageScore: 14.8,
        passPercentage: 68.4,
        topScorer: {
          userId: 'usr-student-pro',
          userName: 'Tasmia Sultana',
          score: 19.25,
        },
      },
      {
        windowStart: new Date(Date.now() - 600000).toISOString(),
        windowEnd: new Date(Date.now() - 300000).toISOString(),
        windowType: 'TUMBLING',
        durationSeconds: 300,
        totalAttempts: 52,
        averageScore: 13.9,
        passPercentage: 62.1,
        topScorer: {
          userId: 'usr-student-top',
          userName: 'Nafis Sadik',
          score: 18.75,
        },
      },
    ];
  }

  /**
   * Process streaming attempt through Flink operators and CEP patterns
   */
  public processAttemptStream(payload: { attempt: QuizAttempt; quiz?: Quiz; userName?: string }) {
    if (!payload?.attempt) return;

    const { attempt, quiz, userName = 'Candidate' } = payload;
    this.recordsInCounter++;
    this.recordsOutCounter++;

    // 1. CEP Rule: Rapid Fire Submission Check
    // If completed in < 15 seconds for a test with >= 10 questions and high score
    const questionsCount = attempt.answers?.length || 10;
    if (attempt.timeSpentSeconds < 15 && questionsCount >= 10 && attempt.accuracyPercentage > 75) {
      const alert: FlinkCepAlert = {
        alertId: `cep-alert-${Date.now()}`,
        patternName: 'RAPID_FIRE_CHEATING',
        severity: 'CRITICAL',
        userId: attempt.userId,
        userName,
        quizId: attempt.quizId,
        quizTitle: quiz?.title || 'BCS Model Test',
        details: `Suspicious submission velocity: completed ${questionsCount} MCQs in ${attempt.timeSpentSeconds}s with ${attempt.accuracyPercentage}% accuracy.`,
        triggeredAt: new Date().toISOString(),
        confidenceScore: 0.94,
      };

      this.cepAlerts.unshift(alert);
      kafkaClient.produce('exampro.flink.fraud-alerts', alert.userId, alert, [
        { key: 'cep.rule', value: 'RAPID_FIRE_CHEATING' },
        { key: 'severity', value: 'CRITICAL' },
      ]);
    }

    // 2. Track student submission history for brute force pattern
    const history = this.attemptHistory.get(attempt.userId) || [];
    const now = Date.now();
    history.push({ timestamp: now, score: attempt.score, quizId: attempt.quizId });
    // Keep last 10 minutes
    const recent = history.filter((h) => now - h.timestamp < 600000);
    this.attemptHistory.set(attempt.userId, recent);

    // CEP Rule: Brute force rapid submission
    if (recent.filter((h) => h.quizId === attempt.quizId).length >= 4) {
      const alert: FlinkCepAlert = {
        alertId: `cep-alert-${Date.now()}`,
        patternName: 'BRUTE_FORCE_SUBMISSION',
        severity: 'HIGH',
        userId: attempt.userId,
        userName,
        quizId: attempt.quizId,
        quizTitle: quiz?.title || 'BCS Model Test',
        details: `Candidate executed 4+ attempts on the same test in less than 10 minutes.`,
        triggeredAt: new Date().toISOString(),
        confidenceScore: 0.88,
      };

      this.cepAlerts.unshift(alert);
      kafkaClient.produce('exampro.flink.fraud-alerts', alert.userId, alert, [
        { key: 'cep.rule', value: 'BRUTE_FORCE_SUBMISSION' },
        { key: 'severity', value: 'HIGH' },
      ]);
    }

    // 3. Update Tumbling Window aggregator
    if (this.windowSummaries.length > 0) {
      const currentWindow = this.windowSummaries[0];
      currentWindow.totalAttempts++;
      currentWindow.averageScore =
        Math.round(((currentWindow.averageScore + attempt.score) / 2) * 10) / 10;
      if (attempt.score > (currentWindow.topScorer?.score || 0)) {
        currentWindow.topScorer = {
          userId: attempt.userId,
          userName,
          score: attempt.score,
        };
      }
    }
  }

  public getJobs(): FlinkJobStats[] {
    return this.jobs.map((j) => ({
      ...j,
      watermark: new Date().toISOString(),
    }));
  }

  public getWindowSummaries(): FlinkWindowSummary[] {
    return this.windowSummaries;
  }

  public getCepAlerts(): FlinkCepAlert[] {
    return this.cepAlerts;
  }
}

export const flinkStreamEngine = new FlinkStreamEngine();
