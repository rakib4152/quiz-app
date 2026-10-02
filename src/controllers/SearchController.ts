import { EsSearchQuery } from '../types/architecture';
import { elasticsearchEngine } from '../services/elasticsearch/elasticsearchClient';
import { runMiddlewarePipeline } from '../middleware';

export class SearchController {
  /**
   * Search quizzes using Elasticsearch BM25 engine with highlighting and facets
   */
  public static async searchQuizzes(query: EsSearchQuery, reqHeaders: Record<string, string> = {}) {
    const pipeline = runMiddlewarePipeline({ method: 'GET', headers: reqHeaders });

    const result = elasticsearchEngine.searchQuizzes(query);

    return {
      success: true,
      result,
      correlationId: pipeline.ctx.correlationId,
      cached: false,
    };
  }

  /**
   * Get Elasticsearch cluster status and statistics
   */
  public static async getIndexStats() {
    return {
      success: true,
      stats: elasticsearchEngine.getIndexStats(),
    };
  }
}
