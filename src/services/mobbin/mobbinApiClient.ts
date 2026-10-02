/**
 * Mobbin UI/UX Design System & API Integration Service
 * Connects to Mobbin's design pattern reference library for mobile and web screens,
 * UI flows, design tokens, and components inspired by top EdTech & Assessment applications
 * (Duolingo, Brilliant, Quizlet, Khan Academy, Elevate, Linear).
 */

export interface MobbinScreen {
  id: string;
  title: string;
  app: string;
  platform: 'iOS' | 'Android' | 'Web';
  category: 'Quiz & Exam' | 'Paywall & Pro' | 'Leaderboard & Gamification' | 'Onboarding' | 'Results & Analytics';
  pattern: string;
  description: string;
  thumbnailUrl: string;
  designTokens: {
    fontFamily: string;
    borderRadius: string;
    primaryColor: string;
    surfaceColor: string;
    layoutStyle: string;
  };
  keyFeatures: string[];
}

export interface MobbinFlow {
  id: string;
  name: string;
  appName: string;
  screenCount: number;
  tags: string[];
  screens: MobbinScreen[];
}

export interface MobbinApiConfig {
  apiKey?: string;
  endpoint: string;
  activeTheme: 'mobbin-edtech-pro' | 'mobbin-linear-dark' | 'mobbin-apple-clean';
}

export const MOBBIN_CURATED_SCREENS: MobbinScreen[] = [
  {
    id: 'mobbin-scr-quizlet-exam',
    title: 'High-Stakes Timed Assessment Flow',
    app: 'Quizlet / Brilliant',
    platform: 'Web',
    category: 'Quiz & Exam',
    pattern: 'Focused Test Mode',
    description: 'Minimalist header with countdown timer, clean A/B/C/D option cards with subtle keyboard focus rings, and bottom navigation dock.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop',
    designTokens: {
      fontFamily: 'Plus Jakarta Sans',
      borderRadius: '12px',
      primaryColor: '#059669', // Emerald 600
      surfaceColor: '#ffffff',
      layoutStyle: 'Single-Column Constrained (768px)',
    },
    keyFeatures: [
      'Top continuous timer bar with pulsing warning under 5 minutes',
      'Option cards with zero-pill metadata and subtle hairline borders',
      'Keyboard shortcuts (A, B, C, D) for lightning-fast BCS response',
      'Question palette drawer for jumping between 100 questions',
    ],
  },
  {
    id: 'mobbin-scr-duolingo-paywall',
    title: 'Super/Pro Pass Paywall Flow',
    app: 'Duolingo / Blinkist',
    platform: 'iOS',
    category: 'Paywall & Pro',
    pattern: 'Annual vs Monthly Value Anchor',
    description: 'Clear value proposition with feature checklists, popular badge tag on Annual tier, and instant bKash/Nagad one-click CTA.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=400&fit=crop',
    designTokens: {
      fontFamily: 'Cabinet Grotesk',
      borderRadius: '16px',
      primaryColor: '#D97706', // Amber 600
      surfaceColor: '#F8FAFC',
      layoutStyle: 'Stacked Tier Comparison Cards',
    },
    keyFeatures: [
      'Best Value ribbon on 12-Month BCS Master plan',
      'Feature comparison matrix with checkmark indicators',
      'Immediate localized payment icons (bKash, Nagad, Cards)',
      '30-day money-back guarantee trust signal',
    ],
  },
  {
    id: 'mobbin-scr-khan-analytics',
    title: 'Subject Mastery & Performance Analytics',
    app: 'Khan Academy / Elevate',
    platform: 'Web',
    category: 'Results & Analytics',
    pattern: 'Radial Score Gauge & Delta',
    description: 'Visual exam breakdown with net negative score deductions, percentile ranking against 50,000 candidates, and question review mode.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
    designTokens: {
      fontFamily: 'Satoshi',
      borderRadius: '16px',
      primaryColor: '#2563EB', // Blue 600
      surfaceColor: '#FFFFFF',
      layoutStyle: 'Bento Grid Dashboard Layout',
    },
    keyFeatures: [
      'Radial accuracy gauge with pass/fail threshold indication',
      'Detailed negative mark deduction telemetry (-0.25 / wrong)',
      'Filterable answer review: All, Correct, Incorrect, Unanswered',
      'Comprehensive BCS syllabus topic mastery progress bars',
    ],
  },
  {
    id: 'mobbin-scr-chess-leaderboard',
    title: 'National Merit Ladder & Leagues',
    app: 'Chess.com / Duolingo Leagues',
    platform: 'Android',
    category: 'Leaderboard & Gamification',
    pattern: 'Top 3 Podium & Sticky Candidate Rank',
    description: 'Podium layout for Top 3 candidates, real-time rank movement indicators, and pinned bottom bar showing your personal standing.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop',
    designTokens: {
      fontFamily: 'Plus Jakarta Sans',
      borderRadius: '12px',
      primaryColor: '#F59E0B', // Amber 500
      surfaceColor: '#0F172A',
      layoutStyle: 'Ranked List with Elevated Top 3 Podium',
    },
    keyFeatures: [
      'Visual gold/silver/bronze podium with candidate avatars',
      'Sticky bottom bar showing active user rank and distance to next spot',
      'Real-time percentile stream updated by Apache Flink',
      'Fast filtering by BCS Batch, University, and District',
    ],
  },
];

class MobbinService {
  private config: MobbinApiConfig = {
    endpoint: 'https://api.mobbin.com/v1',
    activeTheme: 'mobbin-edtech-pro',
  };

  private screens: MobbinScreen[] = MOBBIN_CURATED_SCREENS;

  /**
   * Search Mobbin design reference library
   */
  public searchPatterns(query: string, category?: string): MobbinScreen[] {
    return this.screens.filter((s) => {
      const matchesQ =
        !query ||
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.app.toLowerCase().includes(query.toLowerCase()) ||
        s.pattern.toLowerCase().includes(query.toLowerCase()) ||
        s.keyFeatures.some((f) => f.toLowerCase().includes(query.toLowerCase()));

      const matchesCat = !category || category === 'ALL' || s.category === category;
      return matchesQ && matchesCat;
    });
  }

  public getScreenById(id: string): MobbinScreen | undefined {
    return this.screens.find((s) => s.id === id);
  }

  public getAllScreens(): MobbinScreen[] {
    return this.screens;
  }

  public getCategories(): string[] {
    return [
      'ALL',
      'Quiz & Exam',
      'Paywall & Pro',
      'Leaderboard & Gamification',
      'Results & Analytics',
    ];
  }

  public setApiKey(key: string) {
    this.config.apiKey = key;
  }

  public getConfig(): MobbinApiConfig {
    return this.config;
  }

  public setTheme(theme: MobbinApiConfig['activeTheme']) {
    this.config.activeTheme = theme;
  }
}

export const mobbinApiClient = new MobbinService();
