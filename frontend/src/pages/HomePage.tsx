import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../store/store';
import { analyzeJD } from '../services/api';

const SAMPLE_JD = `We're looking for a Senior Backend Engineer to lead our platform's backend infrastructure. You'll work with Python, AWS, and build distributed systems serving millions of users across the globe.

The ideal candidate has 5+ years of experience building scalable backend services, strong expertise in Python and cloud technologies (AWS required), and experience with distributed systems and microservices architecture.

You should be comfortable working in a fast-paced startup environment with a strong ownership mentality. Leadership experience preferred — you'll mentor junior developers and help grow the team.

Required skills: Python (expert level), AWS (EC2, RDS, Lambda, S3), PostgreSQL, Redis, Docker, REST API design.
Nice to have: Kubernetes, GraphQL, CI/CD pipelines, monitoring tools.

Domain: Fintech and e-commerce experience is a plus.
We value continuous learning, initiative, and data-driven decision making.`;

function AnimatedSVGPanel() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg fill="none" viewBox="0 0 400 300" width="360" height="270" xmlns="http://www.w3.org/2000/svg">
        {/* JD Document */}
        <rect fill="#1E293B" height="100" rx="4" stroke="#334155" strokeWidth="2" width="80" x="50" y="100">
          <animate attributeName="opacity" dur="3s" repeatCount="indefinite" values="0.5;1;0.5" />
        </rect>
        <path d="M65 130H115M65 150H115M65 170H95" stroke="#334155" strokeLinecap="round" strokeWidth="2" />

        {/* AI Brain / Core */}
        <circle cx="200" cy="150" fill="#0F172A" r="40" stroke="#10B981" strokeWidth="3">
          <animate attributeName="stroke-width" dur="2s" repeatCount="indefinite" values="2;5;2" />
        </circle>
        <circle cx="200" cy="150" fill="#10B981" opacity="0.3" r="20">
          <animate attributeName="r" dur="2s" repeatCount="indefinite" values="15;25;15" />
        </circle>

        {/* Candidate Cards */}
        <rect fill="#1E293B" height="60" rx="8" stroke="#10B981" strokeWidth="2" width="80" x="270" y="80">
          <animate attributeName="x" dur="4s" repeatCount="indefinite" values="270;300;270" />
        </rect>
        <rect fill="#1E293B" height="60" rx="8" stroke="#F59E0B" strokeWidth="2" width="80" x="290" y="160">
          <animate attributeName="x" dur="5s" repeatCount="indefinite" values="290;260;290" />
        </rect>

        {/* Flow Lines */}
        <path d="M130 150H160" stroke="#10B981" strokeDasharray="4 4" strokeWidth="2">
          <animate attributeName="stroke-dashoffset" dur="1s" repeatCount="indefinite" values="0;20" />
        </path>
        <path d="M240 150L270 120" stroke="#10B981" strokeDasharray="4 4" strokeWidth="2">
          <animate attributeName="stroke-dashoffset" dur="1s" repeatCount="indefinite" values="0;20" />
        </path>
        <path d="M240 150L270 180" stroke="#10B981" strokeDasharray="4 4" strokeWidth="2">
          <animate attributeName="stroke-dashoffset" dur="1s" repeatCount="indefinite" values="0;20" />
        </path>
      </svg>

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity: 0.1,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '120px', color: 'var(--emerald)' }}>psychology</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { setJDAnalysis } = useAppStore();
  const [jdText, setJdText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setJdText(text);
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
    noClick: false,
  });

  const handleAnalyze = async () => {
    if (!jdText.trim() || jdText.trim().length < 20) {
      setError('Please enter a job description (at least 20 characters)');
      return;
    }
    setError('');
    setAnalyzing(true);
    try {
      const result = await analyzeJD(jdText);
      setJDAnalysis(result);
      navigate('/jd');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze JD. Make sure the backend is running.');
    } finally {
      setAnalyzing(false);
    }
  };

  const loadSample = () => {
    setJdText(SAMPLE_JD);
    setUploadedFileName('');
  };

  const downloadSampleFile = () => {
    const link = document.createElement('a');
    link.href = '/samples/sample_jd.txt';
    link.download = 'sample_jd.txt';
    link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
      {/* Hero Section */}
      <section style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center', justifyContent: 'space-between' }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ flex: 1, maxWidth: '640px' }}
        >
          <h1 className="font-headline-lg" style={{ marginBottom: 'var(--space-md)', color: 'white' }}>
            Meet Your AI Recruiter
          </h1>
          <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', maxWidth: '512px' }}>
            Transform static job descriptions into actionable intelligence. Our engine extracts core competencies and prepares the matrix for perfect candidate matching.
          </p>
          <div className="flex gap-md mt-lg">
            <button className="btn btn-primary btn-lg" onClick={() => document.getElementById('jd-textarea')?.focus()}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>psychology</span>
              Get Started
            </button>
            <button className="btn btn-secondary btn-lg" onClick={downloadSampleFile}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
              Download Sample JD
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-panel-static"
          style={{
            flex: 1,
            height: '320px',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AnimatedSVGPanel />
        </motion.div>
      </section>

      {/* Uploader Zone */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''}`}
          style={{
            minHeight: uploadedFileName ? '120px' : '260px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: '2px',
            borderStyle: 'dashed',
          }}
        >
          <input {...getInputProps()} />

          {uploadedFileName ? (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--emerald)', marginBottom: '8px' }}>check_circle</span>
              <h3 className="font-title-md" style={{ color: 'var(--emerald)' }}>
                Uploaded: {uploadedFileName}
              </h3>
              <p className="font-label-sm" style={{ color: 'var(--on-surface-variant)', marginTop: '4px' }}>
                Drop another file to replace, or edit the text below
              </p>
            </>
          ) : (
            <>
              <div className="dropzone-icon-wrapper">
                <span className="material-symbols-outlined" style={{
                  fontSize: '36px',
                  color: isDragActive ? 'var(--emerald)' : 'var(--on-surface-variant)',
                  transition: 'color 300ms ease',
                }}>
                  upload_file
                </span>
              </div>

              <h3 className="font-title-md" style={{ color: 'white', marginBottom: 'var(--space-xs)' }}>
                Drag & Drop Job Description
              </h3>
              <p className="font-label-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-md)' }}>
                or click to browse files (PDF, DOCX, TXT)
              </p>

              <button
                className="btn btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
                style={{ marginTop: '8px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>folder_open</span>
                Browse Files
              </button>
            </>
          )}
        </div>

        {/* Text Input */}
        <div className="glass-card" style={{ marginTop: 'var(--space-lg)' }}>
          <div className="flex items-center justify-between mb-md">
            <h4 className="font-title-md" style={{ fontSize: '16px' }}>Or paste your Job Description</h4>
            <button className="btn btn-ghost" onClick={loadSample} style={{ fontSize: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>auto_awesome</span>
              Load Sample JD
            </button>
          </div>

          <textarea
            id="jd-textarea"
            className="input-field"
            placeholder="Paste the full job description here..."
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            style={{ minHeight: '180px' }}
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
      </motion.section>
    </div>
  );
}
