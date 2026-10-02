import {
  EsQuizDocument,
  EsQuestionDocument,
  EsSearchQuery,
  EsSearchResult,
  EsHit,
} from '../../types/architecture';
import { Quiz, Question, Subject, Category } from '../../types';

class ElasticsearchEngine {
  private quizIndex: Map<string, EsQuizDocument> = new Map();
  private questionIndex: Map<string, EsQuestionDocument> = new Map();
  private queryCount = 0;
  private totalTookMs = 0;

  constructor() {}

  /**
   * Bulk loads initial database snapshot into Elasticsearch indices
   */
  public initializeIndices(
    quizzes: Quiz[],
    subjects: Subject[],
    categories: Category[],
    questions: Record<string, Question[]>
  ) {
    this.quizIndex.clear();
    this.questionIndex.clear();

    const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // Index Quizzes
    quizzes.forEach((q) => {
      const doc: EsQuizDocument = {
        id: q.id,
        title: q.title,
        slug: q.slug,
        description: q.description,
        subjectId: q.subjectId,
        subjectName: subjectMap.get(q.subjectId) || 'General',
        categoryId: q.categoryId,
        categoryName: categoryMap.get(q.categoryId) || 'General',
        difficulty: q.difficulty,
        isPaid: q.isPaid,
        price: q.price,
        durationMinutes: q.durationMinutes,
        totalQuestions: q.totalQuestions,
        passMarks: q.passMarks,
        tags: [
          'BCS',
          q.difficulty.toLowerCase(),
          q.isPaid ? 'paid' : 'free',
          subjectMap.get(q.subjectId)?.toLowerCase() || '',
        ],
        createdAt: q.createdAt,
      };
      this.quizIndex.set(q.id, doc);
    });

    // Index Questions
    Object.entries(questions).forEach(([quizId, qList]) => {
      const quiz = quizzes.find((q) => q.id === quizId);
      qList.forEach((question) => {
        const doc: EsQuestionDocument = {
          id: question.id,
          quizId,
          quizTitle: quiz?.title || 'BCS Exam',
          text: question.text,
          explanation: question.explanation,
          difficulty: question.difficulty,
          subjectId: quiz?.subjectId || 'subj-bangla',
          tags: ['mcq', question.difficulty.toLowerCase()],
        };
        this.questionIndex.set(question.id, doc);
      });
    });
  }

  /**
   * Upsert single Quiz Document (called by CDC Pipeline)
   */
  public indexQuiz(doc: EsQuizDocument) {
    this.quizIndex.set(doc.id, doc);
  }

  public deleteQuiz(id: string) {
    this.quizIndex.delete(id);
  }

