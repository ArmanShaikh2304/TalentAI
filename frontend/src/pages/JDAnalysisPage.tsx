import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type JDAnalysis } from '../store/store';
import { analyzeJD } from '../services/api';

const SAMPLE_JD = `We're looking for a Senior Backend Engineer to lead our platform's backend infrastructure. You'll work with Python, AWS, and build distributed systems serving millions of users.

The ideal candidate has 5+ years of experience building scalable backend services, strong expertise in Python and cloud technologies (AWS required), and experience with distributed systems and microservices architecture.

You should be comfortable working in a fast-paced startup environment with a strong ownership mentality. Leadership experience preferred — you'll mentor junior developers and help grow the team.

Required skills: Python (expert level), AWS (EC2, RDS, Lambda, S3), PostgreSQL, Redis, Docker, REST API design.
Nice to have: Kubernetes, GraphQL, CI/CD pipelines, monitoring tools.

Domain: Fintech and e-commerce experience is a plus.
We value continuous learning, initiative, and data-driven decision making.`;

const TAB_CONFIG = [
  { key: 'technical', label: 'Core Skills', icon: 'code' },
  { key: 'soft', label: 'Soft Skills', icon: 'group' },
  { key: 'experience', label: 'Experience', icon: 'work' },
  { key: 'hidden', label: 'Hidden Reqs', icon: 'visibility_off' },
  { key: 'culture', label: 'Culture', icon: 'favorite' },
];

