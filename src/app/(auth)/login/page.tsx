'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Loader2, LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState<{ email?: string, password?: string }>({})

  const validate = () => {
    const errors: { email?: string, password?: string } = {}
    if (!email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        let errorMsg = 'Login failed'
        try {
          const data = await res.json()
          errorMsg = data.error || errorMsg
        } catch {
          // not json
        }
        throw new Error(errorMsg)
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
              <LogIn className="w-6 h-6 text-slate-950 ml-1" />
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
          <p className="text-slate-400 mt-2">Sign in to your secure workspace</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (validationErrors.email) setValidationErrors({ ...validationErrors, email: undefined })
                  }}
                  className={`w-full bg-slate-950/50 border ${validationErrors.email ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-800 focus:ring-blue-500 focus:border-blue-500'} text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-slate-600`}
                  placeholder="admin@acme.com"
                />
              </div>
              {validationErrors.email && (
                <p className="text-xs text-red-400 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (validationErrors.password) setValidationErrors({ ...validationErrors, password: undefined })
                  }}
                  className={`w-full bg-slate-950/50 border ${validationErrors.password ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-800 focus:ring-blue-500 focus:border-blue-500'} text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-slate-600`}
                  placeholder="••••••••"
                />
              </div>
              {validationErrors.password && (
                <p className="text-xs text-red-400 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{validationErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-slate-950 font-semibold rounded-xl py-3 px-4 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Need an account?{' '}
              <Link href="/register" className="text-white hover:underline font-medium transition-colors">
                Register your company
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
