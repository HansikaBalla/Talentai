// ─── ScoreRing ─────────────────────────────────────────────────────────────
interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

export function ScoreRing({ score, size = 48, strokeWidth = 4, showLabel = true }: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 80 ? '#4edea3' :
    score >= 60 ? '#c0c1ff' :
    score >= 40 ? '#ffb95f' : '#ffb4ab'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="transparent" stroke="#334155" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="transparent" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="score-ring-track"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-[10px] font-bold" style={{ color }}>
          {score}%
        </span>
      )}
    </div>
  )
}

// ─── SkillBadge ────────────────────────────────────────────────────────────
interface SkillBadgeProps {
  skill: string
  matched?: boolean
  missing?: boolean
  size?: 'sm' | 'md'
}

export function SkillBadge({ skill, matched, missing, size = 'sm' }: SkillBadgeProps) {
  const base = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
  const color = missing
    ? 'bg-error/10 text-error border border-error/20'
    : matched
    ? 'bg-secondary/10 text-secondary border border-secondary/20'
    : 'bg-primary/10 text-primary border border-primary/20'

  return (
    <span className={`${base} ${color} rounded font-bold uppercase tracking-wide`}>
      {skill}
    </span>
  )
}

// ─── StatusBadge ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  new:         { label: 'New',         className: 'bg-primary/10 text-primary border border-primary/20',       dot: 'bg-primary' },
  shortlisted: { label: 'Shortlisted', className: 'bg-secondary/10 text-secondary border border-secondary/20', dot: 'bg-secondary' },
  reviewing:   { label: 'Reviewing',   className: 'bg-tertiary/10 text-tertiary border border-tertiary/20',    dot: 'bg-tertiary' },
  interviewed: { label: 'Interviewed', className: 'bg-blue-400/10 text-blue-400 border border-blue-400/20',    dot: 'bg-blue-400' },
  offered:     { label: 'Offered',     className: 'bg-purple-400/10 text-purple-400 border border-purple-400/20', dot: 'bg-purple-400' },
  rejected:    { label: 'Rejected',    className: 'bg-error/10 text-error border border-error/20',             dot: 'bg-error' },
  hired:       { label: 'Hired',       className: 'bg-secondary/20 text-secondary border border-secondary/30', dot: 'bg-secondary animate-pulse' },
  active:      { label: 'Active',      className: 'bg-secondary/10 text-secondary border border-secondary/20', dot: 'bg-secondary animate-pulse' },
  closed:      { label: 'Closed',      className: 'bg-error/10 text-error border border-error/20',             dot: 'bg-error' },
  draft:       { label: 'Draft',       className: 'bg-outline/10 text-outline border border-outline/20',        dot: 'bg-outline' },
  paused:      { label: 'Paused',      className: 'bg-tertiary/10 text-tertiary border border-tertiary/20',    dot: 'bg-tertiary' },
  completed:   { label: 'Completed',   className: 'bg-secondary/10 text-secondary border border-secondary/20', dot: 'bg-secondary' },
  processing:  { label: 'Processing',  className: 'bg-tertiary/10 text-tertiary border border-tertiary/20',    dot: 'bg-tertiary animate-pulse' },
  pending:     { label: 'Pending',     className: 'bg-outline/10 text-outline border border-outline/20',        dot: 'bg-outline' },
  failed:      { label: 'Failed',      className: 'bg-error/10 text-error border border-error/20',             dot: 'bg-error' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-outline/10 text-outline border border-outline/20', dot: 'bg-outline' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

// ─── GlassCard ─────────────────────────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function GlassCard({ children, className = '', onClick, hover = true }: GlassCardProps) {
  return (
    <div
      className={`glass-card rounded-2xl ${hover ? 'hover:border-primary/30 hover:shadow-glow-primary' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ─── StatCard ──────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  icon: string
  iconColor?: string
  trend?: string
  trendUp?: boolean
  badge?: string
  sub?: string
}

export function StatCard({ label, value, icon, iconColor = 'text-primary', trend, trendUp, badge, sub }: StatCardProps) {
  return (
    <GlassCard className="p-6 relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor} bg-current/10`}
          style={{ background: 'rgba(192,193,255,0.1)' }}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        {trend && (
          <span className={`text-label-sm flex items-center gap-1 ${trendUp !== false ? 'text-secondary' : 'text-error'}`}>
            <span className="material-symbols-outlined text-xs">{trendUp !== false ? 'trending_up' : 'trending_down'}</span>
            {trend}
          </span>
        )}
        {badge && (
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-[10px] text-primary uppercase font-bold tracking-widest ai-glow">
            {badge}
          </span>
        )}
      </div>
      <p className="text-label-md text-on-surface-variant mb-1">{label}</p>
      <p className="text-display-lg-mobile font-bold text-on-surface">{value}</p>
      {sub && <p className="text-label-sm text-secondary mt-2 flex items-center gap-1">
        <span className="material-symbols-outlined text-xs">check_circle</span>{sub}
      </p>}
      {/* decorative bg icon */}
      <div className="absolute -right-4 -bottom-4 opacity-5">
        <span className="material-symbols-outlined text-[80px]">{icon}</span>
      </div>
    </GlassCard>
  )
}

// ─── LoadingSpinner ────────────────────────────────────────────────────────
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8'
  return (
    <div className={`${s} border-2 border-outline-variant border-t-primary rounded-full animate-spin`} />
  )
}

// ─── PageLoader ────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-label-md text-on-surface-variant">Loading...</p>
      </div>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action }: {
  icon?: string; title: string; subtitle?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[32px] text-on-surface-variant">{icon}</span>
        </div>
      )}
      <h3 className="text-headline-sm text-on-surface mb-2">{title}</h3>
      {subtitle && <p className="text-body-md text-on-surface-variant max-w-sm mb-6">{subtitle}</p>}
      {action}
    </div>
  )
}

// ─── AIInsightBox ─────────────────────────────────────────────────────────
export function AIInsightBox({ text }: { text: string }) {
  return (
    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
      <p className="text-label-sm text-primary mb-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">auto_awesome</span>
        AI INSIGHT
      </p>
      <p className="text-xs text-on-surface-variant leading-relaxed">{text}</p>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────
export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null
  const items = Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1)
  return (
    <div className="flex gap-2">
      <button disabled={page === 1} onClick={() => onPage(page - 1)}
        className="px-3 py-1 border border-outline rounded-lg hover:bg-surface-variant disabled:opacity-40 transition-all text-label-sm">
        Previous
      </button>
      {items.map((p) => (
        <button key={p} onClick={() => onPage(p)}
          className={`px-3 py-1 rounded-lg text-label-sm ${p === page ? 'bg-primary text-on-primary' : 'border border-outline hover:bg-surface-variant'}`}>
          {p}
        </button>
      ))}
      <button disabled={page >= pages} onClick={() => onPage(page + 1)}
        className="px-3 py-1 border border-outline rounded-lg hover:bg-surface-variant disabled:opacity-40 transition-all text-label-sm">
        Next
      </button>
    </div>
  )
}
