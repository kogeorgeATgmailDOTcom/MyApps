/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Upload, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  Calendar as CalendarIcon,
  FileText,
  Loader2,
  ExternalLink,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { Holding, AnalysisResult } from './types';
import { analyzeHoldings } from './services/geminiService';
import { cn } from './lib/utils';

export default function App() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [referenceDate, setReferenceDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedHoldings: Holding[] = results.data.map((row: any) => ({
          symbol: row.symbol || row.Symbol || row.ticker || row.Ticker || '',
          shares: parseFloat(row.shares || row.Shares || '0'),
          costBasis: parseFloat(row.costBasis || row.CostBasis || '0'),
        })).filter(h => h.symbol !== '');

        if (parsedHoldings.length === 0) {
          setError("No valid stock symbols found in CSV. Ensure you have a 'symbol' column.");
        } else {
          setHoldings(parsedHoldings);
          setError(null);
        }
      },
      error: (err) => {
        setError("Error parsing CSV: " + err.message);
      }
    });
  };

  const startAnalysis = async () => {
    if (holdings.length === 0) {
      setError("Please upload your holdings first.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeHoldings(holdings, referenceDate);
      setResults(analysis.sort((a, b) => b.priority - a.priority));
    } catch (err) {
      setError("Analysis failed. Please try again.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-white/10 py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">StockPulse</h1>
              <p className="text-xs text-white/50 uppercase tracking-widest">Market Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
                <span className="text-[10px] text-white/40 uppercase font-mono">System Status</span>
                <span className="text-xs text-green-400 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Live Feed Active
                </span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-8">
            <section className="space-y-4">
              <h2 className="text-sm font-mono text-white/40 uppercase tracking-widest">Configuration</h2>
              
              <div className="glass p-6 rounded-2xl space-y-6">
                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/60">Holdings CSV</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={cn(
                      "border-2 border-dashed border-white/10 rounded-xl p-8 transition-all duration-300 group-hover:border-blue-500/50 group-hover:bg-blue-500/5 flex flex-col items-center text-center gap-3",
                      holdings.length > 0 && "border-blue-500/30 bg-blue-500/5"
                    )}>
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-white/40 group-hover:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {holdings.length > 0 ? `${holdings.length} Positions Loaded` : "Upload Holdings"}
                        </p>
                        <p className="text-xs text-white/40 mt-1">Drag & drop or click to browse</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/60">Analysis Reference Point</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input 
                      type="datetime-local" 
                      value={referenceDate}
                      onChange={(e) => setReferenceDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-white/30 italic">Analyzing 16 hours prior to this point</p>
                </div>

                {/* Action Button */}
                <button 
                  onClick={startAnalysis}
                  disabled={isAnalyzing || holdings.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Market...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Run Pulse Check
                    </>
                  )}
                </button>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-200 leading-relaxed">{error}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Holdings Preview */}
            {holdings.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-sm font-mono text-white/40 uppercase tracking-widest">Portfolio Preview</h2>
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto">
                    {holdings.map((h, i) => (
                      <div key={i} className="data-row p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold">
                            {h.symbol.slice(0, 2)}
                          </div>
                          <span className="font-mono font-medium">{h.symbol}</span>
                        </div>
                        <span className="text-xs text-white/40">{h.shares} Shares</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono text-white/40 uppercase tracking-widest">Analysis Results</h2>
              {results.length > 0 && (
                <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                  {results.length} Stocks Analyzed
                </span>
              )}
            </div>

            <div className="space-y-4">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <TrendingUp className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium">Scanning US Market News</p>
                    <p className="text-sm text-white/40 max-w-xs mx-auto">
                      Gemini is currently processing news feeds, earnings calls, and regulatory filings for your holdings.
                    </p>
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-6">
                  {results.map((result, i) => (
                    <motion.div 
                      key={result.symbol}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass rounded-2xl overflow-hidden"
                    >
                      <div 
                        className="p-6 cursor-pointer hover:bg-white/[0.02] transition-colors"
                        onClick={() => setExpandedSymbol(expandedSymbol === result.symbol ? null : result.symbol)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex flex-col items-center justify-center",
                              result.priority >= 8 ? "bg-red-500/20 text-red-500" : 
                              result.priority >= 5 ? "bg-orange-500/20 text-orange-500" : 
                              "bg-blue-500/20 text-blue-500"
                            )}>
                              <span className="text-[10px] font-mono uppercase leading-none mb-1">Priority</span>
                              <span className="text-xl font-bold leading-none">{result.priority}</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold font-mono">{result.symbol}</h3>
                              <p className="text-sm text-white/60 mt-1 line-clamp-1">{result.summary}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {expandedSymbol === result.symbol ? <ChevronDown className="w-5 h-5 text-white/20" /> : <ChevronRight className="w-5 h-5 text-white/20" />}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedSymbol === result.symbol && (
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-white/5"
                          >
                            <div className="p-6 bg-white/[0.01] space-y-6">
                              <div className="space-y-3">
                                <h4 className="text-xs font-mono text-white/30 uppercase tracking-widest">Detailed Summary</h4>
                                <p className="text-sm leading-relaxed text-white/80">{result.summary}</p>
                              </div>

                              <div className="space-y-4">
                                <h4 className="text-xs font-mono text-white/30 uppercase tracking-widest">Source Events</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {result.news.map((item, j) => (
                                    <div key={j} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3 flex flex-col justify-between">
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className={cn(
                                            "text-[10px] font-mono px-2 py-0.5 rounded uppercase",
                                            item.impact === 'high' ? "bg-red-500/20 text-red-400" :
                                            item.impact === 'medium' ? "bg-orange-500/20 text-orange-400" :
                                            "bg-blue-500/20 text-blue-400"
                                          )}>
                                            {item.impact} Impact
                                          </span>
                                          <span className="text-[10px] text-white/30 font-mono">{item.source}</span>
                                        </div>
                                        <h5 className="text-sm font-semibold leading-snug">{item.title}</h5>
                                        <p className="text-xs text-white/50 line-clamp-3">{item.summary}</p>
                                      </div>
                                      <a 
                                        href={item.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1.5 pt-2"
                                      >
                                        View Source <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-3xl">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <FileText className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/40 font-medium">No analysis data available</p>
                  <p className="text-xs text-white/20 mt-2">Upload your holdings and run a pulse check to see results</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
            © 2026 StockPulse Intelligence Engine • Powered by Gemini 3.1
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[10px] text-white/30 hover:text-white transition-colors font-mono uppercase tracking-widest">API Documentation</a>
            <a href="#" className="text-[10px] text-white/30 hover:text-white transition-colors font-mono uppercase tracking-widest">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
