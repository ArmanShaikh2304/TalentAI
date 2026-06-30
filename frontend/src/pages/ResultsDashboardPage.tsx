import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type CandidateResult } from '../store/store';
import { downloadShortlistedExcel } from '../services/api';

function RadarChart({ dimensions }: { dimensions: { name: string; score: number }[] }) {
  const labels = dimensions.slice(0, 6);
  const cx = 50, cy = 50;
  const rings = [
    '50,5 93,25 93,75 50,95 7,75 7,25',
    '50,20 80,35 80,65 50,80 20,65 20,35',
    '50,35 67,45 67,55 50,65 33,55 33,45',
  ];

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const r = (value / 100) * 45;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const dataPoints = labels.map((d, i) => getPoint(i, d.score));
  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const labelPositions: Record<string, any>[] = [
    { top: '-8px', left: '50%', transform: 'translateX(-50%)' },
    { top: '18%', right: '-60px' },
    { bottom: '18%', right: '-50px' },
    { bottom: '-16px', left: '50%', transform: 'translateX(-50%)' },
    { bottom: '18%', left: '-60px' },
    { top: '18%', left: '-60px' },
  ];

  return (
    <div style={{ width: '256px', height: '256px', position: 'relative', marginTop: '16px' }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', opacity: 0.3 }}>
        {rings.map((points, i) => (
          <polygon key={i} fill="none" points={points} stroke="#fff" strokeWidth="0.5" />
        ))}
        {[0,1,2,3,4,5].map(i => {
          const p = getPoint(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#fff" strokeWidth="0.5" />;
        })}
        <polygon className="radar-polygon" points={polygon} />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#fff" />
        ))}
      </svg>

      {labels.map((d, i) => (
        <div
          key={i}
          className="font-mono-data"
          style={{
            position: 'absolute',
            fontSize: '10px',
            color: d.score >= 85 ? 'var(--primary)' : 'var(--on-surface-variant)',
            whiteSpace: 'nowrap',
            ...labelPositions[i],
          }}
        >
          {d.name} ({d.score})
        </div>
      ))}
    </div>
  );
}

function ScoreCircle({ score, size = 96 }: { score: number; size?: number }) {
  const r = (size / 2) - 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-circle" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="transparent" stroke="rgba(190,198,224,0.1)" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="transparent" stroke="var(--primary)" strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ filter: 'drop-shadow(0 0 8px rgba(190, 198, 224, 0.5))' }}
        />
      </svg>
      <span className="score-circle-value" style={{ color: 'var(--primary)' }}>{score}</span>
      <span className="score-circle-label">MATCH</span>
    </div>
  );
}

