import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from '../App'

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function timeSince(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

// ─── Slot Card ────────────────────────────────────────────────────────────────
function SlotCard({ slot, onAccept }) {
  const [accepting, setAccepting] = useState('')
  const [copied, setCopied] = useState(false)
  const accepted = !!slot.meetingLink

  const handleAccept = async (time) => {
    setAccepting(time)
    try {
      await onAccept(slot.id, time)
    } finally {
      setAccepting('')
    }
  }

  const copyLink = async () => {
    if (!slot.startUrl) return
    await navigator.clipboard.writeText(slot.startUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
      accepted
        ? 'bg-emerald-950/20 border-emerald-500/20 shadow-lg shadow-emerald-500/5'
        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
    }`}>
      {/* Card header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
            {slot.studentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-white font-semibold">{slot.studentName}</h3>
            <p className="text-slate-500 text-xs">{timeSince(slot.createdAt)} · {slot.times.length} time options</p>
          </div>
        </div>
        <div>
          {accepted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Confirmed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" /> Pending
            </span>
          )}
        </div>
      </div>

      {/* Time slots section */}
      <div className="px-5 pb-5">
        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-3">
          {accepted ? 'Session Confirmed For' : 'Student is Available At'}
        </p>

        <div className="space-y-2">
          {slot.times.map((time, i) => {
            const isSelected = slot.selectedTime === time
            const isAccepting = accepting === time
            return (
              <div
                key={i}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 transition-all ${
                  isSelected
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-base flex-shrink-0">{isSelected ? '✅' : '📅'}</span>
                  <span className={`text-sm truncate ${isSelected ? 'text-emerald-300 font-medium' : 'text-slate-300'}`}>
                    {formatDateTime(time)}
                  </span>
                </div>

                {!accepted ? (
                  <button
                    onClick={() => handleAccept(time)}
                    disabled={!!accepting}
                    className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    {isAccepting ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Creating…
                      </span>
                    ) : 'Accept'}
                  </button>
                ) : isSelected ? (
                  <span className="text-xs text-emerald-400 font-medium flex-shrink-0">Selected</span>
                ) : (
                  <span className="text-xs text-slate-600 flex-shrink-0">—</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Meeting info after acceptance */}
        {accepted && (
          <div className="mt-4 space-y-3">
            {/* Host explanation */}
            <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl px-4 py-3 text-xs leading-relaxed">
              <p className="font-semibold text-purple-400 mb-1">👑 You are the HOST</p>
              <p className="text-slate-400">
                You hold the <strong className="text-slate-300">host link</strong> (start_url). Click <strong className="text-slate-300">Start Meeting</strong> below to open Zoom as host. The student will join instantly via their own join link — <strong className="text-slate-300">no waiting room</strong>.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-3">🎥 Your Zoom Session</p>
              <div className="space-y-3">
                {/* Start meeting button */}
                <a
                  href={slot.startUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm font-semibold py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:-translate-y-0.5"
                >
                  <span>👑</span> Start Meeting as Host
                </a>

                {/* Copy host link */}
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-sm py-2.5 rounded-xl transition-all border border-slate-600"
                >
                  <span>{copied ? '✅' : '📋'}</span>
                  {copied ? 'Copied!' : 'Copy My Host Link'}
                </button>

                <p className="text-slate-500 text-xs text-center">
                  Student has their own join link and will enter when you start
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
      <div className="text-5xl mb-4">📭</div>
      <h3 className="text-white font-semibold text-lg mb-2">No Requests Yet</h3>
      <p className="text-slate-500 text-sm">
        Waiting for students to submit their availability.
        <br />Ask a student to visit the <strong className="text-slate-400">/student</strong> page.
      </p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CounselorPage() {
  const { user } = useAuth()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(null)
  const [toast, setToast] = useState(null)

  const fetchSlots = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const { data } = await axios.get('/slots')
      setSlots(data)
      setLastRefresh(new Date())
    } catch {
      if (!silent) setError('Could not reach the backend. Is the server running on port 5000?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSlots()
    const id = setInterval(() => fetchSlots(true), 8000)
    return () => clearInterval(id)
  }, [fetchSlots])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleAccept = async (slotId, selectedTime) => {
    try {
      await axios.post('/accept', { slotId, selectedTime })
      await fetchSlots(true)
      showToast('🎉 Zoom meeting created successfully!', 'success')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create meeting.', 'error')
    }
  }

  const pending = slots.filter(s => !s.meetingLink)
  const confirmed = slots.filter(s => s.meetingLink)

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-950 py-10 px-4 relative">
      {/* Ambient glow */}
      <div className="fixed top-20 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-xl transition-all animate-in slide-in-from-right ${
          toast.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
            : 'bg-red-950/90 border-red-500/30 text-red-300'
        }`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <p className="text-sm font-medium">{toast.msg}</p>
        </div>
      )}

      <div className="max-w-3xl mx-auto relative">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${user?.color || 'from-purple-500 to-pink-500'} flex items-center justify-center text-white font-bold shadow-lg`}>
              {user?.avatar || '★'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user?.name || 'Counselor'}</h1>
              <p className="text-slate-500 text-sm">
                {user?.specialty && <span className="text-purple-400">{user.specialty} · </span>}
                {lastRefresh ? `Last synced ${timeSince(lastRefresh.toISOString())}` : 'Loading…'}
              </p>
            </div>
          </div>

          {/* Stats + Refresh */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold">
                {pending.length} Pending
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
                {confirmed.length} Done
              </span>
            </div>
            <button
              onClick={() => fetchSlots()}
              disabled={loading}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              title="Refresh"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 text-red-400 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && slots.length === 0 && (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-800 rounded" />
                    <div className="h-3 w-24 bg-slate-800 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map(j => <div key={j} className="h-11 bg-slate-800 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && slots.length === 0 && <EmptyState />}

        {/* Pending section */}
        {pending.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
                Pending Requests ({pending.length})
              </h2>
            </div>
            <div className="space-y-4">
              {pending.map(slot => (
                <SlotCard key={slot.id} slot={slot} onAccept={handleAccept} />
              ))}
            </div>
          </div>
        )}

        {/* Confirmed section */}
        {confirmed.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
                Confirmed Sessions ({confirmed.length})
              </h2>
            </div>
            <div className="space-y-4">
              {confirmed.map(slot => (
                <SlotCard key={slot.id} slot={slot} onAccept={handleAccept} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

