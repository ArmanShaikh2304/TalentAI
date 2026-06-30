import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Auth Interceptors ───

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('talentai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if already on the login endpoint
      const requestUrl = error.config?.url || '';
      if (!requestUrl.includes('/api/auth/')) {
        localStorage.removeItem('talentai_token');
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth Endpoints ───

export async function loginUser(email: string, password: string) {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data;
}

export async function logoutUser(token: string) {
  const { data } = await api.post('/api/auth/logout', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function getCurrentUser(token: string) {
  const { data } = await api.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

// ─── JD Endpoints ───

export async function analyzeJD(description: string, title?: string, company?: string) {
  const { data } = await api.post('/api/jd/analyze', {
    description,
    title: title || '',
    company: company || '',
  });
  return data;
}

export async function getJD(jdId: string) {
  const { data } = await api.get(`/api/jd/${jdId}`);
  return data;
}

// ─── Candidate Endpoints ───

export async function uploadCandidates(candidates: any[]) {
  const { data } = await api.post('/api/candidates/upload', { candidates });
  return data;
}

export async function listCandidates() {
  const { data } = await api.get('/api/candidates');
  return data;
}

export async function clearCandidates() {
  const { data } = await api.delete('/api/candidates');
  return data;
}

// ─── Analysis Endpoints ───

export async function runAnalysis(jdId: string) {
  const { data } = await api.post('/api/analysis/run', { jd_id: jdId });
  return data;
}

export async function getAnalysisResults(analysisId: string) {
  const { data } = await api.get(`/api/analysis/${analysisId}/results`);
  return data;
}

export async function compareCandidates(analysisId: string, candidateIds: string[]) {
  const { data } = await api.post(`/api/analysis/${analysisId}/compare`, {
    candidate_ids: candidateIds,
  });
  return data;
}

export async function getAnalysisStats(analysisId: string) {
  const { data } = await api.get(`/api/analysis/${analysisId}/stats`);
  return data;
}

// ─── Export Endpoints ───

export function getExportCSVUrl(analysisId: string) {
  return `${API_BASE}/api/export/csv/${analysisId}`;
}

export function getExportShortlistedUrl(analysisId: string) {
  return `${API_BASE}/api/export/shortlisted/${analysisId}`;
}

/**
 * Download shortlisted candidates as Excel file.
 * Sends the user's manually shortlisted candidate IDs to the backend.
 * Uses fetch with auth token for binary file download.
 */
export async function downloadShortlistedExcel(analysisId: string, candidateIds: string[]): Promise<{ success: boolean; message?: string }> {
  if (!candidateIds || candidateIds.length === 0) {
    return { success: false, message: 'No shortlisted candidates available. Please shortlist candidates first.' };
  }

  const token = localStorage.getItem('talentai_token');

  const response = await fetch(`${API_BASE}/api/export/shortlisted/${analysisId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ candidate_ids: candidateIds }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Export failed' }));
    return { success: false, message: errorData.detail || 'Export failed' };
  }

  // Convert response to blob and trigger download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  // Extract filename from Content-Disposition header or use default
  const disposition = response.headers.get('Content-Disposition');
  let filename = `Shortlisted_Candidates.xlsx`;
  if (disposition) {
    const match = disposition.match(/filename=(.+)/);
    if (match) filename = match[1];
  }

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  return { success: true };
}
