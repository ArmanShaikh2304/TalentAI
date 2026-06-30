import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// ─── Types ───

export interface JDAnalysis {
  jd_id: string;
  title: string;
  technical_skills: SkillRequirement[];
  soft_skills: SkillRequirement[];
  experience: { min_years: number; preferred_years: number; domains: string[] };
  hidden_requirements: string[];
  culture_signals: string[];
  domains: string[];
  raw_description: string;
}

export interface SkillRequirement {
  skill: string;
  proficiency: string;
  criticality: number;
  category: string;
}

export interface WorkHistory {
  company: string;
  role: string;
  years: number;
  achievements: string;
}

export interface CandidateProfile {
  id: string;
  name: string;
  title: string;
  experience_years: number;
  skills: string[];
  work_history: WorkHistory[];
  education: string;
  certifications: string[];
  github: string;
  linkedin_headline: string;
  summary: string;
  location: string;
}

export interface DimensionScore {
  name: string;
  score: number;
  weight: number;
  weighted_score: number;
  explanation: string;
}

export interface SkillMatch {
  skill: string;
  status: 'match' | 'partial' | 'missing';
  candidate_skill: string;
  transfer_score: number;
  explanation: string;
}

export interface CandidateExplanation {
  executive_summary: string;
  strengths: { text: string; evidence: string }[];
  development_areas: { text: string; suggestion: string }[];
  why_this_ranking: string;
  risk_assessment: 'none' | 'low' | 'medium' | 'high';
  risk_details: string[];
  long_term_potential: 'low' | 'medium' | 'high' | 'exceptional';
  potential_explanation: string;
}

export interface CandidateResult {
  candidate_id: string;
  name: string;
  title: string;
  rank: number;
  total_score: number;
  dimensions: DimensionScore[];
  skill_matches: SkillMatch[];
  explanation: CandidateExplanation;
  experience_years: number;
  skills: string[];
  education: string;
  certifications: string[];
  work_history: WorkHistory[];
}

export interface AnalysisSummary {
  total_candidates: number;
  processing_time_seconds: number;
  top_match_score: number;
  avg_score: number;
  recommended_shortlist_count: number;
  shortlist_threshold: number;
}

export interface AnalysisResults {
  analysis_id: string;
  jd_id: string;
  summary: AnalysisSummary;
  ranked_candidates: CandidateResult[];
}

// ─── Store State ───

interface AppState {
  jdAnalysis: JDAnalysis | null;
  candidates: CandidateProfile[];
  analysisResults: AnalysisResults | null;
  comparisonIds: string[];
  isLoading: boolean;
  loadingMessage: string;

  setJDAnalysis: (jd: JDAnalysis | null) => void;
  setCandidates: (candidates: CandidateProfile[]) => void;
  setAnalysisResults: (results: AnalysisResults | null) => void;
  setComparisonIds: (ids: string[]) => void;
  toggleComparison: (id: string) => void;
  setLoading: (loading: boolean, message?: string) => void;
  reset: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [jdAnalysis, setJDAnalysis] = useState<JDAnalysis | null>(null);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const setLoading = useCallback((loading: boolean, message = '') => {
    setIsLoading(loading);
    setLoadingMessage(message);
  }, []);

  const toggleComparison = useCallback((id: string) => {
    setComparisonIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }, []);

  const reset = useCallback(() => {
    setJDAnalysis(null);
    setCandidates([]);
    setAnalysisResults(null);
    setComparisonIds([]);
    setIsLoading(false);
    setLoadingMessage('');
  }, []);

  return (
    <AppContext.Provider value={{
      jdAnalysis, candidates, analysisResults, comparisonIds,
      isLoading, loadingMessage,
      setJDAnalysis, setCandidates, setAnalysisResults,
      setComparisonIds, toggleComparison, setLoading, reset,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
