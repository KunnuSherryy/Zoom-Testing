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

function getMinDateTime() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

// ─── Meeting Card ─────────────────────────────────────────────────────────────
function MeetingCard({ slot }) {
  const accepted = !!slot.meetingLink
  const meetingTime = slot.selectedTime ? new Date(slot.selectedTime) : null
  const canJoin = accepted && meetingTime && new Date() >= new Date(meetingTime.getTime() - 5 * 60_000)

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-300 ${
      accepted
        ? 'bg-emerald-950/20 border-emerald-500/20 shadow-lg shadow-emerald-500/5'
        : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h3 className="text-white font-semibold">Your Session Request</h3>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">#{slot.id.slice(0, 8)}</p>
        </div>
        {accepted ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Meeting Confirmed ✅
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 bg-amber-400 animate-pulse rounded-full" /> Awaiting Counselor
          </span>
        )}
      </div>

      {/* Times You Offered */}
      <div className="mb-4">
        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-2">Your Offered Times</p>
        <ul className="space-y-1.5">
          {slot.times.map((t, i) => (
            <li key={i} className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 ${
              slot.selectedTime === t
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-slate-800/60 text-slate-300'
            }`}>
              <span className="flex-shrink-0">{slot.selectedTime === t ? '✅' : '🕐'}</span>
              {formatDateTime(t)}
              {slot.selectedTime === t && (
                <span className="ml-auto text-xs font-semibold text-emerald-400">Counselor picked this</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* ACCEPTED STATE */}
      {accepted && (
        <div className="mt-3 bg-slate-800/60 rounded-xl p-4 border border-slate-700 space-y-4">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">🗓 Confirmed Time</p>
            <p className="text-white font-semibold">{formatDateTime(slot.selectedTime)}</p>
          </div>

          {/* Zoom explanation */}
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl px-4 py-3 text-xs text-slate-400 leading-relaxed">
            <p className="font-semibold text-blue-400 mb-1">ℹ️ How the meeting works</p>
            <p>Your counselor will <strong className="text-slate-300">start the session</strong> as the host. You simply click <strong className="text-slate-300">Join Meeting</strong> below. There is <strong className="text-slate-300">no waiting room</strong> — you'll be in the call instantly once the host starts it.</p>
          </div>

          {/* Join button */}
          <a
            href={slot.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
              canJoin
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
            onClick={e => !canJoin && e.preventDefault()}
          >
            {canJoin ? (
              <><span>🚀</span> Join Meeting Now</>
            ) : (
              <><span>⏳</span> Join Opens 5 min Before Session</>
            )}
          </a>

          {!canJoin && (
            <p className="text-slate-500 text-xs text-center">
              Meeting is scheduled for <span className="text-slate-400 font-medium">{formatDateTime(slot.selectedTime)}</span>
            </p>
          )}
        </div>
      )}

      {/* PENDING STATE */}
      {!accepted && (
        <div className="mt-3 flex items-center gap-3 bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-3">
          <div className="flex items-center gap-1 flex-shrink-0">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-amber-400/80 text-sm">Your counselor will pick a time soon. This page auto-refreshes every 5 seconds.</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentPage() {
  const { user } = useAuth()

  // Persist slot ID across refreshes using localStorage
  const [slotId, setSlotId] = useState(() => localStorage.getItem('cc_slot_id'))
  const [liveSlot, setLiveSlot] = useState(null)
  const [times, setTimes] = useState(['', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Check if student already has a pending/accepted slot on this account
  const [checking, setChecking] = useState(true)

  // On mount: check if there's already a slot for this student
  useEffect(() => {
    const savedId = localStorage.getItem('cc_slot_id')
    if (savedId) {
      axios.get(`/slots/${savedId}`)
        .then(({ data }) => setLiveSlot(data))
        .catch(() => {
          // Slot was cleared (server restarted), clear local storage
          localStorage.removeItem('cc_slot_id')
          setSlotId(null)
        })
        .finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [])

  // Poll for updates every 5 seconds once we have a slotId
  const pollSlot = useCallback(async () => {
    const id = localStorage.getItem('cc_slot_id')
    if (!id) return
    try {
      const { data } = await axios.get(`/slots/${id}`)
      setLiveSlot(data)
    } catch {
      // Server restarted or slot deleted
      localStorage.removeItem('cc_slot_id')
      setSlotId(null)
      setLiveSlot(null)
    }
  }, [])

  useEffect(() => {
    if (!slotId) return
    const id = setInterval(pollSlot, 5000)
    return () => clearInterval(id)
  }, [slotId, pollSlot])

  const updateTime = (index, value) =>
    setTimes(prev => prev.map((t, i) => i === index ? value : t))

  const addTimeSlot = () => {
    if (times.length < 4) setTimes(prev => [...prev, ''])
  }

  const removeTimeSlot = (index) => {
    if (times.length <= 3) return
    setTimes(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const validTimes = times.filter(t => t.trim() !== '')
    if (validTimes.length < 3) return setError('Please select at least 3 time slots.')

    setSubmitting(true)
    try {
      const { data } = await axios.post('/slots', {
        studentName: user.name,
        times: validTimes,
      })
      const newSlot = data.slot
      localStorage.setItem('cc_slot_id', newSlot.id)
      setSlotId(newSlot.id)
      setLiveSlot(newSlot)
      setSuccess('Availability submitted! Your counselor will confirm a time shortly.')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit. Is the backend running?')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    localStorage.removeItem('cc_slot_id')
    setSlotId(null)
    setLiveSlot(null)
    setTimes(['', '', ''])
    setSuccess('')
    setError('')
  }

  if (checking) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-60px)] bg-slate-950 py-10 px-4">
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto relative">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
            {user.avatar}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome, {user.name.split(' ')[0]}!</h1>
            <p className="text-slate-500 text-sm">Scheduling as <span className="text-slate-400">{user.name}</span></p>
          </div>
        </div>

        {/* If no active slot → show form */}
        {!slotId && (
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">📋</span>
              <h2 className="text-white font-semibold text-lg">Request a Counseling Session</h2>
            </div>

            {/* Logged-in name (read-only) */}
            <div className="mb-5 flex items-center gap-3 bg-blue-500/5 border border-blue-500/10 rounded-xl px-4 py-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-xs font-bold`}>
                {user.avatar}
              </div>
              <div>
                <p className="text-slate-400 text-xs">Submitting as</p>
                <p className="text-white font-medium text-sm">{user.name}</p>
              </div>
            </div>

            {/* Time slots */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-400">Your Available Times</label>
                {times.length < 4 && (
                  <button type="button" onClick={addTimeSlot}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    + Add slot
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {times.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <input
                      type="datetime-local"
                      value={t}
                      min={getMinDateTime()}
                      onChange={e => updateTime(i, e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                    />
                    {times.length > 3 && (
                      <button type="button" onClick={() => removeTimeSlot(i)}
                        className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center justify-center text-sm">
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-slate-600 text-xs mt-2">Pick 3–4 windows you're free for a 30-min session</p>
            </div>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 disabled:hover:translate-y-0 flex items-center justify-center gap-2">
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Submitting…
                </>
              ) : '🚀 Submit My Availability'}
            </button>
          </form>
        )}

        {/* If active slot → show status */}
        {slotId && (
          <div className="space-y-4">
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 text-emerald-400 flex items-center gap-3">
                <span className="text-xl">🎉</span>
                <div>
                  <p className="font-semibold">{success}</p>
                  <p className="text-sm text-emerald-500/70 mt-0.5">Auto-refreshing every 5 seconds…</p>
                </div>
              </div>
            )}

            {liveSlot ? (
              <MeetingCard slot={liveSlot} />
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                <svg className="animate-spin w-6 h-6 text-blue-500 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <p className="text-slate-400 text-sm">Loading your session details…</p>
              </div>
            )}

            <button onClick={handleReset}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white py-3 rounded-xl text-sm font-medium transition-all border border-slate-700">
              ← Submit a New Request
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
