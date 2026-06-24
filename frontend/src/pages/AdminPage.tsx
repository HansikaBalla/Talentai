import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/client'
import { GlassCard, StatCard, StatusBadge, PageLoader, EmptyState } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', recruiter: 'Recruiter', viewer: 'Viewer' }

export default function AdminPage() {
  const { user: currentUser } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: '', role: 'recruiter', department: '', title: '' })

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.platformStats().then(r => r.data.data),
  })

  const { data: recruiters, isLoading: loadingRecruiters } = useQuery({
    queryKey: ['admin-recruiters', search],
    queryFn: () => adminApi.recruiters({ search: search || undefined, limit: 50 }).then(r => r.data.data.users),
  })

  const createMut = useMutation({
    mutationFn: () => adminApi.createRecruiter(inviteForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-recruiters'] })
      toast.success('Team member added')
      setShowInvite(false)
      setInviteForm({ name: '', email: '', password: '', role: 'recruiter', department: '', title: '' })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add member'),
  })

  const updateRoleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.updateRecruiter(id, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-recruiters'] }); toast.success('Role updated') },
  })

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.updateRecruiter(id, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-recruiters'] }); toast.success('Status updated') },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteRecruiter(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-recruiters'] }); toast.success('User removed') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Cannot delete'),
  })

  if (loadingStats) return <PageLoader />

  return (
    <div className="px-8 py-8 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-display-lg-mobile font-bold tracking-tight">Admin Panel</h2>
          <p className="text-body-md text-on-surface-variant mt-1">Manage team members, roles, and platform settings.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-label-md font-bold hover:shadow-glow-primary transition-all btn-press"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add Team Member
        </button>
      </div>

      {/* Platform Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Users" value={stats?.users ?? '–'} icon="group" />
        <StatCard label="Active Jobs" value={stats?.jobs ?? '–'} icon="work" iconColor="text-secondary" />
        <StatCard label="Candidates" value={stats?.candidates ?? '–'} icon="person_search" iconColor="text-tertiary" />
        <StatCard label="Admin Accounts" value={stats?.roleBreakdown?.find((r: any) => r._id === 'admin')?.count ?? 0} icon="admin_panel_settings" iconColor="text-error" />
      </section>

      {/* Role Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <GlassCard className="p-6">
          <h3 className="text-headline-sm font-bold mb-4">Role Breakdown</h3>
          <div className="space-y-3">
            {stats?.roleBreakdown?.map((r: any) => (
              <div key={r._id} className="flex items-center gap-4 p-3 bg-surface-container rounded-xl">
                <div className={`w-2 h-2 rounded-full ${r._id === 'admin' ? 'bg-error' : r._id === 'recruiter' ? 'bg-primary' : 'bg-outline'}`} />
                <span className="text-label-md capitalize flex-1">{r._id}</span>
                <span className="text-headline-sm font-bold">{r.count}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-headline-sm font-bold mb-4">Job Status Overview</h3>
          <div className="space-y-3">
            {stats?.jobsByStatus?.map((j: any) => (
              <div key={j._id} className="flex items-center gap-4 p-3 bg-surface-container rounded-xl">
                <StatusBadge status={j._id} />
                <span className="flex-1" />
                <span className="text-headline-sm font-bold">{j.count}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Team Members */}
      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex items-center justify-between gap-4">
          <h3 className="text-headline-sm font-bold">Team Members</h3>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="pl-9 pr-4 py-2 rounded-xl text-label-md bg-surface-container border-none w-48" />
          </div>
        </div>

        {loadingRecruiters ? (
          <div className="p-8 flex justify-center"><div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" /></div>
        ) : !recruiters?.length ? (
          <EmptyState icon="group" title="No team members" subtitle="Add your first recruiter to get started" />
        ) : (
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-label-sm uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {recruiters.map((u: any) => (
                <tr key={u._id} className="hover:bg-surface-variant/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ring-2 ${u._id === currentUser?.id ? 'bg-primary text-on-primary ring-primary/30' : 'bg-primary-container text-on-primary-container ring-primary/20'}`}>
                        {u.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{u.name} {u._id === currentUser?.id && <span className="text-[10px] text-primary ml-1 font-bold">(you)</span>}</p>
                        <p className="text-xs text-on-surface-variant">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-label-md text-on-surface-variant">{u.department}</td>
                  <td className="px-6 py-4">
                    <select value={u.role}
                      onChange={(e) => updateRoleMut.mutate({ id: u._id, role: e.target.value })}
                      disabled={u._id === currentUser?.id}
                      className="bg-surface-container-high border border-outline-variant rounded-lg px-3 py-1.5 text-label-sm text-on-surface disabled:opacity-50">
                      <option value="admin">Admin</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActiveMut.mutate({ id: u._id, isActive: !u.isActive })}
                      disabled={u._id === currentUser?.id}
                      className={`px-3 py-1 rounded-full text-label-sm font-bold transition-colors disabled:opacity-50 ${u.isActive ? 'bg-secondary/10 text-secondary hover:bg-secondary/20' : 'bg-error/10 text-error hover:bg-error/20'}`}>
                      {u.isActive ? '● Active' : '○ Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-label-sm text-on-surface-variant">
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => { if (confirm(`Remove ${u.name}?`)) deleteMut.mutate(u._id) }}
                      disabled={u._id === currentUser?.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all disabled:opacity-30">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowInvite(false)}>
          <div className="w-full max-w-md glass-panel rounded-3xl p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-headline-md font-bold">Add Team Member</h3>
              <button onClick={() => setShowInvite(false)} className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate() }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-full">
                  <label className="text-label-sm text-on-surface-variant mb-1 block">Full Name</label>
                  <input value={inviteForm.name} onChange={(e) => setInviteForm(f => ({ ...f, name: e.target.value }))} required placeholder="Jane Smith" className="w-full px-4 py-2.5 rounded-xl text-label-md" />
                </div>
                <div className="col-span-full">
                  <label className="text-label-sm text-on-surface-variant mb-1 block">Email</label>
                  <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm(f => ({ ...f, email: e.target.value }))} required placeholder="jane@company.com" className="w-full px-4 py-2.5 rounded-xl text-label-md" />
                </div>
                <div className="col-span-full">
                  <label className="text-label-sm text-on-surface-variant mb-1 block">Temp Password</label>
                  <input type="password" value={inviteForm.password} onChange={(e) => setInviteForm(f => ({ ...f, password: e.target.value }))} required minLength={8} placeholder="Min 8 characters" className="w-full px-4 py-2.5 rounded-xl text-label-md" />
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant mb-1 block">Role</label>
                  <select value={inviteForm.role} onChange={(e) => setInviteForm(f => ({ ...f, role: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl text-label-md">
                    <option value="recruiter">Recruiter</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant mb-1 block">Department</label>
                  <input value={inviteForm.department} onChange={(e) => setInviteForm(f => ({ ...f, department: e.target.value }))} placeholder="Engineering" className="w-full px-4 py-2.5 rounded-xl text-label-md" />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowInvite(false)} className="px-5 py-2 border border-outline rounded-xl text-label-md text-on-surface-variant hover:bg-surface-variant">Cancel</button>
                <button type="submit" disabled={createMut.isPending} className="px-6 py-2 bg-primary text-on-primary rounded-xl text-label-md font-bold disabled:opacity-50 btn-press">
                  {createMut.isPending ? 'Adding…' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
