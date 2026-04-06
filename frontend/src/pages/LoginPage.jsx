import { useState } from 'react'
import { USERS, findUser, storeUser } from '../auth'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400)) // tiny UX delay

    const user = findUser(username.trim(), password)
    if (!user) {
      setError('Invalid username or password.')
      setLoading(false)
      return
    }
    storeUser(user)
    onLogin(user)
    setLoading(false)
  }

  const quickLogin = (u) => {
    setUsername(u.username)
    setPassword(u.password)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/3 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl shadow-blue-500/30 mb-4">
            <span className="text-3xl">📅</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">CounselConnect</h1>
          <p className="text-slate-400">Sign in to access your dashboard</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Login Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleLogin}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl"
            >
              <h2 className="text-white font-bold text-lg mb-5">Sign In</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Username</label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. alex.student"
                  autoComplete="username"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm"
                  >
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in…
                  </>
                ) : '🔐 Sign In'}
              </button>
            </form>
          </div>

          {/* Quick-login credential cards */}
          <div className="lg:col-span-3 space-y-4">
            {/* Students */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🎓</span>
                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
                  Student Accounts
                </h3>
                <span className="text-slate-600 text-xs ml-auto">password: pass123</span>
              </div>
              <div className="space-y-2">
                {USERS.students.map(u => (
                  <button
                    key={u.username}
                    onClick={() => quickLogin(u)}
                    className="w-full flex items-center gap-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-left transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${u.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {u.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{u.name}</p>
                      <p className="text-slate-500 text-xs">{u.username}</p>
                    </div>
                    <span className="text-slate-600 group-hover:text-slate-400 text-xs transition-colors flex-shrink-0">
                      Click to fill →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Counselors */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🧑‍💼</span>
                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
                  Counselor Accounts
                </h3>
                <span className="text-slate-600 text-xs ml-auto">password: counsel123</span>
              </div>
              <div className="space-y-2">
                {USERS.counselors.map(u => (
                  <button
                    key={u.username}
                    onClick={() => quickLogin(u)}
                    className="w-full flex items-center gap-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-left transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${u.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {u.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{u.name}</p>
                      <p className="text-slate-500 text-xs">{u.username} · {u.specialty}</p>
                    </div>
                    <span className="text-slate-600 group-hover:text-slate-400 text-xs transition-colors flex-shrink-0">
                      Click to fill →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
