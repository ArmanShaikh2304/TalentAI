import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type CandidateResult } from '../store/store';
import { downloadShortlistedExcel } from '../services/api';

function ComparisonCard({ candidate, index }: { candidate: CandidateResult; index: number }) {
  const score = Math.round(candidate.total_score);
  const isTop = index === 0;
  const riskLevel = candidate.explanation?.risk_assessment;

  // Get top 2 dimensions for skill bars
  const topDims = candidate.dimensions
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        transition: 'all 300ms ease',
        opacity: index >= 2 ? 0.75 : 1,
      }}
    >
      {/* Top gradient accent for top candidate */}
      {isTop && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '3px',
          background: 'linear-gradient(to right, var(--secondary), var(--tertiary))',
        }} />
      )}

      {/* Header */}
      <div style={{
        padding: 'var(--space-md)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-md)',
      }}>
        {/* Avatar */}
        <div style={{
          width: '64px', height: '64px', borderRadius: 'var(--radius-default)',
          overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)',
          flexShrink: 0, background: 'var(--surface-container-high)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary)', fontWeight: 700, fontSize: '18px',
          filter: index >= 2 ? 'grayscale(1)' : 'none',
          transition: 'filter 300ms ease',
        }}>
          {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>

        <div style={{ flex: 1 }}>
          <div className="flex justify-between items-start">
            <h3 className="font-title-md font-semibold flex items-center gap-sm">
              {candidate.name}
              {isTop && (
                <span style={{
                  width: '8px', height: '8px', borderRadius: 'var(--radius-full)',
                  background: '#10b981', display: 'inline-block',
                  animation: 'pulse-emerald 2s ease-in-out infinite',
                }} />
              )}
            </h3>
            <span className="font-mono-data" style={{
              background: 'rgba(190,198,224,0.2)',
              color: 'var(--primary)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(190,198,224,0.3)',
            }}>
              {score}%
            </span>
          </div>
          <p className="font-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
            {candidate.title}
          </p>
          <p className="font-label-sm flex items-center gap-xs" style={{ color: 'var(--on-surface-variant)', marginTop: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
            {candidate.experience_years}+ yrs experience
          </p>
        </div>
      </div>

      {/* Skill Bars */}
      <div style={{ padding: 'var(--space-md)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {topDims.map(dim => (
          <div key={dim.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label className="font-label-sm uppercase" style={{ color: 'var(--on-surface-variant)' }}>
              {dim.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).split(' ')[0]}
            </label>
            <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${dim.score}%`,
                background: isTop ? 'var(--secondary)' : index === 1 ? 'var(--primary)' : 'var(--tertiary)',
                borderRadius: 'var(--radius-full)',
              }} />
            </div>
          </div>
        ))}

        {/* AI Insight */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{
            background: riskLevel === 'high' ? 'rgba(239,68,68,0.08)' : 'rgba(35,42,54,0.5)',
            padding: '12px',
            borderRadius: 'var(--radius-default)',
            border: `1px solid ${riskLevel === 'high' ? 'rgba(239,68,68,0.2)' : riskLevel === 'medium' ? 'rgba(255,185,95,0.2)' : 'rgba(255,255,255,0.1)'}`,
          }}>
            <p className="font-label-sm font-semibold flex items-center gap-xs" style={{
              color: riskLevel === 'high' ? 'var(--error)' : 'var(--secondary)',
              marginBottom: '4px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {riskLevel === 'high' ? 'warning' : 'psychology'}
              </span>
              {riskLevel === 'high' ? 'Flight Risk' : 'AI Insight'}
            </p>
            <p className="font-body-md" style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--on-surface-variant)' }}>
              {candidate.explanation?.executive_summary?.slice(0, 120) || 'Strong alignment with JD requirements across multiple dimensions.'}
              {(candidate.explanation?.executive_summary?.length || 0) > 120 ? '...' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FilterExportPage() {
  const { analysisResults, jdAnalysis } = useAppStore();
  const [skills, setSkills] = useState(['React', 'Node.js']);
  const [experienceMin] = useState(5);
  const [locationModel, setLocationModel] = useState('hybrid');
  const [hideRedFlags, setHideRedFlags] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  if (!analysisResults) {
    return (
      <div className="empty-state">
        <span className="material-symbols-outlined" style={{ fontSize: '64px', opacity: 0.3, color: 'var(--primary)' }}>filter_list</span>
        <h3 className="font-title-md" style={{ marginTop: '16px' }}>No Analysis Data</h3>
        <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: '8px' }}>
          Run an analysis first to use the filtering and comparison tools.
        </p>
      </div>
    );
  }

  const candidates = analysisResults.ranked_candidates.slice(0, 3);

  const removeSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--space-lg)', height: 'calc(100vh - var(--topbar-height) - 48px)', overflow: 'hidden' }}>
      {/* Filters Sidebar */}
      <aside className="glass-panel-static filter-sidebar" style={{ borderRadius: 'var(--radius-lg)' }}>
        <div className="filter-header">
          <h2 className="font-title-md flex items-center gap-sm" style={{ color: 'var(--primary)', fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>filter_list</span>
            Advanced Filters
          </h2>
          <button className="font-label-sm" style={{ color: 'var(--on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Reset
          </button>
        </div>

        <div style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
          {/* Core Skills */}
          <div>
            <label className="filter-label">Core Skills</label>
            <div className="flex flex-wrap gap-sm" style={{ marginTop: '4px' }}>
              {skills.map(skill => (
                <button
                  key={skill}
                  className="filter-pill active"
                  onClick={() => removeSkill(skill)}
                >
                  {skill}
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                </button>
              ))}
              <button className="filter-pill inactive">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                Add Skill
              </button>
            </div>
          </div>

          {/* Experience Range */}
          <div>
            <div className="flex justify-between items-center">
              <label className="filter-label" style={{ marginBottom: 0 }}>Experience</label>
              <span className="font-mono-data" style={{ color: 'var(--primary)' }}>{experienceMin} - 10 Yrs</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              defaultValue={experienceMin}
              style={{
                width: '100%',
                height: '4px',
                borderRadius: '8px',
                appearance: 'none',
                background: 'var(--surface-container-high)',
                marginTop: '8px',
                cursor: 'pointer',
                accentColor: 'var(--primary)',
              }}
            />
          </div>

          {/* Location */}
          <div>
            <label className="filter-label">Location Model</label>
            <div className="flex flex-col gap-sm" style={{ marginTop: '4px' }}>
              {[
                { value: 'remote', label: 'Remote Only' },
                { value: 'hybrid', label: 'Hybrid (San Francisco)' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-sm" style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="location"
                    checked={locationModel === opt.value}
                    onChange={() => setLocationModel(opt.value)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span className="font-body-md" style={{ fontSize: '14px' }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Red Flags Toggle */}
          <div style={{ paddingTop: 'var(--space-md)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <label className="flex items-center justify-between" style={{ cursor: 'pointer' }}>
              <span className="font-title-md flex items-center gap-sm" style={{ color: 'var(--error)', fontSize: '16px' }}>
                <span className="material-symbols-outlined">warning</span>
                Hide Red Flags
              </span>
              <div
                onClick={() => setHideRedFlags(!hideRedFlags)}
                style={{
                  width: '44px', height: '24px',
                  borderRadius: 'var(--radius-full)',
                  background: hideRedFlags ? 'var(--error)' : 'var(--surface-container-high)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 200ms ease',
                }}
              >
                <div style={{
                  width: '20px', height: '20px',
                  borderRadius: 'var(--radius-full)',
                  background: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: hideRedFlags ? '22px' : '2px',
                  transition: 'left 200ms ease',
                }} />
              </div>
            </label>
            <p className="font-label-sm" style={{ color: 'var(--on-surface-variant)', marginTop: '8px' }}>
              Excludes candidates with job hopping (&gt;3 roles in 2 years) or unverified degrees.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Comparison Area */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', gap: 'var(--space-2xl)' }}>
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-headline-lg">{jdAnalysis?.title || 'Senior Frontend Engineer'}</h2>
            <p className="font-body-md" style={{ color: 'var(--on-surface-variant)' }}>
              Comparing top {candidates.length} algorithmically matched candidates.
            </p>
          </div>
          <div className="flex gap-md">
            <button className="btn btn-secondary flex items-center gap-sm">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>share</span>
              Share with Team
            </button>
            <button
              className="btn btn-export flex items-center gap-sm"
              onClick={async () => {
                if (!analysisResults) return;
                const candidateIds = candidates.map(c => c.candidate_id);
                if (candidateIds.length === 0) {
                  setExportMessage('No candidates to export.');
                  setTimeout(() => setExportMessage(''), 5000);
                  return;
                }
                setExporting(true);
                setExportMessage('');
                try {
                  const result = await downloadShortlistedExcel(analysisResults.analysis_id, candidateIds);
                  if (!result.success) {
                    setExportMessage(result.message || 'No shortlisted candidates available.');
                    setTimeout(() => setExportMessage(''), 5000);
                  }
                } catch {
                  setExportMessage('Export failed. Please try again.');
                  setTimeout(() => setExportMessage(''), 5000);
                } finally {
                  setExporting(false);
                }
              }}
              disabled={exporting}
              style={{ opacity: exporting ? 0.7 : 1 }}
            >
              {exporting ? (
                <>
                  <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                  Exporting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                  Download Shortlisted Candidates
                </>
              )}
            </button>
            {exportMessage && (
              <p className="font-label-sm" style={{ color: 'var(--amber)', marginTop: '4px' }}>
                {exportMessage}
              </p>
            )}
          </div>
        </div>

        {/* Candidate Grid */}
        <div className="comparison-grid" style={{ flex: 1, overflow: 'auto', paddingBottom: '32px' }}>
          {candidates.map((candidate, index) => (
            <motion.div
              key={candidate.candidate_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
            >
              <ComparisonCard candidate={candidate} index={index} />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