export default function JDAnalysisPage() {
  const navigate = useNavigate();
  const { jdAnalysis, setJDAnalysis } = useAppStore();
  const [jdText, setJdText] = useState('');
  const [jdTitle, setJdTitle] = useState('');
  const [activeTab, setActiveTab] = useState('technical');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!jdText.trim() || jdText.trim().length < 20) {
      setError('Please enter a job description (at least 20 characters)');
      return;
    }
    setError('');
    setAnalyzing(true);
    try {
      const result = await analyzeJD(jdText, jdTitle);
      setJDAnalysis(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze JD. Make sure the backend is running.');
    } finally {
      setAnalyzing(false);
    }
  };

  const loadSample = () => {
    setJdText(SAMPLE_JD);
    setJdTitle('Senior Backend Engineer');
  };

  const getCriticalityColor = (criticality: number) => {
    if (criticality >= 0.8) return 'var(--emerald)';
    if (criticality >= 0.5) return 'var(--amber)';
    return 'var(--on-surface-variant)';
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="font-headline-lg" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>analytics</span>
            Job Description Analysis
          </h2>
          <p className="section-subtitle font-body-md">Paste a job description and let AI extract structured requirements</p>
        </div>
      </div>

      {/* Input Section */}
      {!jdAnalysis && (
        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <div className="flex items-center justify-between mb-md">
            <h4 className="font-title-md" style={{ fontSize: '16px' }}>Job Description</h4>
            <button className="btn btn-ghost" onClick={loadSample}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>auto_awesome</span>
              Load Sample JD
            </button>
          </div>

          <input
            type="text"
            className="input-field"
            placeholder="Job Title (optional, e.g., Senior Backend Engineer)"
            value={jdTitle}
            onChange={e => setJdTitle(e.target.value)}
            style={{ marginBottom: '12px' }}
          />

          <textarea
            className="input-field"
            placeholder="Paste the full job description here..."
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            style={{ minHeight: '200px' }}
          />

          {error && (
            <p style={{ color: 'var(--error)', fontSize: '13px', marginTop: '8px' }}>{error}</p>
          )}

          <div className="flex items-center gap-md mt-md">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleAnalyze}
              disabled={analyzing || !jdText.trim()}
              style={{ opacity: analyzing || !jdText.trim() ? 0.6 : 1 }}
            >
              {analyzing ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  Analyzing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>psychology</span>
                  Analyze JD
                </>
              )}
            </button>
            <span className="font-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
              {jdText.length} characters
            </span>
          </div>
        </div>
      )}

      {/* Results Section */}
      <AnimatePresence>
        {jdAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Success Banner */}
            <div className="glass-card-accent" style={{ marginBottom: '24px' }}>
              <div className="flex items-center gap-md">
                <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--emerald)', fontSize: '24px' }}>check_circle</span>
                <div>
                  <h4 style={{ color: 'var(--emerald)', fontSize: '16px', fontWeight: 600 }}>
                    Analysis Complete — {jdAnalysis.title}
                  </h4>
                  <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>
                    Found {jdAnalysis.technical_skills.length} technical skills,{' '}
                    {jdAnalysis.soft_skills.length} soft skills,{' '}
                    {jdAnalysis.hidden_requirements.length} hidden requirements
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: '24px' }}>
              {TAB_CONFIG.map(tab => (
                <button
                  key={tab.key}
                  className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{tab.icon}</span>
                  {tab.label}
                  {tab.key === 'technical' && (
                    <span style={{ opacity: 0.7 }}>({jdAnalysis.technical_skills.length})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="glass-card">
              {activeTab === 'technical' && (
                <div className="flex flex-col gap-md">
                  {jdAnalysis.technical_skills.map((skill, i) => (
                    <motion.div
                      key={skill.skill}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-md"
                      style={{ padding: '8px 0', borderBottom: '1px solid var(--outline-variant)' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-sm">
                          <strong style={{ fontSize: '14px' }}>{skill.skill}</strong>
                          <span className={`badge ${skill.criticality >= 0.8 ? 'badge-match' : skill.criticality >= 0.5 ? 'badge-partial' : 'badge-neutral'}`}>
                            {skill.proficiency}
                          </span>
                        </div>
                      </div>
                      <div style={{ width: '120px' }}>
                        <div className="score-bar">
                          <div
                            className="score-bar-fill"
                            style={{
                              width: `${skill.criticality * 100}%`,
                              background: getCriticalityColor(skill.criticality),
                            }}
                          />
                        </div>
                        <div className="font-mono-data" style={{ fontSize: '10px', color: 'var(--on-surface-variant)', textAlign: 'right', marginTop: '2px' }}>
                          {(skill.criticality * 100).toFixed(0)}% critical
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'soft' && (
                <div className="flex flex-col gap-sm">
                  {jdAnalysis.soft_skills.length === 0 && (
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>No explicit soft skills detected</p>
                  )}
                  {jdAnalysis.soft_skills.map((skill, i) => (
                    <motion.div
                      key={skill.skill}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-sm"
                      style={{ padding: '8px 12px', background: 'rgba(190, 198, 224, 0.08)', borderRadius: '8px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>group</span>
                      <span style={{ fontSize: '14px' }}>{skill.skill}</span>
                      <span className="badge badge-info">{(skill.criticality * 100).toFixed(0)}%</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'experience' && (
                <div className="flex flex-col gap-md">
                  <div className="flex gap-lg">
                    <div className="glass-card" style={{ flex: 1, textAlign: 'center' }}>
                      <div className="font-display-lg" style={{ fontSize: '36px', color: 'var(--emerald)' }}>
                        {jdAnalysis.experience.min_years}+
                      </div>
                      <div className="font-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Minimum Years</div>
                    </div>
                    <div className="glass-card" style={{ flex: 1, textAlign: 'center' }}>
                      <div className="font-display-lg" style={{ fontSize: '36px', color: 'var(--primary)' }}>
                        {jdAnalysis.experience.preferred_years}
                      </div>
                      <div className="font-label-sm" style={{ color: 'var(--on-surface-variant)' }}>Preferred Years</div>
                    </div>
                  </div>
                  {jdAnalysis.domains.length > 0 && (
                    <div>
                      <h4 className="font-label-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: '8px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px' }}>public</span>
                        Target Domains
                      </h4>
                      <div className="flex gap-sm flex-wrap">
                        {jdAnalysis.domains.map(d => (
                          <span key={d} className="badge badge-info">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'hidden' && (
                <div className="flex flex-col gap-sm">
                  <p className="font-label-sm" style={{ color: 'var(--amber)', marginBottom: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px' }}>warning</span>
                    Requirements inferred from context — not explicitly stated in the JD
                  </p>
                  {jdAnalysis.hidden_requirements.map((req, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-sm"
                      style={{ padding: '8px 12px', background: 'var(--amber-glow)', borderRadius: '8px' }}
                    >
                      <span style={{ color: 'var(--amber)' }}>💡</span>
                      <span style={{ fontSize: '14px' }}>{req}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'culture' && (
                <div className="flex flex-col gap-sm">
                  {jdAnalysis.culture_signals.length === 0 && (
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>No culture signals detected</p>
                  )}
                  {jdAnalysis.culture_signals.map((signal, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-sm"
                      style={{ padding: '8px 12px', background: 'rgba(190, 198, 224, 0.06)', borderRadius: '8px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>favorite</span>
                      <span style={{ fontSize: '14px' }}>{signal}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Continue Button */}
            <div className="flex justify-center mt-xl">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/candidates')}>
                Continue to Candidates
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
