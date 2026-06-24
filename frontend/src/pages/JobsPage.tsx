import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '@/api/client'
import { GlassCard, StatusBadge, PageLoader, EmptyState, Pagination } from '@/components/ui'
import toast from 'react-hot-toast'

const STATUS_FILTERS = ['all', 'active', 'draft', 'closed', 'paused']
const TYPE_FILTERS = ['all', 'Full-time', 'Part-time', 'Contract', 'Internship']

export default function JobsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', { search, status, type, page }],
    queryFn: () => jobsApi.list({
      search: search || undefined,
      status: status !== 'all' ? status : undefined,
      type: type !== 'all' ? type : undefined,
      page, limit: 10,
    }).then(r => r.data.data),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); toast.success('Job deleted') },
  })

  const jobs = data?.jobs || []
  const pagination = data?.pagination

  if (isLoading) return <PageLoader />

  return (
    <div className="px-8 py-8 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-display-lg-mobile font-bold tracking-tight">Job Postings</h2>
          <p className="text-body-md text-on-surface-variant mt-1">{pagination?.total ?? 0} positions tracked</p>
        </div>
        <button
          onClick={() => navigate('/jobs/create')}
          className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-label-md font-bold hover:shadow-glow-primary transition-all btn-press flex items-center gap-2 w-fit"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Post New Job
        </button>
      </div>

      {/* Filters */}
      <GlassCard className="p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs…"
            className="w-full pl-9 pr-4 py-2 rounded-xl text-label-md bg-surface-container border-none" />
        </div>
        <div className="flex gap-2">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-label-sm capitalize transition-colors ${status === s ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}>
              {s}
            </button>
          ))}
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="py-2 px-3 rounded-xl text-label-md bg-surface-container border-none">
          {TYPE_FILTERS.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t}</option>)}
        </select>
      </GlassCard>

      {/* Jobs list */}
      {jobs.length === 0 ? (
        <EmptyState icon="work" title="No jobs found"
          subtitle="Post your first job to start matching candidates with AI."
          action={
            <button onClick={() => navigate('/jobs/create')}
              className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold btn-press">
              Post a Job
            </button>
          } />
      ) : (
        <div className="space-y-4">
          {jobs.map((job: any) => (
            <GlassCard key={job._id} className="overflow-hidden group">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Left */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-[24px]">work</span>
                    </div>
                    <div>
                      <h3 className="text-headline-sm font-bold group-hover:text-primary transition-colors">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">corporate_fare</span>{job.department}
                        </span>
                        <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>{job.location}
                        </span>
                        <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>{job.type}
                        </span>
                        <span className="text-label-sm text-on-surface-variant opacity-60">·</span>
                        <span className="text-label-sm text-on-surface-variant opacity-60">
                          {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.requiredSkills?.slice(0, 5).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-bold uppercase">{s}</span>
                        ))}
                        {job.requiredSkills?.length > 5 && (
                          <span className="px-2 py-0.5 bg-surface-container rounded text-[10px] text-on-surface-variant">+{job.requiredSkills.length - 5}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: stats */}
                  <div className="flex items-center gap-6 text-center hidden md:flex flex-shrink-0">
                    <div>
                      <div className="text-headline-sm font-bold text-on-surface">{job.candidateCount ?? 0}</div>
                      <div className="text-[10px] text-on-surface-variant uppercase">Candidates</div>
                    </div>
                    <div>
                      <div className="text-headline-sm font-bold text-secondary">{job.topMatchCount ?? 0}</div>
                      <div className="text-[10px] text-secondary uppercase">Top Matches</div>
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <StatusBadge status={job.status} />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/jobs/${job._id}/candidates`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-label-sm font-bold hover:bg-primary/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">groups</span>
                        View Candidates
                      </button>
                      <button
                        onClick={() => navigate('/upload', { state: { jobId: job._id, jobTitle: job.title } })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
                        title="Upload resumes"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this job?')) deleteMut.mutate(job._id) }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-error/10 text-error hover:bg-error/20 transition-colors"
                        title="Delete job"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination page={pagination.page} pages={pagination.pages} onPage={setPage} />
        </div>
      )}
    </div>
  )
}
