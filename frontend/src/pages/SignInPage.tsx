import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/components/ui'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const loginMut = useMutation({
    mutationFn: () => authApi.login(email, password),
    onSuccess: ({ data }) => {
      login(data.data.user, data.data.accessToken, data.data.refreshToken)
      toast.success(`Welcome back, ${data.data.user.name}!`)
      navigate('/dashboard')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    },
  })

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background glows */}
      <div className="fixed top-0 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-[150px]" />
      <div className="fixed bottom-0 -right-32 w-96 h-96 bg-secondary/8 rounded-full blur-[150px]" />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="text-headline-md font-black text-primary tracking-tight">TalentAI</Link>
          <p className="text-label-sm text-on-surface-variant mt-1 uppercase tracking-widest">HR Copilot</p>
        </div>

        <div className="glass-card rounded-3xl p-8">
          <h1 className="text-headline-md font-bold text-on-surface mb-2">Welcome back</h1>
          <p className="text-body-md text-on-surface-variant mb-8">Sign in to your TalentAI account</p>

          <form onSubmit={(e) => { e.preventDefault(); loginMut.mutate() }} className="space-y-5">
            <div>
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Email address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">mail</span>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com" required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-body-md"
                />
              </div>
            </div>

            <div>
              <label className="text-label-md text-on-surface-variant mb-1.5 block">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">lock</span>
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-body-md"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-label-sm text-primary hover:underline">Forgot password?</Link>
            </div>

            <button
              type="submit" disabled={loginMut.isPending}
              className="w-full bg-primary text-on-primary py-3.5 rounded-xl text-label-md font-bold hover:shadow-glow-primary transition-all btn-press disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loginMut.isPending ? <><LoadingSpinner size="sm" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-label-sm text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">info</span>
              Demo Credentials
            </p>
            <div className="space-y-1 text-[11px] text-on-surface-variant">
              <p>Admin: <span className="text-primary font-mono">admin@talentai.com</span> / <span className="text-primary font-mono">Admin@12345</span></p>
              <p>Recruiter: <span className="text-primary font-mono">recruiter@talentai.com</span> / <span className="text-primary font-mono">Recruiter@12345</span></p>
            </div>
          </div>

          <p className="text-center text-label-md text-on-surface-variant mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
