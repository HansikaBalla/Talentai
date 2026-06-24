import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi, candidatesApi } from '@/api/client'
import { GlassCard, ScoreRing, StatusBadge, SkillBadge, AIInsightBox, PageLoader, EmptyState } from '@/components/ui'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['new', 'shortlisted', 'reviewing', 'interviewed', 'offered', 'rejected', 'hired']

export default function CandidateRankingPage() {
  const { id: jobId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('matchScore')

  const { data: jobData } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.get(jobId!).then(r => r.data.data),
  })

  const { data: candidateData, isLoading } = useQuery({
    queryKey: ['candidates', jobId, { search, statusFilter, sortBy }],
    queryFn: () => candidatesApi.list({
      jobId,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      sortBy, sortOrder: 'desc', limit: 50,
    }).then(r => r.data.data),
    enabled: !!jobId,
  })

  const rankMut = useMutation({
    mutationFn: () => jobsApi.rank(jobId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates', jobId] })
      toast.success('AI ranking complete!')
    },
  })

  const shortlistMut = useMutation({
    mutationFn: (cid: string) => candidatesApi.shortlist(cid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates', jobId] }),
  })

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => candidatesApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates', jobId] }),
  })

  const job = jobData?.job
  const candidates = candidateData?.candidates || []
  const stats = jobData?.stats

  if (isLoading) return <PageLoader />

  const filtered = candidates.filter((c: any) => {
    if (!search) return true
    return c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="px-8 py-8 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => navigate('/jobs')} className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-4 transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to Jobs
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-display-lg-mobile font-bold tracking-tight">{job?.title || 'Candidates'}</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <span className="text-on-surface-variant text-label-md">{job?.department}</span>
              <span className="text-outline">·</span>
              <span className="text-on-surface-variant text-label-md">{job?.location}</span>
              <StatusBadge status={job?.status || 'active'} />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/upload', { state: { jobId, jobTitle: job?.title } })}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary/10 text-secondary border border-secondary/30 rounded-xl text-label-md hover:bg-secondary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span> Upload Resumes
            </button>
            <button
              onClick={() => rankMut.mutate()}
              disabled={rankMut.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-label-md font-bold hover:shadow-glow-primary transition-all btn-press disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[16px]">{rankMut.isPending ? 'refresh' : 'auto_awesome'}</span>
              {rankMut.isPending ? 'Ranking…' : 'Re-Run AI Ranking'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: candidateData?.pagination?.total ?? 0, icon: 'groups', color: 'text-on-surface' },
          { label: 'Shortlisted', value: filtered.filter((c: any) => c.isShortlisted).length, icon: 'verified', color: 'text-secondary' },
          { label: 'Avg Score', value: stats?.avgScore ? `${Math.round(stats.avgScore)}%` : '–', icon: 'psychology', color: 'text-primary' },
          { label: 'Top Match', value: stats?.maxScore ? `${Math.round(stats.maxScore)}%` : '–', icon: 'emoji_events', color: 'text-tertiary' },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4 flex items-center gap-4">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{s.label}</p>
              <span className={`material-symbols-outlined text-[16px] ${s.color} opacity-50`}>{s.icon}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Filters */}
      <GlassCard className="p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidates…"
            className="w-full pl-9 pr-4 py-2 rounded-xl text-label-md bg-surface-container border-none" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', ...STATUS_OPTIONS].slice(0, 6).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-label-sm capitalize transition-colors ${statusFilter === s ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}>
              {s}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="py-2 px-3 rounded-xl text-label-md bg-surface-container border-none">
          <option value="matchScore">Sort: AI Score</option>
          <option value="createdAt">Sort: Recent</option>
          <option value="experienceYears">Sort: Experience</option>
        </select>
      </GlassCard>

      {/* Candidates Table */}
      {filtered.length === 0 ? (
        <EmptyState icon="person_search" title="No candidates yet"
          subtitle="Upload resumes to start AI matching"
          action={
            <button onClick={() => navigate('/upload', { state: { jobId, jobTitle: job?.title } })}
              className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold btn-press">
              Upload Resumes
            </button>
          } />
      ) : (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-6 py-4 w-8">#</th>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">AI Score</th>
                <th className="px-6 py-4">Skills</th>
                <th className="px-6 py-4">Experience</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {filtered.map((c: any, idx: number) => (
                <tr key={c._id} className="hover:bg-surface-variant/20 transition-colors group">
                  <td className="px-6 py-4 text-on-surface-variant text-label-sm font-bold">{c.rankPosition ?? idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/candidates/${c._id}`)}>
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold ring-2 ring-primary/20">
                          {c.name?.charAt(0)}
                        </div>
                        {c.isShortlisted && (
                          <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-secondary rounded-full border-2 border-surface" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-on-surface group-hover:text-primary transition-colors">{c.name}</div>
                        <div className="text-xs text-on-surface-variant">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <ScoreRing score={c.matchScore ?? 0} size={44} />
                      <div className="hidden xl:block text-[10px] text-on-surface-variant max-w-[160px] leading-tight">
                        {c.aiInsight?.substring(0, 60)}…
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {c.matchedSkills?.slice(0, 3).map((s: string) => (
                        <SkillBadge key={s} skill={s} matched />
                      ))}
                      {c.missingSkills?.slice(0, 1).map((s: string) => (
                        <SkillBadge key={s} skill={s} missing />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-label-md">
                    <span className="text-on-surface font-bold">{c.experienceYears}yr</span>
                    <span className="text-on-surface-variant"> exp</span>
                  </td>
                  <td className="px-6 py-4">
                    <select value={c.status} onChange={(e) => updateStatusMut.mutate({ id: c._id, status: e.target.value })}
                      className="bg-transparent border-none text-label-sm text-on-surface-variant p-0 focus:ring-0">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-surface-container-high">{s}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/candidates/${c._id}`)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                        title="View profile">
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                      </button>
                      <button onClick={() => shortlistMut.mutate(c._id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${c.isShortlisted ? 'text-secondary bg-secondary/10' : 'text-on-surface-variant hover:text-secondary hover:bg-secondary/10'}`}
                        title={c.isShortlisted ? 'Remove shortlist' : 'Shortlist'}>
                        <span className="material-symbols-outlined text-[16px]">{c.isShortlisted ? 'bookmark' : 'bookmark_border'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  )
}