function CandidateCard({
  candidate,
  isFirst,
  shortlisted,
  onToggleShortlist,
  onCompare,
  onViewProfile,
}: {
  candidate: CandidateResult;
  isFirst: boolean;
  shortlisted: boolean;
  onToggleShortlist: () => void;
  onCompare: () => void;
  onViewProfile: () => void;
}) {
  const [expanded, setExpanded] = useState(isFirst);
  const score = Math.round(candidate.total_score);

  const topDimensions = [...candidate.dimensions]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const radarDims = candidate.dimensions.slice(0, 6).map(d => ({
    name: d.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).split(' ')[0],
    score: Math.round(d.score),
  }));

  return (
    <div
      className={`glass-panel candidate-card ${expanded ? 'expanded' : ''}`}
      style={{
        borderColor: shortlisted ? 'rgba(16,185,129,0.4)' : isFirst ? 'rgba(190,198,224,0.3)' : undefined,
        opacity: isFirst ? 1 : expanded ? 1 : 0.75,
      }}
    >
      {/* Header */}
      <div className="candidate-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="candidate-card-left">
          <div className="candidate-avatar-wrapper">
            <div className="candidate-rank">
              <div className={`rank-badge ${candidate.rank === 1 ? 'rank-1' : candidate.rank === 2 ? 'rank-2' : 'rank-default'}`}>
                {candidate.rank}
              </div>
            </div>
            <div className="candidate-avatar" style={{
              borderColor: isFirst ? 'rgba(190,198,224,0.5)' : 'rgba(255,255,255,0.2)',
            }}>
              {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              {isFirst && <div className="candidate-status-dot" />}
            </div>
          </div>

          <div>
            <h3 className="font-title-md font-bold flex items-center gap-sm">
              {candidate.name}
              {shortlisted && (
                <span className="material-symbols-outlined icon-fill" style={{ fontSize: '16px', color: 'var(--emerald)' }}>bookmark</span>
              )}
              {isFirst && (
                <span className="material-symbols-outlined icon-fill" style={{ fontSize: '16px', color: 'var(--primary)' }} title="Top Match">verified</span>
              )}
            </h3>
            <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '4px' }}>
              {candidate.title}
            </p>
            {isFirst && candidate.explanation?.executive_summary && (
              <p className="font-label-sm" style={{
                color: 'var(--primary)',
                marginTop: '8px',
                background: 'rgba(190,198,224,0.1)',
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(190,198,224,0.2)',
                maxWidth: '400px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {candidate.explanation.executive_summary.slice(0, 60)}...
              </p>
            )}
          </div>
        </div>

        <div className="candidate-card-right">
          <div className="candidate-mini-scores">
            {topDimensions.map(dim => (
              <div key={dim.name} className="candidate-mini-score">
                <div className="candidate-mini-score-label">
                  <span style={{ color: 'var(--on-surface-variant)' }}>
                    {dim.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).split(' ')[0]}
                  </span>
                  <span style={{ color: 'var(--on-surface)' }}>{Math.round(dim.score)}%</span>
                </div>
                <div className="candidate-mini-score-bar">
                  <div className="candidate-mini-score-bar-fill" style={{ width: `${dim.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          <ScoreCircle score={score} />

          <span className="material-symbols-outlined" style={{
            color: 'var(--on-surface-variant)',
            transition: 'transform 300ms ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          }}>
            expand_more
          </span>
        </div>
      </div>

      {/* Expanded Detail */}
      <div className="expandable-content">
        <div className="expandable-inner">
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.2)',
            padding: '24px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '32px' }}>
              {/* Left: Radar Chart */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(21,28,39,0.5)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
                position: 'relative',
              }}>
                <h4 className="font-label-sm uppercase tracking-wider" style={{
                  color: 'var(--on-surface-variant)',
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                }}>
                  Candidate DNA
                </h4>
                <RadarChart dimensions={radarDims} />
              </div>

              {/* Right: Narrative & Actions */}
              <div className="flex flex-col">
                <div style={{ flex: 1 }}>
                  <h4 className="font-title-md flex items-center gap-sm" style={{ marginBottom: '12px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>auto_awesome</span>
                    Why this ranking
                  </h4>
                  <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', fontSize: '14px', lineHeight: '1.6' }}>
                    {candidate.explanation?.why_this_ranking || 'This candidate demonstrates strong alignment with the JD requirements across multiple dimensions.'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
                    {/* Strengths */}
                    <div style={{
                      background: 'rgba(190,198,224,0.05)',
                      border: '1px solid rgba(190,198,224,0.1)',
                      borderRadius: 'var(--radius-default)',
                      padding: '12px',
                    }}>
                      <div className="font-label-sm uppercase tracking-wider flex items-center gap-xs" style={{ color: 'var(--primary)', marginBottom: '8px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                        Strengths
                      </div>
                      <ul style={{ fontSize: '14px', color: 'var(--on-surface-variant)', listStyle: 'none', padding: 0 }}>
                        {(candidate.explanation?.strengths || []).slice(0, 3).map((s, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>• {s.text}</li>
                        ))}
                        {(!candidate.explanation?.strengths || candidate.explanation.strengths.length === 0) && (
                          <>
                            <li style={{ marginBottom: '4px' }}>• Strong technical skills alignment</li>
                            <li style={{ marginBottom: '4px' }}>• Relevant domain experience</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {/* Considerations */}
                    <div style={{
                      background: 'rgba(255,185,95,0.05)',
                      border: '1px solid rgba(255,185,95,0.1)',
                      borderRadius: 'var(--radius-default)',
                      padding: '12px',
                    }}>
                      <div className="font-label-sm uppercase tracking-wider flex items-center gap-xs" style={{ color: 'var(--secondary)', marginBottom: '8px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
                        Considerations
                      </div>
                      <ul style={{ fontSize: '14px', color: 'var(--on-surface-variant)', listStyle: 'none', padding: 0 }}>
                        {(candidate.explanation?.development_areas || []).slice(0, 2).map((d, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>• {d.text}</li>
                        ))}
                        {(!candidate.explanation?.development_areas || candidate.explanation.development_areas.length === 0) && (
                          <li style={{ marginBottom: '4px' }}>• No major concerns identified</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-md" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button className="btn btn-secondary flex items-center gap-sm" onClick={(e) => { e.stopPropagation(); onCompare(); }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>compare_arrows</span>
                    Compare
                  </button>
                  <button
                    className="btn flex items-center gap-sm"
                    style={{
                      background: shortlisted ? 'var(--emerald-glow)' : 'transparent',
                      color: shortlisted ? 'var(--emerald)' : 'var(--on-surface)',
                      border: `1px solid ${shortlisted ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.2)'}`,
                    }}
                    onClick={(e) => { e.stopPropagation(); onToggleShortlist(); }}
                  >
                    <span className={`material-symbols-outlined ${shortlisted ? 'icon-fill' : ''}`} style={{ fontSize: '18px' }}>bookmark</span>
                    {shortlisted ? 'Shortlisted' : 'Shortlist'}
                  </button>
                  <button className="btn btn-export flex items-center gap-sm" onClick={(e) => { e.stopPropagation(); onViewProfile(); }}>
                    View Full Profile
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Full Profile Modal
function ProfileModal({ candidate, onClose }: { candidate: CandidateResult; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel-static"
        style={{
          maxWidth: '720px', width: '100%', maxHeight: '80vh', overflow: 'auto',
          padding: '32px', borderRadius: 'var(--radius-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-lg">
          <div>
            <h2 className="font-headline-lg" style={{ fontSize: '24px' }}>{candidate.name}</h2>
            <p className="font-body-md" style={{ color: 'var(--on-surface-variant)' }}>{candidate.title}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-lg">
          {/* Summary */}
          <div>
            <h4 className="font-label-sm uppercase tracking-wider mb-sm" style={{ color: 'var(--primary)' }}>Executive Summary</h4>
            <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>
              {candidate.explanation?.executive_summary || 'Strong candidate with relevant skills and experience.'}
            </p>
          </div>

          {/* Skills */}
          <div>
            <h4 className="font-label-sm uppercase tracking-wider mb-sm" style={{ color: 'var(--primary)' }}>Skills</h4>
            <div className="flex flex-wrap gap-sm">
              {candidate.skills.map(skill => (
                <span key={skill} className="badge badge-info">{skill}</span>
              ))}
            </div>
          </div>

          {/* Work History */}
          <div>
            <h4 className="font-label-sm uppercase tracking-wider mb-sm" style={{ color: 'var(--primary)' }}>Work History</h4>
            {candidate.work_history.map((wh, i) => (
              <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-default)', marginBottom: '8px' }}>
                <p className="font-body-md font-semibold">{wh.role} at {wh.company}</p>
                <p className="font-label-sm" style={{ color: 'var(--on-surface-variant)' }}>{wh.years} years</p>
                <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', fontSize: '13px', marginTop: '4px' }}>{wh.achievements}</p>
              </div>
            ))}
          </div>

          {/* Education & Certs */}
          <div className="flex gap-lg">
            <div style={{ flex: 1 }}>
              <h4 className="font-label-sm uppercase tracking-wider mb-sm" style={{ color: 'var(--primary)' }}>Education</h4>
              <p className="font-body-md" style={{ fontSize: '14px' }}>{candidate.education}</p>
            </div>
            {candidate.certifications.length > 0 && (
              <div style={{ flex: 1 }}>
                <h4 className="font-label-sm uppercase tracking-wider mb-sm" style={{ color: 'var(--primary)' }}>Certifications</h4>
                {candidate.certifications.map(cert => (
                  <span key={cert} className="badge badge-match" style={{ marginRight: '4px', marginBottom: '4px' }}>{cert}</span>
                ))}
              </div>
            )}
          </div>

          {/* Dimensions */}
          <div>
            <h4 className="font-label-sm uppercase tracking-wider mb-sm" style={{ color: 'var(--primary)' }}>Scoring Dimensions</h4>
            <div className="flex flex-col gap-sm">
              {candidate.dimensions.map(dim => (
                <div key={dim.name}>
                  <div className="flex justify-between" style={{ marginBottom: '4px' }}>
                    <span className="font-label-sm">{dim.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <span className="font-mono-data">{Math.round(dim.score)}%</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-bar-fill emerald" style={{ width: `${dim.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

type SortMode = 'score' | 'name' | 'experience';

export default function ResultsDashboardPage() {
  const navigate = useNavigate();
  const { analysisResults, jdAnalysis, toggleComparison, comparisonIds } = useAppStore();
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('score');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [profileCandidate, setProfileCandidate] = useState<CandidateResult | null>(null);
  const [exportMessage, setExportMessage] = useState('');
  const [exporting, setExporting] = useState(false);

  const toggleShortlist = (id: string) => {
    setShortlistedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const sortedCandidates = useMemo(() => {
    if (!analysisResults) return [];
    const list = [...analysisResults.ranked_candidates];
    switch (sortMode) {
      case 'name': return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'experience': return list.sort((a, b) => b.experience_years - a.experience_years);
      case 'score':
      default: return list.sort((a, b) => b.total_score - a.total_score);
    }
  }, [analysisResults, sortMode]);

  // Compute dashboard stats from ranked candidates + user's manual shortlist
  const dashboardStats = useMemo(() => {
    if (!analysisResults) return null;
    const candidates = analysisResults.ranked_candidates;
    const notShortlisted = candidates.filter(c => !shortlistedIds.includes(c.candidate_id));
    const rejected = notShortlisted.filter(c => c.total_score < 50.0);
    const pending = notShortlisted.filter(c => c.total_score >= 50.0);
    const scores = candidates.map(c => c.total_score);
    const avgMatch = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return {
      total: candidates.length,
      analyzed: candidates.length,
      shortlisted: shortlistedIds.length,
      rejected: rejected.length,
      pending: pending.length,
      avgMatch,
    };
  }, [analysisResults, shortlistedIds]);

  const handleExportShortlisted = async () => {
    if (!analysisResults) return;
    if (shortlistedIds.length === 0) {
      setExportMessage('No shortlisted candidates available. Please shortlist candidates first.');
      setTimeout(() => setExportMessage(''), 5000);
      return;
    }
    setExporting(true);
    setExportMessage('');
    try {
      const result = await downloadShortlistedExcel(analysisResults.analysis_id, shortlistedIds);
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
  };

  if (!analysisResults) {
    return (
      <div className="empty-state">
        <span className="material-symbols-outlined" style={{ fontSize: '64px', opacity: 0.3, color: 'var(--primary)' }}>dashboard</span>
        <h3 className="font-title-md" style={{ marginTop: '16px' }}>No Analysis Results Yet</h3>
        <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: '8px', maxWidth: '400px', margin: '8px auto' }}>
          Upload candidates and run the analysis to see ranked results here.
        </p>
        <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => navigate('/candidates')}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cloud_upload</span>
          Upload Candidates
        </button>
      </div>
    );
  }

  const summary = analysisResults.summary;

  return (
    <div className="flex flex-col gap-lg">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-headline-lg">{jdAnalysis?.title || 'Ranking Results'}</h2>
          <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: '4px' }}>
            Ranking Results & Analytics
            {shortlistedIds.length > 0 && (
              <span style={{ marginLeft: '12px', color: 'var(--emerald)' }}>
                • {shortlistedIds.length} shortlisted
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-sm">
          <button
            className="btn btn-export flex items-center gap-sm"
            onClick={handleExportShortlisted}
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
          <button className="btn btn-secondary flex items-center gap-sm" onClick={() => navigate('/filter')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>filter_list</span>
            Filter & Compare
          </button>
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary flex items-center gap-sm"
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sort</span>
              Sort: {sortMode === 'score' ? 'Match Score' : sortMode === 'name' ? 'Name' : 'Experience'}
            </button>
            {showSortMenu && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                background: 'var(--surface-container-high)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-default)', overflow: 'hidden', zIndex: 20,
                minWidth: '160px', boxShadow: 'var(--shadow-lg)',
              }}>
                {([
                  { value: 'score' as SortMode, label: 'Match Score' },
                  { value: 'name' as SortMode, label: 'Name (A-Z)' },
                  { value: 'experience' as SortMode, label: 'Experience' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    className="font-label-sm"
                    onClick={() => { setSortMode(opt.value); setShowSortMenu(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 16px', background: sortMode === opt.value ? 'rgba(190,198,224,0.1)' : 'none',
                      border: 'none', cursor: 'pointer',
                      color: sortMode === opt.value ? 'var(--primary)' : 'var(--on-surface-variant)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Message Toast */}
      <AnimatePresence>
        {exportMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="toast-message"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
            {exportMessage}
            <button
              onClick={() => setExportMessage('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', marginLeft: 'auto' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Stats Bento Grid — Enhanced 6 Cards */}
      <div className="stats-grid-extended">
        <div className="glass-panel stat-card">
          <div className="stat-icon-label">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>group</span>
            <span className="label">Total Candidates</span>
          </div>
          <div className="stat-value">{summary.total_candidates}</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-label">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>analytics</span>
            <span className="label">Analyzed</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{dashboardStats?.analyzed || 0}</div>
        </div>

        <div className="glass-panel stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', right: '-40px', top: '-40px',
            width: '128px', height: '128px',
            background: 'rgba(16,185,129,0.2)',
            borderRadius: 'var(--radius-full)',
            filter: 'blur(32px)',
          }} />
          <div className="stat-icon-label" style={{ position: 'relative', zIndex: 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--emerald)' }}>check_circle</span>
            <span className="label">Shortlisted</span>
          </div>
          <div className="stat-value" style={{ position: 'relative', zIndex: 1, color: 'var(--emerald)' }}>{dashboardStats?.shortlisted || 0}</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-label">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--error)' }}>cancel</span>
            <span className="label">Rejected</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--error)' }}>{dashboardStats?.rejected || 0}</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon-label">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--amber)' }}>schedule</span>
            <span className="label">Pending</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{dashboardStats?.pending || 0}</div>
        </div>

        <div className="glass-panel stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', right: '-40px', top: '-40px',
            width: '128px', height: '128px',
            background: 'rgba(190,198,224,0.2)',
            borderRadius: 'var(--radius-full)',
            filter: 'blur(32px)',
          }} />
          <div className="stat-icon-label" style={{ position: 'relative', zIndex: 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>stacked_bar_chart</span>
            <span className="label">Average Match %</span>
          </div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="stat-value" style={{ color: 'var(--primary)' }}>{dashboardStats?.avgMatch || Math.round(summary.avg_score)}%</span>
          </div>
        </div>
      </div>

      {/* Ranked Candidates List */}
      <div className="flex flex-col gap-md" style={{ marginTop: '16px' }}>
        {sortedCandidates.map((candidate, index) => (
          <motion.div
            key={candidate.candidate_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <CandidateCard
              candidate={candidate}
              isFirst={index === 0 && sortMode === 'score'}
              shortlisted={shortlistedIds.includes(candidate.candidate_id)}
              onToggleShortlist={() => toggleShortlist(candidate.candidate_id)}
              onCompare={() => {
                toggleComparison(candidate.candidate_id);
                if (comparisonIds.length >= 1) {
                  navigate('/filter');
                }
              }}
              onViewProfile={() => setProfileCandidate(candidate)}
            />
          </motion.div>
        ))}
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {profileCandidate && (
          <ProfileModal
            candidate={profileCandidate}
            onClose={() => setProfileCandidate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
