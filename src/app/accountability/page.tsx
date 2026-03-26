'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type AccountabilityLog = {
  id: string
  created_at: string
  date: string
  wake_time: string
  out_of_bed_time: string
  morning_routine_done: boolean
  workout_done: boolean
  scripture_study: boolean
  family_dinner: boolean
  no_phone_after_9pm: boolean
  notes: string
  score: number
}

const HABITS = [
  { key: 'morning_routine_done', label: 'Morning Routine', icon: '🌅' },
  { key: 'workout_done', label: 'Workout', icon: '💪' },
  { key: 'scripture_study', label: 'Scripture Study', icon: '📖' },
  { key: 'family_dinner', label: 'Family Dinner', icon: '🍽️' },
  { key: 'no_phone_after_9pm', label: 'No Phone After 9pm', icon: '📵' },
]

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  wake_time: '',
  out_of_bed_time: '',
  morning_routine_done: false,
  workout_done: false,
  scripture_study: false,
  family_dinner: false,
  no_phone_after_9pm: false,
  notes: '',
  score: 7,
}

function parseWakeMinutes(t: string): number | null {
  if (!t) return null
  const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return null
  let h = parseInt(match[1])
  const m = parseInt(match[2])
  const ampm = match[3].toUpperCase()
  if (ampm === 'AM' && h === 12) h = 0
  if (ampm === 'PM' && h !== 12) h += 12
  return h * 60 + m
}

