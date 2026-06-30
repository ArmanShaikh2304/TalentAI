import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useAppStore } from '../store/store';
import { uploadCandidates, runAnalysis } from '../services/api';

const PROCESSING_STEPS = [
  { key: 'extract', label: 'Extracting skills & entities', icon: 'check_circle' },
  { key: 'embed', label: 'Generating vector embeddings', icon: 'sync' },
  { key: 'semantic', label: 'Cross-referencing JD semantics', icon: 'pending' },
  { key: 'rank', label: 'Pre-computing ranks & explanations', icon: 'pending' },
];

export default function CandidateUploadPage() {
  const navigate = useNavigate();
  const { jdAnalysis, setCandidates, setAnalysisResults } = useAppStore();
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepProgress, setStepProgress] = useState([0, 0, 0, 0]);
  const [validCount, setValidCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [processingComplete, setProcessingComplete] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const fileNames = acceptedFiles.map(f => f.name);
    setUploadedFiles(prev => [...prev, ...fileNames]);
    setError('');

    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = JSON.parse(text);
          const candidates = Array.isArray(parsed) ? parsed : parsed.candidates || [parsed];
          setTotalCount(candidates.length);
          setValidCount(candidates.length);
          setErrorCount(0);

          const result = await uploadCandidates(candidates);
          setCandidates(result.candidates || candidates);
        } catch (err: any) {
          setError('Failed to parse file. Please upload valid JSON.');
        }
      };
      reader.readAsText(file);
    });
  }, [setCandidates]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/csv': ['.csv'],
    },
    multiple: true,
    noClick: false,
  });

  const simulateProcessing = async () => {
    if (!jdAnalysis) {
      setError('Please analyze a Job Description first (go to JD Analysis).');
      return;
    }

    setProcessing(true);
    setError('');

    // Step 1: Extracting
    setCurrentStep(0);
    for (let i = 0; i <= 100; i += 5) {
      setStepProgress(prev => [i, prev[1], prev[2], prev[3]]);
      await new Promise(r => setTimeout(r, 30));
    }

    // Step 2: Embeddings
    setCurrentStep(1);
    for (let i = 0; i <= 100; i += 3) {
      setStepProgress(prev => [100, i, prev[2], prev[3]]);
      await new Promise(r => setTimeout(r, 40));
    }

    // Step 3: Semantic matching
    setCurrentStep(2);
    for (let i = 0; i <= 100; i += 4) {
      setStepProgress(prev => [100, 100, i, prev[3]]);
      await new Promise(r => setTimeout(r, 35));
    }

    // Step 4: Ranking
    setCurrentStep(3);
    try {
      const result = await runAnalysis(jdAnalysis.jd_id);
      setAnalysisResults(result);
      setStepProgress([100, 100, 100, 100]);
      setProcessingComplete(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Analysis failed. Check the backend.');
      setStepProgress(prev => [prev[0], prev[1], prev[2], 0]);
    }

    setProcessing(false);
  };

  const getStepIcon = (index: number) => {
    if (stepProgress[index] === 100) return 'check_circle';
    if (index === currentStep) return 'sync';
    return 'pending';
  };

  const getStepIconColor = (index: number) => {
    if (stepProgress[index] === 100) return 'var(--emerald)';
    if (index === currentStep) return 'var(--primary)';
    return 'var(--on-surface-variant)';
  };

  const downloadSampleCandidates = () => {
    const link = document.createElement('a');
    link.href = '/samples/sample_candidates.json';
    link.download = 'sample_candidates.json';
    link.click();
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f !== fileName));
    if (uploadedFiles.length <= 1) {
      setTotalCount(0);
      setValidCount(0);
    }
  };

  const resetAll = () => {
    setUploadedFiles([]);
    setProcessing(false);
    setCurrentStep(-1);
    setStepProgress([0, 0, 0, 0]);
    setValidCount(0);
    setErrorCount(0);
    setTotalCount(0);
    setError('');
    setProcessingComplete(false);
  };

  return (
    <div style={{ maxWidth: '896px', margin: '0 auto' }}>
      {/* Header */}
      <header style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>
        <h2 className="font-headline-lg">Ingest & Analyze Candidates</h2>
        <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: '8px', maxWidth: '560px', margin: '8px auto 0' }}>
          Upload JSON or CSV files containing candidate profiles. Our intelligence engine will parse, semantically embed, and prep them for ranking against your JD.
        </p>
        <div className="flex items-center justify-center gap-md mt-lg">
          <button className="btn btn-secondary" onClick={downloadSampleCandidates}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            Download Sample Candidates
          </button>
          {uploadedFiles.length > 0 && (
            <button className="btn btn-ghost" onClick={resetAll}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
              Reset
            </button>
          )}
        </div>
      </header>

      {!jdAnalysis && (
        <div className="glass-card-accent" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--amber)' }}>warning</span>
          <div>
            <p className="font-body-md" style={{ fontSize: '14px' }}>
              <strong style={{ color: 'var(--amber)' }}>No JD analyzed yet.</strong>{' '}
              <span style={{ color: 'var(--on-surface-variant)' }}>
                You need to{' '}
                <a onClick={() => navigate('/')} style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>
                  analyze a Job Description
                </a>
                {' '}first before processing candidates.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''}`}
          style={{
            padding: uploadedFiles.length > 0 ? '24px 48px' : '48px',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 'var(--space-2xl)',
          }}
        >
          <input {...getInputProps()} />

          {/* Hover gradient overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent, rgba(16, 185, 129, 0.05))',
            opacity: isDragActive ? 1 : 0,
            transition: 'opacity 300ms ease',
            pointerEvents: 'none',
          }} />

          {uploadedFiles.length > 0 ? (
            <div style={{ width: '100%' }}>
              <div className="flex items-center gap-md mb-md">
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--emerald)' }}>check_circle</span>
                <h3 className="font-title-md" style={{ color: 'var(--emerald)' }}>
                  {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded
                </h3>
              </div>
              {uploadedFiles.map(f => (
                <div key={f} className="flex items-center justify-between" style={{
                  padding: '8px 12px',
                  background: 'rgba(16,185,129,0.05)',
                  borderRadius: 'var(--radius-default)',
                  marginBottom: '4px',
                }}>
                  <span className="flex items-center gap-sm font-body-md" style={{ fontSize: '14px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--emerald)' }}>description</span>
                    {f}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(f); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                  </button>
                </div>
              ))}
              <p className="font-label-sm text-center mt-md" style={{ color: 'var(--on-surface-variant)' }}>
                Drop more files to add, or click to browse
              </p>
            </div>
          ) : (
            <>
              <div className="dropzone-icon-wrapper">
                <span className="material-symbols-outlined" style={{
                  fontSize: '36px',
                  color: isDragActive ? 'var(--emerald)' : 'var(--on-surface-variant)',
                }}>
                  upload_file
                </span>
              </div>

              <h3 className="font-title-md" style={{ color: 'var(--on-surface)', marginBottom: '8px' }}>
                Drag & drop files here
              </h3>
              <p className="font-body-md" style={{ color: 'var(--on-surface-variant)', marginBottom: '24px' }}>
                Supports .json, .csv, or .zip archives up to 50MB
              </p>

              <div className="flex items-center justify-center gap-md" style={{ marginBottom: '24px' }}>
                <span style={{ height: '1px', width: '48px', background: 'rgba(255,255,255,0.2)' }} />
                <span className="font-label-sm uppercase tracking-wider" style={{ color: 'var(--on-surface-variant)' }}>or</span>
                <span style={{ height: '1px', width: '48px', background: 'rgba(255,255,255,0.2)' }} />
              </div>

              <button
                className="btn btn-secondary"
                onClick={(e) => { e.stopPropagation(); open(); }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>folder_open</span>
                Browse Files
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Processing State */}
      <AnimatePresence>
        {(uploadedFiles.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel-static"
            style={{ padding: '32px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-2xl)' }}
          >
            {/* Header Stats */}
            <div className="flex justify-between items-end" style={{ marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <h3 className="font-title-md flex items-center gap-md">
                  {processing && <span style={{
                    width: '10px', height: '10px', borderRadius: 'var(--radius-full)',
                    background: 'var(--emerald)', display: 'inline-block',
                    animation: 'pulse-emerald 2s ease-in-out infinite',
                  }} />}
                  {processingComplete ? '✓ Processing Complete' : processing ? 'Processing Candidates...' : 'Ready to Process'}
                </h3>
                {totalCount > 0 && (
                  <p className="font-mono-data" style={{ color: 'var(--primary)', marginTop: '4px' }}>
                    {totalCount} candidates loaded{' '}
                    <span style={{ color: 'var(--emerald)' }}>✓ {validCount} valid</span>
                    {errorCount > 0 && <>, <span style={{ color: 'var(--error)' }}>{errorCount} errors</span></>}
                  </p>
                )}
              </div>
              {processing && (
                <div style={{ textAlign: 'right' }}>
                  <p className="font-label-sm uppercase" style={{ color: 'var(--on-surface-variant)' }}>Est. Time Remaining</p>
                  <p className="font-mono-data">00:12s</p>
                </div>
              )}
            </div>

            {/* Multi-step Progress */}
            <div className="flex flex-col gap-xl">
              {PROCESSING_STEPS.map((step, index) => (
                <div key={step.key} style={{ opacity: index > currentStep && currentStep >= 0 ? 0.5 : 1 }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                    <span className="font-label-sm flex items-center gap-sm" style={{ color: index <= currentStep ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: '16px',
                          color: getStepIconColor(index),
                          animation: index === currentStep && processing ? 'spin 2s linear infinite' : 'none',
                        }}
                      >
                        {getStepIcon(index)}
                      </span>
                      {step.label}
                    </span>
                    <span className="font-mono-data" style={{ color: stepProgress[index] === 100 ? 'var(--emerald)' : index === currentStep ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                      {stepProgress[index]}%
                    </span>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        height: '100%',
                        width: `${stepProgress[index]}%`,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 300ms ease',
                        position: 'relative',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="glass-card" style={{ borderColor: 'rgba(239,68,68,0.3)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--error)' }}>error</span>
          <span style={{ color: 'var(--error)', fontSize: '14px' }}>{error}</span>
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col items-center justify-center" style={{ marginTop: '32px', marginBottom: '80px' }}>
        {processingComplete ? (
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/results')}
            style={{
              padding: '16px 40px',
              fontSize: '16px',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
            }}
          >
            <span className="material-symbols-outlined">dashboard</span>
            View Ranking Dashboard
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
          </button>
        ) : (
          <button
            className="btn btn-primary btn-lg animate-pulse-glow"
            onClick={simulateProcessing}
            disabled={processing || uploadedFiles.length === 0}
            style={{
              padding: '16px 40px',
              fontSize: '16px',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
              opacity: processing || uploadedFiles.length === 0 ? 0.6 : 1,
            }}
          >
            <span className="material-symbols-outlined">psychology</span>
            Initialize Intelligence Engine
          </button>
        )}
        <p className="font-mono-data" style={{ color: 'var(--on-surface-variant)', marginTop: '16px', opacity: 0.7 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px', verticalAlign: 'middle' }}>timer</span>
          {processingComplete ? `Processed ${totalCount} candidates` : uploadedFiles.length > 0 ? `${totalCount} candidates ready` : 'Upload candidates to begin processing'}
        </p>
      </div>
    </div>
  );
}
