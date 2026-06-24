import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resumesApi, jobsApi } from '@/api/client'
import { GlassCard, StatusBadge, PageLoader } from '@/components/ui'
import toast from 'react-hot-toast'

interface UploadedFile { file: File; status: 'queued' | 'uploading' | 'done' | 'error'; progress: number; error?: string }

export default function ResumeUploadPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const initialJobId = location.state?.jobId || ''
  const initialJobTitle = location.state?.jobTitle || ''

  const [selectedJobId, setSelectedJobId] = useState(initialJobId)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)

  const { data: jobsData } = useQuery({
    queryKey: ['jobs-select'],
    queryFn: () => jobsApi.list({ status: 'active', limit: 50 }).then(r => r.data.data.jobs),
  })

  const { data: recentUploads } = useQuery({
    queryKey: ['resumes', selectedJobId],
    queryFn: () => resumesApi.list({ jobId: selectedJobId || undefined, limit: 10 }).then(r => r.data.data.resumes),
    enabled: true,
  })

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: UploadedFile[] = accepted.map(f => ({ file: f, status: 'queued', progress: 0 }))
    setFiles(prev => [...prev, ...newFiles])
    setUploadDone(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/msword': ['.doc'] },
    maxFiles: 10,
    maxSize: 26214400,
    onDropRejected: (rejected) => {
      rejected.forEach(r => toast.error(`${r.file.name}: ${r.errors[0]?.message}`))
    },
  })

  const removeFile = (idx: number) => setFiles(f => f.filter((_, i) => i !== idx))

  const handleUpload = async () => {
    if (!selectedJobId) { toast.error('Please select a job first'); return }
    if (files.filter(f => f.status === 'queued').length === 0) { toast.error('No files to upload'); return }
    setUploading(true)

    const queued = files.filter(f => f.status === 'queued').map(f => f.file)

    setFiles(prev => prev.map(f => f.status === 'queued' ? { ...f, status: 'uploading', progress: 0 } : f))

    try {
      await resumesApi.upload(queued, selectedJobId, (pct) => {
        setFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, progress: pct } : f))
      })
      setFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'done', progress: 100 } : f))
      qc.invalidateQueries({ queryKey: ['resumes'] })
      qc.invalidateQueries({ queryKey: ['candidates'] })
      toast.success(`${queued.length} resume(s) uploaded! AI parsing in progress…`)
      setUploadDone(true)
    } catch (err: any) {
      setFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'error', error: 'Upload failed' } : f))
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-display-lg-mobile font-bold tracking-tight">Resume Upload</h2>
        <p className="text-body-md text-on-surface-variant mt-1">Upload PDF or DOCX resumes for AI parsing and ranking.</p>
      </div>

      {/* Job Selector */}
      <GlassCard className="p-6 mb-6">
        <h3 className="text-headline-sm font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">work</span> Select Job Position
        </h3>
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-body-md"
        >
          <option value="">Choose a job to match against…</option>
          {jobsData?.map((j: any) => (
            <option key={j._id} value={j._id}>{j.title} — {j.department}</option>
          ))}
        </select>
        {selectedJobId && initialJobTitle && (
          <div className="mt-3 flex items-center gap-2 text-secondary text-label-sm">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Uploading for: <strong>{initialJobTitle}</strong>
          </div>
        )}
      </GlassCard>

      {/* Drop Zone */}
      <GlassCard className="mb-6">
        <div
          {...getRootProps()}
          className={`p-12 border-2 border-dashed border-outline-variant rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${isDragActive ? 'drop-zone-active' : 'hover:border-primary/40 hover:bg-primary/5'}`}
        >
          <input {...getInputProps()} />
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${isDragActive ? 'bg-primary/20 scale-110' : 'bg-surface-container'}`}>
            <span className={`material-symbols-outlined text-[40px] ${isDragActive ? 'text-primary' : 'text-on-surface-variant'}`}>
              {isDragActive ? 'file_download' : 'upload_file'}
            </span>
          </div>

          {isDragActive ? (
            <div className="text-center">
              <p className="text-headline-sm font-bold text-primary">Drop files here</p>
              <p className="text-label-md text-on-surface-variant">Release to add</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-headline-sm font-bold text-on-surface">Drag & drop resumes here</p>
              <p className="text-body-md text-on-surface-variant mt-1">or click to browse files</p>
              <div className="flex items-center gap-3 mt-4 justify-center">
                {['PDF', 'DOCX', 'DOC'].map(f => (
                  <span key={f} className="px-3 py-1 bg-surface-container rounded-lg text-label-sm text-on-surface-variant border border-outline-variant">{f}</span>
                ))}
              </div>
              <p className="text-label-sm text-on-surface-variant/50 mt-3">Max 25MB per file · 10 files per upload</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* File Queue */}
      {files.length > 0 && (
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-sm font-bold">Upload Queue ({files.length})</h3>
            <button onClick={() => setFiles([])} className="text-error text-label-sm hover:underline">Clear All</button>
          </div>
          <div className="space-y-3">
            {files.map((uf, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-surface-container rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {uf.file.name.endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label-md text-on-surface font-bold truncate">{uf.file.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-label-sm text-on-surface-variant">{formatSize(uf.file.size)}</p>
                    {uf.status === 'uploading' && (
                      <div className="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${uf.progress}%` }} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {uf.status === 'queued' && <span className="text-label-sm text-on-surface-variant">Ready</span>}
                  {uf.status === 'uploading' && (
                    <div className="flex items-center gap-1 text-primary text-label-sm">
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      {uf.progress}%
                    </div>
                  )}
                  {uf.status === 'done' && <span className="text-secondary text-label-sm flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> Uploaded</span>}
                  {uf.status === 'error' && <span className="text-error text-label-sm">{uf.error}</span>}
                  {uf.status === 'queued' && (
                    <button onClick={() => removeFile(i)} className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-label-sm text-on-surface-variant">
              {files.filter(f => f.status === 'queued').length} ready to upload
            </p>
            <div className="flex gap-3">
              {uploadDone && (
                <button
                  onClick={() => navigate(`/jobs/${selectedJobId}/candidates`)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-on-secondary rounded-xl text-label-md font-bold hover:shadow-glow-secondary transition-all btn-press"
                >
                  <span className="material-symbols-outlined text-[16px]">groups</span>
                  View Candidates
                </button>
              )}
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedJobId || files.filter(f => f.status === 'queued').length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl text-label-md font-bold hover:shadow-glow-primary transition-all btn-press disabled:opacity-50"
              >
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />Uploading...</>
                ) : (
                  <><span className="material-symbols-outlined text-[16px]">cloud_upload</span>Upload & Analyze</>
                )}
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* AI Process Info */}
      <GlassCard className="p-6 mb-6">
        <h3 className="text-headline-sm font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">auto_awesome</span> AI Processing Pipeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: 'text_fields', title: 'Text Extraction', desc: 'NLP extracts name, email, skills, experience from PDF/DOCX', color: 'text-primary' },
            { icon: 'psychology', title: 'AI Scoring', desc: 'Multi-dimensional matching: skills (40%), experience (25%), education (15%), keywords (20%)', color: 'text-secondary' },
            { icon: 'format_list_numbered', title: 'Ranked Output', desc: 'Candidates sorted by match score with AI insights', color: 'text-tertiary' },
          ].map((s, i) => (
            <div key={i} className="p-4 bg-surface-container rounded-xl">
              <span className={`material-symbols-outlined text-[24px] ${s.color} mb-2 block`}>{s.icon}</span>
              <h4 className="text-label-md font-bold mb-1">{s.title}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Recent Uploads */}
      {recentUploads && recentUploads.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="text-headline-sm font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant">history</span> Recent Uploads
          </h3>
          <div className="space-y-3">
            {recentUploads.map((r: any) => (
              <div key={r._id} className="flex items-center gap-4 p-3 bg-surface-container rounded-xl">
                <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                <div className="flex-1 min-w-0">
                  <p className="text-label-md text-on-surface truncate">{r.originalName}</p>
                  <p className="text-label-sm text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString()} · {(r.fileSize / 1024).toFixed(0)} KB</p>
                </div>
                {r.candidateId && <StatusBadge status={r.candidateId.parseStatus || 'pending'} />}
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
