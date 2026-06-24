import { useNavigate } from 'react-router-dom'

const FEATURES = [
  { icon: 'description', title: 'Resume Parsing', desc: 'Advanced NLP extracts skills, experience, and education across PDF & DOCX formats in seconds.' },
  { icon: 'analytics',   title: 'AI Scoring',    desc: 'Weighted multi-dimensional scoring compares candidates against your specific job requirements.' },
  { icon: 'format_list_numbered', title: 'Ranked Shortlists', desc: 'Wake up to a prioritized list of pre-vetted candidates. Spend your day interviewing, not digging.' },
]

const STATS = [
  { value: '85%', label: 'Time Reduction', icon: 'schedule' },
  { value: '98%', label: 'Match Accuracy', icon: 'psychology' },
  { value: '500+', label: 'Teams Using TalentAI', icon: 'groups' },
  { value: '2.4M', label: 'Resumes Processed', icon: 'description' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">
      {/* ── TopNav ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 h-16 flex justify-between items-center px-8 z-40 glass-nav border-b border-outline-variant">
        <div className="flex items-center gap-8">
          <span className="text-headline-sm font-black text-primary tracking-tight">TalentAI</span>
          <div className="hidden md:flex gap-6">
            {['Features', 'How it works', 'Pricing'].map((l) => (
              <a key={l} href="#" className="text-on-surface-variant text-label-md hover:text-primary transition-colors">{l}</a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/login')} className="text-on-surface-variant text-label-md hover:text-primary transition-colors">
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="bg-primary text-on-primary px-5 py-2 rounded-xl text-label-md font-bold hover:shadow-glow-primary transition-all btn-press"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 md:px-10 pt-16">
        {/* Background gradient blobs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />

        <div className="relative z-10 max-w-5xl text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary mb-8">
            <span className="material-symbols-filled text-[16px]">auto_awesome</span>
            <span className="text-label-sm">NEXT-GEN RECRUITING COPILOT</span>
          </div>

          <h1 className="text-display-lg-mobile md:text-display-lg mb-6 leading-tight text-on-surface">
            Hire Smarter with{' '}
            <span className="gradient-text">AI-Powered<br />Candidate Ranking</span>
          </h1>

          <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
            Revolutionize your talent acquisition. Save hours of manual screening with deep-learning algorithms that analyze skills, cultural fit, and potential in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary rounded-xl text-headline-sm font-bold hover:shadow-glow-primary transition-all btn-press active-glow"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-surface-container-high text-on-surface border border-outline-variant rounded-xl text-headline-sm font-bold hover:bg-surface-variant transition-all"
            >
              Sign In →
            </button>
          </div>

          {/* Dashboard preview mockup */}
          <div className="relative group max-w-4xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />
            <div className="relative glass-panel rounded-2xl overflow-hidden p-1">
              <div className="bg-surface-container-low rounded-xl p-6">
                {/* Mini dashboard preview */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[{ v: '24', l: 'Active Jobs' }, { v: '1,842', l: 'Candidates' }, { v: '156', l: 'Top Matches' }, { v: '42h', l: 'Time Saved' }].map((s) => (
                    <div key={s.l} className="bg-surface-container rounded-xl p-3 text-center">
                      <div className="text-headline-sm font-bold text-primary">{s.v}</div>
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">{s.l}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[{ name: 'Alex Rivera', score: 98, role: 'Cloud Architect' }, { name: 'Elena Chen', score: 94, role: 'Data Scientist' }, { name: 'Marcus Thorne', score: 91, role: 'DevOps Lead' }].map((c) => (
                    <div key={c.name} className="flex items-center gap-3 bg-surface-container rounded-lg p-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-bold">{c.name[0]}</div>
                      <div className="flex-1 text-left">
                        <div className="text-label-md text-on-surface font-bold">{c.name}</div>
                        <div className="text-[10px] text-on-surface-variant">{c.role}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                          <div className="h-full bg-secondary rounded-full" style={{ width: `${c.score}%` }} />
                        </div>
                        <span className="text-xs font-bold text-secondary">{c.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="py-16 border-y border-outline-variant bg-surface-container-lowest/50">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-display-lg-mobile font-black gradient-text">{s.value}</div>
                <div className="text-label-md text-on-surface-variant mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="py-24 px-8 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-headline-md font-bold mb-4">Precision Pipeline Methodology</h2>
          <p className="text-body-md text-on-surface-variant max-w-xl mx-auto">
            Our AI engine works silently to surface top talent before you even open a resume.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div key={f.title}
              className="glass-card p-8 rounded-3xl flex flex-col items-start gap-6 hover:border-primary/50 transition-colors group animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-all">
                <span className="material-symbols-outlined text-[32px]">{f.icon}</span>
              </div>
              <div>
                <h3 className="text-headline-sm font-bold mb-3">{f.title}</h3>
                <p className="text-on-surface-variant text-body-md leading-relaxed">{f.desc}</p>
              </div>
              {i === 1 && (
                <div className="w-full">
                  <div className="flex justify-between text-label-sm mb-1">
                    <span className="text-secondary">Match Accuracy</span><span>98.4%</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2">
                    <div className="bg-secondary h-full rounded-full" style={{ width: '98%' }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto rounded-[3rem] bg-gradient-to-br from-primary-container to-secondary-container p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-display-lg-mobile font-extrabold text-on-primary-container mb-6">
            Ready to find your next star hire?
          </h2>
          <p className="text-body-lg text-on-primary-container/80 max-w-xl mx-auto mb-10">
            Join 500+ teams scaling their headcount with TalentAI's intelligent sourcing engine.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="px-10 py-5 bg-on-primary-container text-surface rounded-2xl font-bold hover:scale-105 transition-transform btn-press"
            >
              Start 14-Day Free Trial
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-10 py-5 border-2 border-on-primary-container/30 text-on-primary-container rounded-2xl font-bold hover:bg-on-primary-container/10 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-outline-variant py-12 px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="text-headline-sm font-bold text-primary">TalentAI</div>
            <p className="text-label-sm text-on-surface-variant mt-1">The intelligent co-pilot for high-performance HR.</p>
          </div>
          <div className="flex flex-wrap gap-6">
            {['Privacy Policy', 'Terms of Service', 'API Docs', 'Contact Support'].map((l) => (
              <a key={l} href="#" className="text-label-sm text-on-surface-variant hover:text-secondary transition-colors">{l}</a>
            ))}
          </div>
        </div>
        <div className="text-center text-label-sm text-on-surface-variant/50 mt-8">
          © 2024 TalentAI Systems. Powered by Electric Indigo AI.
        </div>
      </footer>
    </div>
  )
}
