import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/client'

export default function TopBar() {
  const user = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const { data: overview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsApi.overview().then((r) => r.data.data.overview),
    staleTime: 1000 * 60 * 5,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) navigate(`/jobs?search=${encodeURIComponent(search)}`)
  }

  return (
    <header className="fixed top-0 right-0 left-64 h-16 flex justify-between items-center px-8 z-40 glass-nav border-b border-outline-variant">
      {/* Left: Search + nav */}
      <div className="flex items-center gap-8">
        <form onSubmit={handleSearch} className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search talent pool..."
            className="bg-surface-container-high border-none rounded-full pl-10 pr-4 py-1.5 w-60 focus:ring-2 focus:ring-primary/20 text-label-md placeholder-on-surface-variant/50"
          />
        </form>

        <nav className="hidden md:flex gap-6">
          <button onClick={() => navigate('/jobs')} className="text-on-surface-variant text-label-md hover:text-primary transition-colors">
            Talent Pool
          </button>
          <button onClick={() => navigate('/jobs')} className="text-on-surface-variant text-label-md hover:text-primary transition-colors">
            Pipelines
          </button>
          <button onClick={() => navigate('/analytics')} className="text-on-surface-variant text-label-md hover:text-primary transition-colors">
            Reports
          </button>
        </nav>
      </div>

      {/* Right: Actions + user */}
      <div className="flex items-center gap-4">
        {/* AI Status chip */}
        {overview && (
          <div className="hidden lg:flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-full px-3 py-1">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            <span className="text-secondary text-[11px] font-bold">{overview.totalCandidates} candidates</span>
          </div>
        )}

        <button
          onClick={() => navigate('/upload')}
          className="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-label-sm hover:opacity-90 transition-opacity btn-press"
        >
          Upload Resumes
        </button>

        <div className="flex gap-1">
          <button className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors relative">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
          </button>
        </div>

        {/* User avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-label-sm ring-2 ring-outline-variant hover:ring-primary transition-all"
        >
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </button>
      </div>
    </header>
  )
}
