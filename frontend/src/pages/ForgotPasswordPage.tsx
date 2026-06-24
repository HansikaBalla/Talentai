import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi } from '@/api/client'
import { LoadingSpinner } from '@/components/ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const mut = useMutation({
    mutationFn: () => authApi.forgotPassword(email),
    onSuccess: () => { setSent(true); toast.success('Reset link sent!') },
    onError: () => { setSent(true) }, // Always show success (security)
  })

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <Link to="/" className="text-headline-md font-black text-primary">TalentAI</Link>
        </div>
        <div className="glass-card rounded-3xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px] text-secondary">mark_email_read</span>
              </div>
              <h2 className="text-headline-md font-bold mb-3">Check your inbox</h2>
              <p className="text-body-md text-on-surface-variant mb-6">
                If <span className="text-primary">{email}</span> is registered, you'll receive a reset link shortly.
              </p>
              <Link to="/login" className="text-primary font-bold hover:underline text-label-md">← Back to Sign In</Link>
            </div>
          ) : (
            <>
              <h1 className="text-headline-md font-bold mb-2">Forgot password?</h1>
              <p className="text-body-md text-on-surface-variant mb-8">Enter your email and we'll send a reset link.</p>
              <form onSubmit={(e) => { e.preventDefault(); mut.mutate() }} className="space-y-5">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com" required
                  className="w-full px-4 py-3 rounded-xl text-body-md" />
                <button type="submit" disabled={mut.isPending}
                  className="w-full bg-primary text-on-primary py-3.5 rounded-xl text-label-md font-bold hover:shadow-glow-primary btn-press disabled:opacity-50 flex items-center justify-center gap-2">
                  {mut.isPending ? <><LoadingSpinner size="sm" />Sending...</> : 'Send Reset Link'}
                </button>
              </form>
              <p className="text-center mt-6">
                <Link to="/login" className="text-label-md text-primary hover:underline">← Back to Sign In</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
