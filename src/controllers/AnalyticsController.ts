import { kafkaClient } from '../services/kafka/kafkaClient';
import { flinkStreamEngine } from '../services/flink/flinkStreamEngine';
import { cdcPipeline } from '../services/cdc/cdcPipeline';
import { serviceRegistry } from '../services/microservices/serviceRegistry';

export class AnalyticsController {
  /**
   * Get real-time system streaming telemetry: Flink jobs, Kafka topics, CDC status
   */
  public static async getSystemTelemetry() {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      microservices: serviceRegistry.getServices(),
      kafka: {
        topics: kafkaClient.getTopics(),
        consumerGroups: kafkaClient.getConsumerGroups(),
        totalMessages: kafkaClient.getTotalMessagesCount(),
        recentRecords: kafkaClient.getRecords(15),
      },
      flink: {
        jobs: flinkStreamEngine.getJobs(),
        windows: flinkStreamEngine.getWindowSummaries(),
        alerts: flinkStreamEngine.getCepAlerts(),
      },
      cdc: {
        status: cdcPipeline.getStatus(),
        recentEvents: cdcPipeline.getEvents(15),
      },
    };
  }

  /**
   * Trigger simulated Kafka load or test event
   */
  public static async simulateKafkaTraffic() {
    const randomScore = Math.floor(Math.random() * 20) + 5;
    const testRecord = kafkaClient.produce(
      'exampro.attempts.events',
      `sim-usr-${Date.now().toString(36)}`,
      {
        attempt: {
          id: `sim-att-${Date.now()}`,
          userId: 'sim-usr-candidate',
          quizId: 'quiz-bcs-model-1',
          score: randomScore,
          totalMarks: 20,
          accuracyPercentage: Math.round((randomScore / 20) * 100),
          timeSpentSeconds: 45,
          passed: randomScore >= 12,
        },
        userName: 'Simulated Candidate',
      },
      [{ key: 'simulation', value: 'true' }]
    );

    return {
      success: true,
      message: 'Simulated attempt event published to Kafka broker',
      record: testRecord,
    };
  }
}
