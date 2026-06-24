import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { candidatesApi } from '@/api/client'
import { GlassCard, ScoreRing, StatusBadge, SkillBadge, AIInsightBox, PageLoader } from '@/components/ui'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['new', 'shortlisted', 'reviewing', 'interviewed', 'offered', 'rejected', 'hired']

export default function CandidateProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidatesApi.get(id!).then(r => r.data.data.candidate),
  })

  const updateMut = useMutation({
    mutationFn: (updates: object) => candidatesApi.update(id!, updates),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidate', id] }); toast.success('Updated') },
  })

  const rescoreMut = useMutation({
    mutationFn: () => candidatesApi.rescore(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidate', id] }); toast.success('AI score refreshed!') },
  })

  const c = data
  if (isLoading) return <PageLoader />
  if (!c) return <div className="p-8 text-center">Candidate not found</div>

  const scoreColor = (c.matchScore ?? 0) >= 80 ? 'text-secondary' : (c.matchScore ?? 0) >= 60 ? 'text-primary' : 'text-tertiary'

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary mb-6 transition-colors">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Profile */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-3xl font-black mx-auto mb-4 ring-4 ring-primary/20">
                {c.name?.charAt(0)}
              </div>
              <h2 className="text-headline-md font-bold">{c.name}</h2>
              {c.location && <p className="text-on-surface-variant text-label-md mt-1 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[14px]">location_on</span>{c.location}
              </p>}
              <div className="mt-3"><StatusBadge status={c.status} /></div>
            </div>

            <div className="space-y-3">
              {c.email && (
                <a href={`mailto:${c.email}`} className="flex items-center gap-3 text-label-md text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">mail</span>{c.email}
                </a>
              )}
              {c.phone && (
                <div className="flex items-center gap-3 text-label-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">phone</span>{c.phone}
                </div>
              )}
              {c.linkedinUrl && (
                <a href={c.linkedinUrl} target="_blank" className="flex items-center gap-3 text-label-md text-primary hover:underline">
                  <span className="material-symbols-outlined text-[18px]">link</span>LinkedIn Profile
                </a>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-outline-variant">
              <div className="flex items-center justify-between mb-3">
                <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Update Status</span>
              </div>
              <select value={c.status}
                onChange={(e) => updateMut.mutate({ status: e.target.value })}
                className="w-full px-4 py-2 rounded-xl text-label-md">
                {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-surface-container-high">{s}</option>)}
              </select>
            </div>

            {/* Action buttons */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => updateMut.mutate({ isShortlisted: !c.isShortlisted })}
                className={`py-2 rounded-xl text-label-sm font-bold btn-press transition-all ${c.isShortlisted ? 'bg-secondary text-on-secondary' : 'bg-secondary/10 text-secondary border border-secondary/30'}`}
              >
                {c.isShortlisted ? '★ Shortlisted' : '☆ Shortlist'}
              </button>
              <button
                onClick={() => rescoreMut.mutate()}
                disabled={rescoreMut.isPending}
                className="py-2 rounded-xl text-label-sm bg-primary/10 text-primary border border-primary/30 btn-press hover:bg-primary/20 transition-all disabled:opacity-50"
              >
                {rescoreMut.isPending ? 'Scoring…' : '⚡ Re-score'}
              </button>
            </div>
          </GlassCard>

          {/* AI Score */}
          <GlassCard className="p-6">
            <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-6">AI Match Score</h3>
            <div className="flex items-center justify-center mb-6">
              <ScoreRing score={c.matchScore ?? 0} size={100} strokeWidth={8} />
            </div>
            <div className="space-y-3">
              {[
                { label: 'Skills Match', value: c.scoreBreakdown?.skillsMatch ?? 0, color: 'bg-secondary' },
                { label: 'Experience', value: c.scoreBreakdown?.experienceMatch ?? 0, color: 'bg-primary' },
                { label: 'Education', value: c.scoreBreakdown?.educationMatch ?? 0, color: 'bg-tertiary' },
                { label: 'Keyword Fit', value: c.scoreBreakdown?.keywordDensity ?? 0, color: 'bg-blue-400' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-label-sm mb-1">
                    <span className="text-on-surface-variant">{s.label}</span>
                    <span className="font-bold text-on-surface">{s.value}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full transition-all duration-1000`} style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job match */}
          {c.jobId && (
            <GlassCard className="p-6">
              <h3 className="text-headline-sm font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">work</span> Applied For
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-on-surface">{c.jobId.title}</h4>
                  <p className="text-label-sm text-on-surface-variant mt-1">{c.jobId.department} · {c.jobId.location}</p>
                </div>
                <button onClick={() => navigate(`/jobs/${c.jobId._id}/candidates`)}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-label-sm hover:bg-primary/20 transition-colors">
                  View All Candidates
                </button>
              </div>
            </GlassCard>
          )}

          {/* AI Insight */}
          {c.aiInsight && <AIInsightBox text={c.aiInsight} />}

          {/* Skills */}
          <GlassCard className="p-6">
            <h3 className="text-headline-sm font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">psychology</span> Skills Analysis
            </h3>
            {c.matchedSkills?.length > 0 && (
              <div className="mb-4">
                <p className="text-label-sm text-secondary mb-2 font-bold">✓ Matched Skills</p>
                <div className="flex flex-wrap gap-2">
                  {c.matchedSkills.map((s: string) => <SkillBadge key={s} skill={s} matched size="md" />)}
                </div>
              </div>
            )}
            {c.missingSkills?.length > 0 && (
              <div className="mb-4">
                <p className="text-label-sm text-error mb-2 font-bold">✗ Missing Skills</p>
                <div className="flex flex-wrap gap-2">
                  {c.missingSkills.map((s: string) => <SkillBadge key={s} skill={s} missing size="md" />)}
                </div>
              </div>
            )}
            {c.skills?.length > 0 && (
              <div>
                <p className="text-label-sm text-on-surface-variant mb-2">All Skills</p>
                <div className="flex flex-wrap gap-2">
                  {c.skills.map((s: string) => <SkillBadge key={s} skill={s} size="md" />)}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Experience */}
          <GlassCard className="p-6">
            <h3 className="text-headline-sm font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">timeline</span> Experience
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-tertiary/10 flex items-center justify-center">
                <span className="text-headline-md font-black text-tertiary">{c.experienceYears}</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">Years of experience</p>
                <p className="text-label-sm text-on-surface-variant">Total professional tenure</p>
              </div>
            </div>
          </GlassCard>

          {/* Education */}
          {c.education?.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="text-headline-sm font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">school</span> Education
              </h3>
              <div className="space-y-3">
                {c.education.map((edu: any, i: number) => (
                  <div key={i} className="p-3 bg-surface-container rounded-xl">
                    <p className="font-bold text-on-surface text-label-md">{edu.degree}</p>
                    {edu.institution && <p className="text-label-sm text-on-surface-variant">{edu.institution}</p>}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Summary */}
          {c.summary && (
            <GlassCard className="p-6">
              <h3 className="text-headline-sm font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant">person</span> Summary
              </h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed">{c.summary}</p>
            </GlassCard>
          )}

          {/* Notes */}
          <GlassCard className="p-6">
            <h3 className="text-headline-sm font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">notes</span> Recruiter Notes
            </h3>
            <textarea
              defaultValue={c.notes || ''}
              onBlur={(e) => updateMut.mutate({ notes: e.target.value })}
              placeholder="Add private notes about this candidate..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-body-md resize-none"
            />
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
