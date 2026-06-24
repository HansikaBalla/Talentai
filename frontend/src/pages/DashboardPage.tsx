import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsApi, jobsApi, candidatesApi } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { GlassCard, StatCard, ScoreRing, StatusBadge, AIInsightBox, PageLoader } from '@/components/ui'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsApi.overview().then((r) => r.data.data.overview),
  })

  const { data: recentActivity } = useQuery({
    queryKey: ['analytics-recent'],
    queryFn: () => analyticsApi.recentActivity().then((r) => r.data.data),
  })

  const { data: topCandidates } = useQuery({
    queryKey: ['candidates-top'],
    queryFn: () => candidatesApi.list({ sortBy: 'matchScore', sortOrder: 'desc', limit: 5, parseStatus: 'completed' }).then((r) => r.data.data.candidates),
  })

  const { data: activeJobs } = useQuery({
    queryKey: ['jobs-active'],
    queryFn: () => jobsApi.list({ status: 'active', limit: 5 }).then((r) => r.data.data.jobs),
  })

  const shortlistMut = useMutation({
    mutationFn: (id: string) => candidatesApi.shortlist(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates-top'] }); toast.success('Shortlist updated') },
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="px-8 py-8 max-w-screen-xl mx-auto">
      {/* ── Welcome Header ─────────────────────────────────── */}
      <section className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-display-lg-mobile font-bold text-on-surface tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mt-2">
            {overview?.topMatches
              ? `Your AI copilot has identified ${overview.topMatches} high-match candidates across ${overview.activeJobs} active roles.`
              : 'Your AI recruiting copilot is ready.'}
          </p>
        </div>
        <div className="flex items-center gap-3 glass-card rounded-2xl p-4">
          <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary">bolt</span>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant">AI Processing</p>
            <p className="text-headline-sm text-secondary font-bold">Optimal</p>
          </div>
        </div>
      </section>

      {/* ── Overview Stats ─────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Active Jobs" value={overview?.activeJobs ?? '–'} icon="assignment" trend="+2 this week" trendUp />
        <StatCard label="Total Candidates" value={overview?.totalCandidates?.toLocaleString() ?? '–'} icon="person_search" iconColor="text-secondary" />
        <StatCard label="Top AI Matches" value={overview?.topMatches ?? '–'} icon="psychology" iconColor="text-tertiary" badge="Live"
          sub={`${overview?.avgMatchScore ?? 0}% Avg Score`} />
        <StatCard label="Time Saved" value={`${overview?.timeSavedHours ?? 0}h`} icon="schedule" iconColor="text-error" sub="hiring velocity improved" />
      </section>

      {/* ── Main Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* High Priority Candidates */}
        <GlassCard className="p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-headline-sm font-bold">High-Priority</h3>
            <button onClick={() => navigate('/jobs')} className="text-primary text-label-md hover:underline">View All</button>
          </div>

          <div className="space-y-4 flex-1">
            {topCandidates?.slice(0, 4).map((c: any) => (
              <div
                key={c._id}
                onClick={() => navigate(`/candidates/${c._id}`)}
                className="flex items-center gap-4 p-3 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer group"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold ring-2 ring-primary/20">
                    {c.name?.charAt(0)}
                  </div>
                  {c.isShortlisted && (
                    <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-secondary rounded-full border-2 border-surface flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px] text-on-secondary font-bold">verified</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors truncate">{c.name}</h4>
                  <p className="text-label-sm text-on-surface-variant truncate">{c.jobId?.title || 'Candidate'}</p>
                </div>
                <ScoreRing score={c.matchScore ?? 0} size={44} />
              </div>
            ))}
          </div>

          {topCandidates?.[0]?.aiInsight && (
            <AIInsightBox text={topCandidates[0].aiInsight} />
          )}
        </GlassCard>

        {/* Recent Job Activity */}
        <GlassCard className="lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center">
            <h3 className="text-headline-sm font-bold">Recent Job Activity</h3>
            <button onClick={() => navigate('/jobs')} className="text-primary text-label-md hover:underline">View All Jobs</button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-label-sm uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Job Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Candidates</th>
                  <th className="px-6 py-4">Avg Score</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {activeJobs?.map((job: any) => (
                  <tr key={job._id} className="hover:bg-surface-variant/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-on-surface">{job.title}</div>
                      <div className="text-xs text-on-surface-variant">{job.location} · {job.locationType}</div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={job.status} /></td>
                    <td className="px-6 py-4 text-label-md">{job.candidateCount ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${job.stats?.avgScore || 0}%` }} />
                        </div>
                        <span className="text-sm font-bold">{job.stats?.avgScore ? `${Math.round(job.stats.avgScore)}%` : '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/jobs/${job._id}/candidates`)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/20 text-on-surface-variant group-hover:text-primary transition-all"
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {(!activeJobs || activeJobs.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant text-body-md">
                      No active jobs yet. <button onClick={() => navigate('/jobs/create')} className="text-primary hover:underline">Post your first job</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer mini stats */}
          <div className="p-6 bg-surface-container-lowest flex items-center justify-between border-t border-outline-variant">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mb-1">Shortlisted</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-headline-sm font-bold text-secondary">{overview?.shortlistedCandidates ?? 0}</span>
                  <span className="text-[10px] text-secondary">candidates</span>
                </div>
              </div>
              <div className="h-8 w-px bg-outline-variant" />
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mb-1">Hired</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-headline-sm font-bold text-on-surface">{overview?.hiredCandidates ?? 0}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/jobs/create')}
              className="bg-primary text-on-primary px-5 py-2 rounded-xl text-label-md font-bold hover:shadow-glow-primary transition-all btn-press"
            >
              + Post Job
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
