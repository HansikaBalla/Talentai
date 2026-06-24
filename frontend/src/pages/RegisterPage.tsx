import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/components/ui'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', title: '' })
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const registerMut = useMutation({
    mutationFn: () => authApi.register(form),
    onSuccess: ({ data }) => {
      login(data.data.user, data.data.accessToken, data.data.refreshToken)
      toast.success(`Welcome to TalentAI, ${data.data.user.name}!`)
      navigate('/dashboard')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Registration failed')
    },
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="fixed top-0 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-[150px]" />
      <div className="fixed bottom-0 -right-32 w-96 h-96 bg-secondary/8 rounded-full blur-[150px]" />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <Link to="/" className="text-headline-md font-black text-primary tracking-tight">TalentAI</Link>
          <p className="text-label-sm text-on-surface-variant mt-1 uppercase tracking-widest">HR Copilot</p>
        </div>

        <div className="glass-card rounded-3xl p-8">
          <h1 className="text-headline-md font-bold mb-2">Create your account</h1>
          <p className="text-body-md text-on-surface-variant mb-8">Start screening candidates with AI today</p>

          <form onSubmit={(e) => { e.preventDefault(); registerMut.mutate() }} className="space-y-4">
            <div>
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Full Name</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Sarah Mitchell" required
                className="w-full px-4 py-3 rounded-xl text-body-md" />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Work Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="sarah@company.com" required
                className="w-full px-4 py-3 rounded-xl text-body-md" />
            </div>
            <div>
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters" required minLength={8}
                className="w-full px-4 py-3 rounded-xl text-body-md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-md text-on-surface-variant mb-1.5 block">Department</label>
                <input type="text" value={form.department} onChange={set('department')} placeholder="Engineering"
                  className="w-full px-4 py-3 rounded-xl text-body-md" />
              </div>
              <div>
                <label className="text-label-md text-on-surface-variant mb-1.5 block">Title</label>
                <input type="text" value={form.title} onChange={set('title')} placeholder="Recruiter"
                  className="w-full px-4 py-3 rounded-xl text-body-md" />
              </div>
            </div>

            <button type="submit" disabled={registerMut.isPending}
              className="w-full bg-primary text-on-primary py-3.5 rounded-xl text-label-md font-bold hover:shadow-glow-primary transition-all btn-press disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {registerMut.isPending ? <><LoadingSpinner size="sm" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-label-md text-on-surface-variant mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
