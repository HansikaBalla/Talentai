import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/client'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/dashboard',  icon: 'dashboard',  label: 'Dashboard' },
  { to: '/jobs',       icon: 'work',        label: 'Jobs' },
  { to: '/candidates', icon: 'groups',      label: 'Candidates', matchStart: '/candidates' },
  { to: '/upload',     icon: 'upload_file', label: 'Resume Upload' },
  { to: '/analytics',  icon: 'analytics',   label: 'Analytics' },
]

const ADMIN_ITEMS = [
  { to: '/admin',   icon: 'admin_panel_settings', label: 'Admin Panel' },
  { to: '/profile', icon: 'manage_accounts',       label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout, refreshToken } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authApi.logout(refreshToken || undefined)
    } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="mb-8 px-2">
        <h1 className="text-headline-md font-bold text-primary tracking-tight">TalentAI</h1>
        <p className="text-label-sm text-on-surface-variant opacity-70 mt-0.5">HR Copilot</p>
      </div>

      {/* Post Job CTA */}
      <NavLink
        to="/jobs/create"
        className="mb-6 w-full bg-primary text-on-primary py-3 px-4 rounded-xl font-bold text-label-md flex items-center justify-center gap-2 hover:shadow-glow-primary transition-all btn-press"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Post New Job
      </NavLink>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-label-md transition-all duration-200 ${
                isActive
                  ? 'bg-primary-container/20 text-primary border-r-2 border-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto pt-4 border-t border-outline-variant space-y-1">
        {user?.role === 'admin' && ADMIN_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-label-sm transition-colors ${
                isActive ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
            {label}
          </NavLink>
        ))}

        {user?.role !== 'admin' && (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-label-sm transition-colors ${
                isActive ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
            Settings
          </NavLink>
        )}

        <NavLink
          to="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">help</span>
          Support
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-label-sm text-on-surface-variant hover:text-error transition-colors text-left"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Logout
        </button>

        {/* User avatar footer */}
        <div className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl bg-surface-container">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-label-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-label-md text-on-surface truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider truncate">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