  /**
   * Calculate string similarity / Levenshtein distance for fuzzy queries
   */
  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Tokenizer & normalizer
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u0980-\u09FF]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1);
  }

  /**
   * Execute Elasticsearch Query DSL on `exampro-quizzes` index
   */
  public searchQuizzes(query: EsSearchQuery): EsSearchResult<EsQuizDocument> {
    const startTime = performance.now();
    this.queryCount++;

    const rawTerms = query.q ? this.tokenize(query.q) : [];
    const allDocs = Array.from(this.quizIndex.values());

    const hits: EsHit<EsQuizDocument>[] = [];

    // Filter and score documents
    for (const doc of allDocs) {
      // 1. Structured filters
      if (query.subjectId && query.subjectId !== 'ALL' && doc.subjectId !== query.subjectId) {
        continue;
      }
      if (query.difficulty && query.difficulty !== 'ALL' && doc.difficulty !== query.difficulty) {
        continue;
      }
      if (query.isPaid !== undefined && doc.isPaid !== query.isPaid) {
        continue;
      }

      // 2. BM25 / Text relevance scoring
      let score = 1.0;
      const highlightMap: Record<string, string[]> = {};

      if (rawTerms.length > 0) {
        let matched = false;
        const titleTokens = this.tokenize(doc.title);
        const descTokens = this.tokenize(doc.description);
        const subTokens = this.tokenize(doc.subjectName);

        for (const term of rawTerms) {
          // Exact match in title (boost x3.0)
          if (doc.title.toLowerCase().includes(term)) {
            score += 3.5;
            matched = true;
            highlightMap['title'] = [
              doc.title.replace(
                new RegExp(`(${term})`, 'gi'),
                '<mark class="bg-amber-200 dark:bg-amber-800 text-amber-950 dark:text-amber-100 px-1 rounded font-bold">$1</mark>'
              ),
            ];
          }

          // Match in description (boost x1.5)
          if (doc.description.toLowerCase().includes(term)) {
            score += 1.8;
            matched = true;
            highlightMap['description'] = [
              doc.description.replace(
                new RegExp(`(${term})`, 'gi'),
                '<mark class="bg-amber-200 dark:bg-amber-800 text-amber-950 dark:text-amber-100 px-1 rounded font-bold">$1</mark>'
              ),
            ];
          }

          // Match in subject name
          if (doc.subjectName.toLowerCase().includes(term)) {
            score += 2.0;
            matched = true;
          }

          // Fuzzy match if fuzziness is enabled
          if (!matched && (query.fuzziness === 'AUTO' || query.fuzziness === '1' || query.fuzziness === '2')) {
            const fuzzyThreshold = query.fuzziness === '2' ? 2 : 1;
            for (const tToken of [...titleTokens, ...subTokens]) {
              if (Math.abs(tToken.length - term.length) <= fuzzyThreshold) {
                const dist = this.levenshtein(term, tToken);
                if (dist <= fuzzyThreshold) {
                  score += 1.2;
                  matched = true;
                  break;
                }
              }
            }
          }
        }

        if (!matched) {
          continue; // No match found for text query
        }
      }

      hits.push({
        _index: 'exampro-quizzes',
        _id: doc.id,
        _score: Math.round(score * 100) / 100,
        _source: doc,
        highlight: Object.keys(highlightMap).length > 0 ? highlightMap : undefined,
      });
    }

    // Sort by _score descending
    hits.sort((a, b) => b._score - a._score);

    // Pagination
    const from = query.from || 0;
    const size = query.size || 20;
    const paginatedHits = hits.slice(from, from + size);

    // Compute Facet Aggregations
    const bySubjectMap = new Map<string, number>();
    const byDiffMap = new Map<string, number>();
    const byPriceMap = new Map<string, number>();

    hits.forEach((h) => {
      bySubjectMap.set(h._source.subjectName, (bySubjectMap.get(h._source.subjectName) || 0) + 1);
      byDiffMap.set(h._source.difficulty, (byDiffMap.get(h._source.difficulty) || 0) + 1);
      const priceKey = h._source.isPaid ? 'Paid' : 'Free';
      byPriceMap.set(priceKey, (byPriceMap.get(priceKey) || 0) + 1);
    });

    const took = Math.max(1, Math.round(performance.now() - startTime));
    this.totalTookMs += took;

    return {
      took,
      timed_out: false,
      hits: {
        total: { value: hits.length, relation: 'eq' },
        max_score: hits.length > 0 ? hits[0]._score : 0,
        hits: paginatedHits,
      },
      aggregations: {
        by_subject: {
          buckets: Array.from(bySubjectMap.entries()).map(([k, v]) => ({ key: k, doc_count: v })),
        },
        by_difficulty: {
          buckets: Array.from(byDiffMap.entries()).map(([k, v]) => ({ key: k, doc_count: v })),
        },
        by_pricing: {
          buckets: Array.from(byPriceMap.entries()).map(([k, v]) => ({ key: k, doc_count: v })),
        },
      },
    };
  }

  public getIndexStats() {
    return {
      clusterName: 'exampro-es-cluster-prod',
      status: 'green',
      nodesCount: 3,
      quizzesCount: this.quizIndex.size,
      questionsCount: this.questionIndex.size,
      totalQueriesExecuted: this.queryCount,
      avgLatencyMs: this.queryCount > 0 ? Math.round((this.totalTookMs / this.queryCount) * 10) / 10 : 1.4,
    };
  }
}

export const elasticsearchEngine = new ElasticsearchEngine();
