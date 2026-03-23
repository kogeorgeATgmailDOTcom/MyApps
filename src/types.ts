export interface Holding {
  symbol: string;
  shares?: number;
  costBasis?: number;
}

export interface NewsItem {
  symbol: string;
  title: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  source: string;
  url: string;
}

export interface AnalysisResult {
  symbol: string;
  priority: number; // 1-10
  summary: string;
  news: NewsItem[];
}
