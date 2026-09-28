import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Home() {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth_token')

  if (authToken) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      <div className="relative z-10 text-center max-w-3xl mx-auto space-y-8">
        <div className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1 text-sm font-medium text-slate-300 backdrop-blur-3xl">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
          Multi-Tenant SaaS Platform
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
          Scale your business with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            confidence
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
          Secure, isolated, and highly performant architecture. Built for scale, designed for simplicity.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link 
            href="/register" 
            className="w-full sm:w-auto px-8 py-4 rounded-lg bg-white text-slate-950 font-semibold hover:bg-slate-200 transition-colors shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
          >
            Get Started
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto px-8 py-4 rounded-lg bg-slate-900 text-white font-semibold border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  )
}
