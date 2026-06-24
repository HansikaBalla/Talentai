import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/client'
import { GlassCard, PageLoader, StatCard } from '@/components/ui'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
  FunnelChart, Funnel, LabelList, Treemap,
} from 'recharts'

const COLORS = ['#c0c1ff', '#4edea3', '#ffb95f', '#ffb4ab', '#818cf8', '#34d399']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-container-high border border-outline-variant rounded-xl p-3 shadow-xl">
      {label && <p className="text-label-sm text-on-surface-variant mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-label-md font-bold" style={{ color: p.color || p.fill || '#c0c1ff' }}>
          {p.name}: {typeof p.value === 'number' && p.value % 1 !== 0 ? p.value.toFixed(1) : p.value}
          {p.name?.toLowerCase().includes('score') ? '%' : ''}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsApi.overview().then(r => r.data.data.overview),
  })

  const { data: funnelData } = useQuery({
    queryKey: ['analytics-funnel'],
    queryFn: () => analyticsApi.funnel().then(r => r.data.data.funnel),
  })

  const { data: skillsData } = useQuery({
    queryKey: ['analytics-skills'],
    queryFn: () => analyticsApi.skills().then(r => r.data.data.skills),
  })

  const { data: scoreDistData } = useQuery({
    queryKey: ['analytics-score-dist'],
    queryFn: () => analyticsApi.scoreDistribution().then(r => r.data.data.distribution),
  })

  const { data: deptData } = useQuery({
    queryKey: ['analytics-departments'],
    queryFn: () => analyticsApi.departments().then(r => r.data.data.departments),
  })

  if (loadingOverview) return <PageLoader />

  const funnelFormatted = funnelData?.map((s: any, i: number) => ({
    ...s,
    fill: COLORS[i] || '#c0c1ff',
    value: s.count,
  })) || []

  const scoreDistFormatted = scoreDistData?.map((d: any) => ({
    range: `${d._id}–${d._id + 10}`,
    count: d.count,
  })) || []

  return (
    <div className="px-8 py-8 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-display-lg-mobile font-bold tracking-tight">Analytics & Insights</h2>
        <p className="text-body-md text-on-surface-variant mt-1">Live recruitment intelligence powered by AI.</p>
      </div>

      {/* Overview KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Candidates" value={overview?.totalCandidates?.toLocaleString() ?? '–'} icon="groups" />
        <StatCard label="Avg Match Score" value={`${overview?.avgMatchScore ?? 0}%`} icon="psychology" iconColor="text-secondary" />
        <StatCard label="Top Matches (≥80%)" value={overview?.topMatches ?? '–'} icon="emoji_events" iconColor="text-tertiary" badge="AI" />
        <StatCard label="Hours Saved" value={`${overview?.timeSavedHours ?? 0}h`} icon="schedule" iconColor="text-error" sub="from manual screening" />
      </section>

      {/* ── Row 1: Funnel + Score Dist ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Hiring Funnel */}
        <GlassCard className="p-6">
          <h3 className="text-headline-sm font-bold mb-6">Hiring Funnel</h3>
          {funnelFormatted.length > 0 ? (
            <div className="space-y-3">
              {funnelFormatted.map((stage: any, i: number) => {
                const maxCount = funnelFormatted[0]?.count || 1
                const pct = ((stage.count / maxCount) * 100).toFixed(0)
                return (
                  <div key={stage.stage}>
                    <div className="flex justify-between text-label-sm mb-1">
                      <span className="text-on-surface-variant">{stage.stage}</span>
                      <span className="font-bold text-on-surface">{stage.count}</span>
                    </div>
                    <div className="h-8 bg-surface-container rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg flex items-center pl-3 transition-all duration-1000"
                        style={{ width: `${Math.max(parseInt(pct), 8)}%`, background: COLORS[i] || '#c0c1ff' }}
                      >
                        <span className="text-[10px] font-black text-surface-container-lowest">{pct}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div className="pt-3 border-t border-outline-variant flex justify-between text-label-sm">
                <span className="text-on-surface-variant">Overall conversion</span>
                <span className="text-secondary font-bold">{funnelData ? ((funnelData[funnelData.length - 1]?.count / (funnelData[0]?.count || 1)) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-on-surface-variant">No funnel data yet</div>
          )}
        </GlassCard>

        {/* Score Distribution */}
        <GlassCard className="p-6">
          <h3 className="text-headline-sm font-bold mb-6">AI Score Distribution</h3>
          {scoreDistFormatted.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreDistFormatted} barSize={20}>
                <XAxis dataKey="range" tick={{ fill: '#908fa0', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#908fa0', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]}>
                  {scoreDistFormatted.map((_: any, i: number) => (
                    <Cell key={i} fill={i >= 5 ? '#4edea3' : i >= 3 ? '#c0c1ff' : '#ffb95f'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-on-surface-variant">No score data yet</div>
          )}
        </GlassCard>
      </div>

      {/* ── Row 2: Top Skills + Departments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Skills */}
        <GlassCard className="p-6">
          <h3 className="text-headline-sm font-bold mb-6">Top Skills in Talent Pool</h3>
          {skillsData?.slice(0, 10).length > 0 ? (
            <div className="space-y-3">
              {skillsData.slice(0, 10).map((s: any, i: number) => (
                <div key={s.skill}>
                  <div className="flex justify-between text-label-sm mb-1">
                    <span className="flex items-center gap-2">
                      <span className="w-5 text-on-surface-variant text-center">{i + 1}.</span>
                      <span className="text-on-surface font-bold capitalize">{s.skill}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface-variant">{s.count} candidates</span>
                      <span className="text-secondary font-bold">{s.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${s.percentage}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-on-surface-variant">No skill data yet</div>
          )}
        </GlassCard>

        {/* Department Performance */}
        <GlassCard className="p-6">
          <h3 className="text-headline-sm font-bold mb-6">Department Avg. AI Score</h3>
          {deptData?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptData} barSize={28} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#908fa0', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="department" type="category" tick={{ fill: '#dae2fd', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avgScore" name="Avg Score" radius={[0, 4, 4, 0]}>
                    {deptData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {deptData.slice(0, 4).map((d: any, i: number) => (
                  <div key={d.department} className="p-3 bg-surface-container rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-on-surface-variant truncate">{d.department}</span>
                    </div>
                    <span className="text-headline-sm font-bold text-on-surface">{d.avgScore}%</span>
                    <span className="text-xs text-on-surface-variant ml-1">{d.count} candidates</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-on-surface-variant">No department data yet</div>
          )}
        </GlassCard>
      </div>

      {/* ── AI Insights Panel ── */}
      <GlassCard className="p-6">
        <h3 className="text-headline-sm font-bold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">auto_awesome</span>
          AI Recruitment Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-primary/5 rounded-2xl border border-primary/20">
            <span className="material-symbols-outlined text-primary text-[28px] mb-3 block">trending_up</span>
            <h4 className="text-label-md font-bold mb-2 text-primary">Talent Pipeline Health</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {overview?.avgMatchScore && overview.avgMatchScore >= 70
                ? 'Excellent pipeline quality. Your average match score exceeds industry benchmark of 65%.'
                : 'Consider broadening your skill requirements or sourcing candidates from additional channels.'}
            </p>
          </div>
          <div className="p-5 bg-secondary/5 rounded-2xl border border-secondary/20">
            <span className="material-symbols-outlined text-secondary text-[28px] mb-3 block">schedule</span>
            <h4 className="text-label-md font-bold mb-2 text-secondary">Efficiency Gains</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              TalentAI has saved your team approximately <strong className="text-secondary">{overview?.timeSavedHours ?? 0} hours</strong> of manual screening. At $75/hr, that's <strong className="text-secondary">${((overview?.timeSavedHours || 0) * 75).toLocaleString()}</strong> in value created.
            </p>
          </div>
          <div className="p-5 bg-tertiary/5 rounded-2xl border border-tertiary/20">
            <span className="material-symbols-outlined text-tertiary text-[28px] mb-3 block">tips_and_updates</span>
            <h4 className="text-label-md font-bold mb-2 text-tertiary">Recommendation</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {(skillsData?.[0]?.skill)
                ? `"${skillsData[0].skill}" is the most common skill in your talent pool. Consider whether your job requirements align with available supply.`
                : 'Upload more resumes to generate personalized AI recommendations for your recruiting strategy.'}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
