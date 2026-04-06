import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import StudentPage from './pages/StudentPage'
import CounselorPage from './pages/CounselorPage'
import LoginPage from './pages/LoginPage'
import { getStoredUser, clearUser } from './auth'

// ─── Auth Context ────────────────────────────────────────────────────────────
export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// ─── Protected Route ─────────────────────────────────────────────────────────
function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'student' ? '/student' : '/counselor'} replace />
  }
  return children
}

// ─── Header ──────────────────────────────────────────────────────────────────
function Header() {
  const { user, logout } = useAuth()
  const location = useLocation()
  if (!user) return null

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white text-lg">📅</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-white font-bold text-base leading-none">CounselConnect</h1>
            <p className="text-slate-500 text-xs mt-0.5">Zoom-Powered Scheduling</p>
          </div>
        </Link>

        {/* Nav tabs (role-based) */}
        <nav className="flex items-center gap-1">
          {user.role === 'student' && (
            <Link
              to="/student"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                location.pathname === '/student'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              🎓 My Dashboard
            </Link>
          )}
          {user.role === 'counselor' && (
            <Link
              to="/counselor"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                location.pathname === '/counselor'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              🧑‍💼 My Dashboard
            </Link>
          )}
        </nav>

        {/* User info + Logout */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-xs font-bold`}>
              {user.avatar}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-white text-sm font-medium leading-none">{user.name}</p>
              <p className="text-slate-500 text-xs mt-0.5 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            id="logout-btn"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-all border border-slate-700 hover:border-slate-600"
          >
            <span>⎋</span>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  )
}

// ─── Home redirect ────────────────────────────────────────────────────────────
function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'student' ? '/student' : '/counselor'} replace />
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => getStoredUser())

  const login = (u) => setUser(u)
  const logout = () => {
    clearUser()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="min-h-screen bg-slate-950">
        <Header />
        <main>
          <Routes>
            <Route path="/login" element={user ? <HomeRedirect /> : <LoginPage onLogin={login} />} />
            <Route path="/" element={<HomeRedirect />} />
            <Route
              path="/student"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/counselor"
              element={
                <ProtectedRoute requiredRole="counselor">
                  <CounselorPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  )
}