function getLast7Days(): string[] {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export default function AccountabilityPage() {
  const [logs, setLogs] = useState<AccountabilityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editLog, setEditLog] = useState<AccountabilityLog | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const today = new Date().toISOString().split('T')[0]
  const last7 = getLast7Days()

  async function loadLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('accountability_logs')
      .select('*')
      .order('date', { ascending: false })
      .limit(60)
    setLogs(data || [])
    setLoading(false)
  }

  useEffect(() => { loadLogs() }, [])

  const todayLog = logs.find(l => l.date === today)

  async function toggleHabit(log: AccountabilityLog, habitKey: string) {
    const updated = { ...log, [habitKey]: !log[habitKey as keyof AccountabilityLog] }
    await supabase.from('accountability_logs').update({ [habitKey]: updated[habitKey as keyof typeof updated] }).eq('id', log.id)
    loadLogs()
  }

  function openAdd() {
    setEditLog(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  function openEdit(log: AccountabilityLog) {
    setEditLog(log)
    setForm({
      date: log.date,
      wake_time: log.wake_time || '',
      out_of_bed_time: log.out_of_bed_time || '',
      morning_routine_done: log.morning_routine_done,
      workout_done: log.workout_done,
      scripture_study: log.scripture_study,
      family_dinner: log.family_dinner,
      no_phone_after_9pm: log.no_phone_after_9pm,
      notes: log.notes || '',
      score: log.score || 7,
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editLog) {
      await supabase.from('accountability_logs').update(form).eq('id', editLog.id)
    } else {
      await supabase.from('accountability_logs').insert([{ ...form }])
    }
    setShowModal(false)
    loadLogs()
  }

  // Stats
  const last30 = logs.slice(0, 30)
  const avgScore = last30.length > 0 ? (last30.reduce((a, l) => a + (l.score || 0), 0) / last30.length).toFixed(1) : 'N/A'
  const habitCompletion = last30.length > 0
    ? Math.round((last30.reduce((a, l) => {
        return a + HABITS.filter(h => l[h.key as keyof AccountabilityLog]).length
      }, 0) / (last30.length * HABITS.length)) * 100)
    : 0

  // Streak
  let streak = 0
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date))
  for (let i = 0; i < sortedLogs.length; i++) {
    const expected = new Date()
    expected.setDate(expected.getDate() - i)
    const expectedStr = expected.toISOString().split('T')[0]
    if (sortedLogs[i]?.date === expectedStr) streak++
    else break
  }

  // Wake time chart (last 14 days)
  const wakeData = last30.filter(l => l.wake_time).slice(0, 14).reverse()

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Accountability ✅</h1>
          <p className="text-gray-400 text-sm mt-1">Daily habits, wake time tracking, and goal progress</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Log Day
        </button>
      </div>

      {/* Goals Section */}
      <div className="mb-6 p-5 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-800/50 rounded-xl">
        <h2 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-3">🎯 Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="text-white font-medium text-sm">Wake Goal: 6:30 AM</p>
              <p className="text-gray-400 text-xs">Currently at 7:00 AM — getting closer</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🌙</span>
            <div>
              <p className="text-white font-medium text-sm">Bed Goal: 10:30 PM</p>
              <p className="text-gray-400 text-xs">No phone after 9pm</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧘</span>
            <div>
              <p className="text-white font-medium text-sm">Morning Routine</p>
              <p className="text-gray-400 text-xs">30-60 min meditation + journaling</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{streak}</p>
          <p className="text-gray-400 text-xs mt-1">Day Streak 🔥</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{habitCompletion}%</p>
          <p className="text-gray-400 text-xs mt-1">Habit Completion</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400">{avgScore}</p>
          <p className="text-gray-400 text-xs mt-1">Avg Day Score</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-400">{logs.length}</p>
          <p className="text-gray-400 text-xs mt-1">Days Logged</p>
        </div>
      </div>

      {/* Today's Log */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Today — {today}</h2>
        {todayLog ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-gray-500">Wake Time</p>
                  <p className="text-white font-semibold">{todayLog.wake_time || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Out of Bed</p>
                  <p className="text-white font-semibold">{todayLog.out_of_bed_time || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Day Score</p>
                  <p className="text-white font-semibold">{todayLog.score}/10</p>
                </div>
              </div>
              <button onClick={() => openEdit(todayLog)} className="text-gray-500 hover:text-blue-400 text-sm">✏️ Edit</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {HABITS.map(habit => (
                <button
                  key={habit.key}
                  onClick={() => toggleHabit(todayLog, habit.key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-xs font-medium ${
                    todayLog[habit.key as keyof AccountabilityLog]
                      ? 'bg-green-900/40 border-green-600 text-green-300'
                      : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <span className="text-lg">{habit.icon}</span>
                  <span className="text-center leading-tight">{habit.label}</span>
                  <span>{todayLog[habit.key as keyof AccountabilityLog] ? '✓' : '○'}</span>
                </button>
              ))}
            </div>
            {todayLog.notes && (
              <p className="text-gray-400 text-sm mt-3 italic">{todayLog.notes}</p>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 border-dashed rounded-xl p-8 text-center">
            <p className="text-gray-500 mb-3">No log for today yet.</p>
            <button onClick={openAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg">
              Log Today
            </button>
          </div>
        )}
      </div>

      {/* 7-Day Grid */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">7-Day Overview</h2>
        <div className="grid grid-cols-7 gap-2">
          {last7.map(date => {
            const log = logs.find(l => l.date === date)
            const dayName = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })
            const dayNum = new Date(date + 'T12:00:00').getDate()
            const habitsDone = log ? HABITS.filter(h => log[h.key as keyof AccountabilityLog]).length : 0
            const pct = log ? Math.round((habitsDone / HABITS.length) * 100) : 0
            const isToday = date === today
            return (
              <div
                key={date}
                className={`rounded-xl p-3 text-center border cursor-pointer hover:border-gray-500 transition-all ${
                  isToday ? 'border-blue-600' : 'border-gray-700'
                } ${log ? 'bg-gray-800' : 'bg-gray-800/30'}`}
                onClick={() => log && openEdit(log)}
              >
                <p className="text-xs text-gray-500">{dayName}</p>
                <p className={`text-lg font-bold ${isToday ? 'text-blue-400' : 'text-white'}`}>{dayNum}</p>
                {log ? (
                  <>
                    <p className="text-xs text-gray-400">{log.wake_time || '—'}</p>
                    <div className="mt-1">
                      <div className={`text-xs font-semibold ${pct === 100 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {pct}%
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-600 mt-1">—</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Wake Time Trend */}
      {wakeData.length > 0 && (
        <div className="mb-6 bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Wake Time Trend</h2>
          <div className="flex items-end gap-2 h-20">
            {wakeData.map((log, i) => {
              const mins = parseWakeMinutes(log.wake_time)
              // 5:00 AM = 300 min, 10:00 AM = 600 min
              const clamp = mins ? Math.max(0, Math.min(100, ((mins - 300) / 300) * 100)) : 50
              const height = Math.max(10, 100 - clamp)
              const isGood = mins !== null && mins <= 390 // 6:30 AM
              return (
                <div key={log.id} className="flex flex-col items-center flex-1" title={`${log.date}: ${log.wake_time}`}>
                  <div
                    className={`w-full rounded-sm ${isGood ? 'bg-green-600' : 'bg-blue-600'}`}
                    style={{ height: `${height}%` }}
                  />
                  <p className="text-xs text-gray-600 mt-1 truncate w-full text-center">
                    {new Date(log.date + 'T12:00:00').getDate()}
                  </p>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>🟢 Before 6:30 AM</span>
            <span>🔵 After 6:30 AM</span>
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Logs</h2>
        {loading ? (
          <div className="text-gray-500 text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 14).map(log => {
              const habitsDone = HABITS.filter(h => log[h.key as keyof AccountabilityLog]).length
              return (
                <div
                  key={log.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 flex items-center justify-between hover:border-gray-600 cursor-pointer transition-all"
                  onClick={() => openEdit(log)}
                >
                  <div className="flex items-center gap-6">
                    <p className="text-white font-medium text-sm w-28">{log.date}</p>
                    <p className="text-gray-400 text-sm">⏰ {log.wake_time || '—'}</p>
                    <p className="text-gray-400 text-sm">
                      {HABITS.map(h => (
                        <span key={h.key} className={log[h.key as keyof AccountabilityLog] ? 'text-green-400' : 'text-gray-700'}>
                          {h.icon}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-semibold ${habitsDone === 5 ? 'text-green-400' : habitsDone >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {habitsDone}/5 habits
                    </span>
                    <span className="text-gray-500 text-sm">{log.score}/10</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">{editLog ? 'Edit Log' : 'Log a Day'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date *</label>
                <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Wake Time</label>
                  <input type="text" value={form.wake_time} onChange={e => setForm({ ...form, wake_time: e.target.value })}
                    placeholder="7:00 AM"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Out of Bed</label>
                  <input type="text" value={form.out_of_bed_time} onChange={e => setForm({ ...form, out_of_bed_time: e.target.value })}
                    placeholder="7:30 AM"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Habits Completed</label>
                <div className="grid grid-cols-1 gap-2">
                  {HABITS.map(habit => (
                    <label key={habit.key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!form[habit.key as keyof typeof form]}
                        onChange={e => setForm({ ...form, [habit.key]: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-300">{habit.icon} {habit.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Day Score (1-10): {form.score}</label>
                <input type="range" min={1} max={10} value={form.score}
                  onChange={e => setForm({ ...form, score: parseInt(e.target.value) })}
                  className="w-full" />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>1</span><span>5</span><span>10</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="How was the day..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg">
                  {editLog ? 'Update' : 'Save'} Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
