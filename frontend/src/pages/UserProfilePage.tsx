import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/client'
import { GlassCard } from '@/components/ui'
import toast from 'react-hot-toast'

export default function UserProfilePage() {
  const { user, updateUser } = useAuthStore()
  const qc = useQueryClient()

  const [profile, setProfile] = useState({ name: user?.name || '', department: user?.department || '', title: user?.title || '' })
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, new: false })

  const profileMut = useMutation({
    mutationFn: () => authApi.updateProfile(profile),
    onSuccess: ({ data }) => {
      updateUser(data.data.user)
      qc.invalidateQueries({ queryKey: ['auth-me'] })
      toast.success('Profile updated!')
    },
  })

  const pwMut = useMutation({
    mutationFn: () => authApi.changePassword(pw.current, pw.newPw),
    onSuccess: () => { toast.success('Password changed! Please log in again.'); setPw({ current: '', newPw: '', confirm: '' }) },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to change password'),
  })

  const setP = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setProfile(f => ({ ...f, [k]: e.target.value }))

  const ROLE_COLORS = { admin: 'bg-error/10 text-error border-error/30', recruiter: 'bg-primary/10 text-primary border-primary/30', viewer: 'bg-outline/10 text-outline border-outline/30' }

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-display-lg-mobile font-bold tracking-tight">Account Settings</h2>
        <p className="text-body-md text-on-surface-variant mt-1">Manage your profile and security preferences.</p>
      </div>

      {/* Profile Header */}
      <GlassCard className="p-8 mb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-3xl font-black ring-4 ring-primary/20">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-secondary rounded-full flex items-center justify-center border-2 border-surface">
              <span className="material-symbols-outlined text-[14px] text-on-secondary">edit</span>
            </div>
          </div>
          <div>
            <h3 className="text-headline-md font-bold">{user?.name}</h3>
            <p className="text-body-md text-on-surface-variant">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-label-sm border font-bold capitalize ${ROLE_COLORS[user?.role || 'recruiter']}`}>
                {user?.role}
              </span>
              <span className="text-on-surface-variant text-label-sm">{user?.department}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Profile Form */}
      <GlassCard className="p-6 mb-6">
        <h3 className="text-headline-sm font-bold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">person</span> Personal Information
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); profileMut.mutate() }} className="space-y-4">
          <div>
            <label className="text-label-md text-on-surface-variant mb-1.5 block">Full Name</label>
            <input value={profile.name} onChange={setP('name')} required
              className="w-full px-4 py-3 rounded-xl text-body-md" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Department</label>
              <input value={profile.department} onChange={setP('department')}
                className="w-full px-4 py-3 rounded-xl text-body-md" />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Title</label>
              <input value={profile.title} onChange={setP('title')}
                className="w-full px-4 py-3 rounded-xl text-body-md" />
            </div>
          </div>
          <div>
            <label className="text-label-md text-on-surface-variant mb-1.5 block">Email address</label>
            <input value={user?.email} disabled className="w-full px-4 py-3 rounded-xl text-body-md opacity-50" />
            <p className="text-xs text-on-surface-variant mt-1">Contact an admin to change your email.</p>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={profileMut.isPending}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-label-md font-bold hover:shadow-glow-primary btn-press disabled:opacity-50 flex items-center gap-2">
              {profileMut.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* Change Password */}
      <GlassCard className="p-6 mb-6">
        <h3 className="text-headline-sm font-bold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">lock</span> Security
        </h3>
        <form onSubmit={(e) => {
          e.preventDefault()
          if (pw.newPw !== pw.confirm) { toast.error('Passwords do not match'); return }
          pwMut.mutate()
        }} className="space-y-4">
          <div>
            <label className="text-label-md text-on-surface-variant mb-1.5 block">Current Password</label>
            <div className="relative">
              <input type={showPw.current ? 'text' : 'password'} value={pw.current} required onChange={(e) => setPw(f => ({ ...f, current: e.target.value }))}
                className="w-full px-4 py-3 pr-12 rounded-xl text-body-md" />
              <button type="button" onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">{showPw.current ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
          <div>
            <label className="text-label-md text-on-surface-variant mb-1.5 block">New Password</label>
            <div className="relative">
              <input type={showPw.new ? 'text' : 'password'} value={pw.newPw} required minLength={8} onChange={(e) => setPw(f => ({ ...f, newPw: e.target.value }))}
                className="w-full px-4 py-3 pr-12 rounded-xl text-body-md" />
              <button type="button" onClick={() => setShowPw(s => ({ ...s, new: !s.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">{showPw.new ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
          <div>
            <label className="text-label-md text-on-surface-variant mb-1.5 block">Confirm New Password</label>
            <input type="password" value={pw.confirm} required onChange={(e) => setPw(f => ({ ...f, confirm: e.target.value }))}
              className={`w-full px-4 py-3 rounded-xl text-body-md ${pw.confirm && pw.confirm !== pw.newPw ? 'border-error' : ''}`} />
            {pw.confirm && pw.confirm !== pw.newPw && (
              <p className="text-error text-xs mt-1">Passwords do not match</p>
            )}
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={pwMut.isPending || pw.newPw !== pw.confirm}
              className="px-6 py-2.5 bg-secondary text-on-secondary rounded-xl text-label-md font-bold btn-press disabled:opacity-50">
              {pwMut.isPending ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* Account Info */}
      <GlassCard className="p-6">
        <h3 className="text-headline-sm font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant">info</span> Account Information
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Account ID', value: user?.id || '–' },
            { label: 'Role', value: user?.role || '–' },
            { label: 'Status', value: user?.isActive ? 'Active' : 'Inactive' },
            { label: 'Last Login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First session' },
            { label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '–' },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center py-2 border-b border-outline-variant/30 last:border-0">
              <span className="text-label-md text-on-surface-variant">{item.label}</span>
              <span className="text-label-md text-on-surface font-medium font-mono text-right max-w-xs truncate">{item.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
