import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '@/api/client'
import { GlassCard, LoadingSpinner } from '@/components/ui'
import toast from 'react-hot-toast'

const SKILL_SUGGESTIONS = ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Machine Learning', 'TensorFlow', 'Figma']
const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Data Science', 'AI Research', 'Marketing', 'Sales', 'HR', 'Finance', 'Legal']

export default function CreateJobPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: '', department: '', location: '', locationType: 'Remote', type: 'Full-time',
    description: '', requirements: '', minExperience: 0, salaryMin: '', salaryMax: '',
    status: 'active',
  })
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [niceSkills, setNiceSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')

  const createMut = useMutation({
    mutationFn: () => jobsApi.create({ ...form, requiredSkills, niceToHaveSkills: niceSkills }),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Job posted successfully!')
      navigate(`/jobs/${data.data.job._id}/candidates`)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create job'),
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const addSkill = (to: 'required' | 'nice', skill: string) => {
    const clean = skill.trim()
    if (!clean) return
    if (to === 'required') setRequiredSkills(s => [...new Set([...s, clean])])
    else setNiceSkills(s => [...new Set([...s, clean])])
    setSkillInput('')
  }

  const removeSkill = (from: 'required' | 'nice', skill: string) => {
    if (from === 'required') setRequiredSkills(s => s.filter(x => x !== skill))
    else setNiceSkills(s => s.filter(x => x !== skill))
  }

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <button onClick={() => navigate('/jobs')} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-4">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Jobs
        </button>
        <h2 className="text-display-lg-mobile font-bold">Post New Job</h2>
        <p className="text-body-md text-on-surface-variant mt-1">Fill in the details. Skills are required for AI matching.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); createMut.mutate() }} className="space-y-6">
        {/* Basic Info */}
        <GlassCard className="p-6 space-y-5">
          <h3 className="text-headline-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">work</span> Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-full">
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Job Title *</label>
              <input required value={form.title} onChange={set('title')} placeholder="e.g. Senior React Developer"
                className="w-full px-4 py-3 rounded-xl text-body-md" />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Department *</label>
              <select value={form.department} onChange={set('department')} required className="w-full px-4 py-3 rounded-xl text-body-md">
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Location *</label>
              <input required value={form.location} onChange={set('location')} placeholder="e.g. San Francisco, CA"
                className="w-full px-4 py-3 rounded-xl text-body-md" />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Work Type</label>
              <select value={form.locationType} onChange={set('locationType')} className="w-full px-4 py-3 rounded-xl text-body-md">
                {['Remote', 'Hybrid', 'On-site'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Employment Type</label>
              <select value={form.type} onChange={set('type')} className="w-full px-4 py-3 rounded-xl text-body-md">
                {['Full-time', 'Part-time', 'Contract', 'Internship'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Min. Experience (years)</label>
              <input type="number" value={form.minExperience} onChange={set('minExperience')} min={0} max={30}
                className="w-full px-4 py-3 rounded-xl text-body-md" />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Status</label>
              <select value={form.status} onChange={set('status')} className="w-full px-4 py-3 rounded-xl text-body-md">
                {['active', 'draft', 'paused'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Salary Range (optional)</label>
              <div className="flex gap-2 items-center">
                <input type="number" value={form.salaryMin} onChange={set('salaryMin')} placeholder="Min"
                  className="w-full px-4 py-3 rounded-xl text-body-md" />
                <span className="text-on-surface-variant">–</span>
                <input type="number" value={form.salaryMax} onChange={set('salaryMax')} placeholder="Max"
                  className="w-full px-4 py-3 rounded-xl text-body-md" />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Description */}
        <GlassCard className="p-6 space-y-5">
          <h3 className="text-headline-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">description</span> Job Details
          </h3>
          <div>
            <label className="text-label-md text-on-surface-variant mb-1.5 block">Description *</label>
            <textarea required value={form.description} onChange={set('description')} rows={5}
              placeholder="Describe the role, responsibilities, and what makes it exciting..."
              className="w-full px-4 py-3 rounded-xl text-body-md resize-none" />
          </div>
          <div>
            <label className="text-label-md text-on-surface-variant mb-1.5 block">Requirements</label>
            <textarea value={form.requirements} onChange={set('requirements')} rows={3}
              placeholder="Technical qualifications, education requirements, must-haves..."
              className="w-full px-4 py-3 rounded-xl text-body-md resize-none" />
          </div>
        </GlassCard>

        {/* Skills */}
        <GlassCard className="p-6 space-y-6">
          <h3 className="text-headline-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">psychology</span> Skills (used by AI Ranking)
          </h3>

          {/* Required Skills */}
          <div>
            <label className="text-label-md text-on-surface-variant mb-1.5 block">
              Required Skills <span className="text-error">*</span>
              <span className="ml-2 text-xs text-on-surface-variant opacity-60">Critical for AI scoring (40% weight)</span>
            </label>
            <div className="flex gap-2 mb-3">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill('required', skillInput) } }}
                placeholder="Type a skill and press Enter or click +"
                className="flex-1 px-4 py-2.5 rounded-xl text-label-md" />
              <button type="button" onClick={() => addSkill('required', skillInput)}
                className="px-4 py-2 bg-primary/20 text-primary rounded-xl text-label-md hover:bg-primary/30">+</button>
            </div>
            {/* Suggestions */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {SKILL_SUGGESTIONS.filter(s => !requiredSkills.includes(s)).slice(0, 8).map(s => (
                <button key={s} type="button" onClick={() => addSkill('required', s)}
                  className="px-2.5 py-1 border border-outline-variant rounded-lg text-[11px] text-on-surface-variant hover:border-primary hover:text-primary transition-colors">
                  + {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {requiredSkills.map(s => (
                <span key={s} className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary border border-primary/30 rounded-lg text-label-sm font-bold">
                  {s}
                  <button type="button" onClick={() => removeSkill('required', s)} className="ml-1 hover:text-error">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Nice to Have */}
          <div>
            <label className="text-label-md text-on-surface-variant mb-1.5 block">
              Nice-to-Have Skills
              <span className="ml-2 text-xs text-on-surface-variant opacity-60">Bonus points in AI scoring</span>
            </label>
            <div className="flex gap-2 mb-3">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill('nice', skillInput) } }}
                placeholder="Type a nice-to-have skill..."
                className="flex-1 px-4 py-2.5 rounded-xl text-label-md" />
              <button type="button" onClick={() => addSkill('nice', skillInput)}
                className="px-4 py-2 bg-secondary/20 text-secondary rounded-xl text-label-md hover:bg-secondary/30">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {niceSkills.map(s => (
                <span key={s} className="flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary border border-secondary/30 rounded-lg text-label-sm font-bold">
                  {s}
                  <button type="button" onClick={() => removeSkill('nice', s)} className="ml-1 hover:text-error">×</button>
                </span>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Submit */}
        <div className="flex gap-4 justify-end">
          <button type="button" onClick={() => navigate('/jobs')}
            className="px-6 py-3 border border-outline rounded-xl text-label-md text-on-surface-variant hover:bg-surface-variant transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={createMut.isPending || requiredSkills.length === 0}
            className="px-8 py-3 bg-primary text-on-primary rounded-xl text-label-md font-bold hover:shadow-glow-primary transition-all btn-press disabled:opacity-50 flex items-center gap-2">
            {createMut.isPending ? <><LoadingSpinner size="sm" /> Posting...</> : (
              <><span className="material-symbols-outlined text-[18px]">publish</span> Post Job</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
