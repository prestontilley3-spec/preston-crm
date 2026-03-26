'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

type WeeklyPlan = {
  id: string
  created_at: string
  week_start: string
  theme: string
  priority_tile: string
  priority_d2d: string
  priority_personal: string
  revenue_target: string
  key_meetings: string
  stop_doing: string
  family_intention: string
  notes: string
}

type DailyPlan = {
  id: string
  created_at: string
  date: string
  weekly_plan_id: string | null
  energy_score: number
  priority_1: string
  priority_2: string
  priority_3: string
  schedule_morning: string
  schedule_afternoon: string
  schedule_evening: string
  win_of_day: string
  evening_big_win: string
  evening_miss: string
  evening_tomorrow: string
  completed: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T12:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function isAfter5pm(): boolean {
  return new Date().getHours() >= 17
}

const EMPTY_WEEKLY: Omit<WeeklyPlan, 'id' | 'created_at'> = {
  week_start: getMondayOfWeek(new Date()),
  theme: '',
  priority_tile: '',
  priority_d2d: '',
  priority_personal: '',
  revenue_target: '',
  key_meetings: '',
  stop_doing: '',
  family_intention: '',
  notes: '',
}

const EMPTY_DAILY: Omit<DailyPlan, 'id' | 'created_at'> = {
  date: new Date().toISOString().split('T')[0],
  weekly_plan_id: null,
  energy_score: 7,
  priority_1: '',
  priority_2: '',
  priority_3: '',
  schedule_morning: '',
  schedule_afternoon: '',
  schedule_evening: '',
  win_of_day: '',
  evening_big_win: '',
  evening_miss: '',
  evening_tomorrow: '',
  completed: false,
}

// ─── Weekly Modal ─────────────────────────────────────────────────────────────

function WeeklyModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: WeeklyPlan | null
  onClose: () => void
  onSaved: (plan: WeeklyPlan) => void
}) {
  const [form, setForm] = useState<Omit<WeeklyPlan, 'id' | 'created_at'>>(
    initial
      ? {
          week_start: initial.week_start,
          theme: initial.theme,
          priority_tile: initial.priority_tile,
          priority_d2d: initial.priority_d2d,
          priority_personal: initial.priority_personal,
          revenue_target: initial.revenue_target,
          key_meetings: initial.key_meetings,
          stop_doing: initial.stop_doing,
          family_intention: initial.family_intention,
          notes: initial.notes,
        }
      : { ...EMPTY_WEEKLY }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      let result
      if (initial?.id) {
        result = await supabase
          .from('weekly_plans')
          .update(form)
          .eq('id', initial.id)
          .select()
          .single()
      } else {
        result = await supabase.from('weekly_plans').insert(form).select().single()
      }
      if (result.error) throw result.error
      onSaved(result.data)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {initial ? 'Edit Weekly Plan' : "Create This Week's Plan"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-900/50 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Week Start (Monday)</label>
            <input type="date" value={form.week_start} onChange={(e) => set('week_start', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Theme for the Week</label>
            <input type="text" value={form.theme} onChange={(e) => set('theme', e.target.value)}
              placeholder="e.g. Execute, Close the Deal, Build the Foundation"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">🏗️ Tile Priority</label>
              <input type="text" value={form.priority_tile} onChange={(e) => set('priority_tile', e.target.value)}
                placeholder="Top focus for Tile Business this week"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">🚪 D2D Priority</label>
              <input type="text" value={form.priority_d2d} onChange={(e) => set('priority_d2d', e.target.value)}
                placeholder="Top focus for D2D this week"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">🧘 Personal Priority</label>
              <input type="text" value={form.priority_personal} onChange={(e) => set('priority_personal', e.target.value)}
                placeholder="Top personal focus this week"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">💰 Revenue Target</label>
            <input type="text" value={form.revenue_target} onChange={(e) => set('revenue_target', e.target.value)}
              placeholder="e.g. $15K in tile estimates sent"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">📅 Key Meetings</label>
            <input type="text" value={form.key_meetings} onChange={(e) => set('key_meetings', e.target.value)}
              placeholder="Brayden, Aaron Judd, Keaton"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">🚫 Stop Doing</label>
            <input type="text" value={form.stop_doing} onChange={(e) => set('stop_doing', e.target.value)}
              placeholder="One thing to eliminate this week"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">❤️ Family Intention</label>
            <input type="text" value={form.family_intention} onChange={(e) => set('family_intention', e.target.value)}
              placeholder="Date night Thursday, bedtime stories every night"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">📝 Notes</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
              placeholder="Anything else on your mind this week"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Daily Modal ──────────────────────────────────────────────────────────────

function DailyModal({
  initial,
  weeklyPlan,
  onClose,
  onSaved,
  eveningMode,
}: {
  initial?: DailyPlan | null
  weeklyPlan?: WeeklyPlan | null
  onClose: () => void
  onSaved: (plan: DailyPlan) => void
  eveningMode?: boolean
}) {
  const [form, setForm] = useState<Omit<DailyPlan, 'id' | 'created_at'>>(
    initial
      ? {
          date: initial.date,
          weekly_plan_id: initial.weekly_plan_id,
          energy_score: initial.energy_score,
          priority_1: initial.priority_1,
          priority_2: initial.priority_2,
          priority_3: initial.priority_3,
          schedule_morning: initial.schedule_morning,
          schedule_afternoon: initial.schedule_afternoon,
          schedule_evening: initial.schedule_evening,
          win_of_day: initial.win_of_day,
          evening_big_win: initial.evening_big_win,
          evening_miss: initial.evening_miss,
          evening_tomorrow: initial.evening_tomorrow,
          completed: initial.completed,
        }
      : {
          ...EMPTY_DAILY,
          weekly_plan_id: weeklyPlan?.id ?? null,
        }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      if (eveningMode) {
        payload.completed = !!(payload.evening_big_win || payload.evening_miss || payload.evening_tomorrow)
      }
      let result
      if (initial?.id) {
        result = await supabase.from('daily_plans').update(payload).eq('id', initial.id).select().single()
      } else {
        result = await supabase.from('daily_plans').insert(payload).select().single()
      }
      if (result.error) throw result.error
      onSaved(result.data)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {eveningMode ? '🌙 Evening Reflection' : initial ? 'Edit Daily Plan' : "Start Today's Plan"}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">{formatDate(form.date)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Weekly context panel */}
        {weeklyPlan && !eveningMode && (
          <div className="mx-6 mt-5 p-4 bg-gray-800/60 border border-gray-700 rounded-xl">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
              📋 This Week — {weeklyPlan.theme}
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-gray-500 mb-0.5">Tile</p>
                <p className="text-gray-300">{weeklyPlan.priority_tile || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">D2D</p>
                <p className="text-gray-300">{weeklyPlan.priority_d2d || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Personal</p>
                <p className="text-gray-300">{weeklyPlan.priority_personal || '—'}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-900/50 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

          {!eveningMode && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  ⚡ Energy Score: <span className="text-white">{form.energy_score}/10</span>
                </label>
                <input type="range" min={1} max={10} value={form.energy_score}
                  onChange={(e) => set('energy_score', parseInt(e.target.value))}
                  className="w-full accent-blue-500" />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>1 — Drained</span><span>10 — On fire</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">🎯 Top 3 Priorities</label>
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => {
                    const key = `priority_${n}` as 'priority_1' | 'priority_2' | 'priority_3'
                    return (
                      <div key={n} className="flex items-center gap-2">
                        <span className="text-gray-600 text-sm w-5 text-right">{n}.</span>
                        <input type="text" value={form[key]} onChange={(e) => set(key, e.target.value)}
                          placeholder={`Priority ${n}`}
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">🗓️ Schedule</label>
                <div className="space-y-2">
                  {[
                    { key: 'schedule_morning' as const, label: '🌅 Morning (6am–12pm)', placeholder: 'Workout, calls starting 11am' },
                    { key: 'schedule_afternoon' as const, label: '☀️ Afternoon (12pm–5pm)', placeholder: 'Aaron Judd 12pm, Keaton 3pm' },
                    { key: 'schedule_evening' as const, label: '🌆 Evening (5pm–9pm)', placeholder: 'Date Night 5:30pm' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <input type="text" value={form[key]} onChange={(e) => set(key, e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">🏆 What Would Make Today a Win?</label>
                <input type="text" value={form.win_of_day} onChange={(e) => set('win_of_day', e.target.value)}
                  placeholder="Lock in all 3 team leads for summer"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
            </>
          )}

          {eveningMode && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">🏆 Actual Big Win Today</label>
                <textarea value={form.evening_big_win} onChange={(e) => set('evening_big_win', e.target.value)}
                  placeholder="What actually happened? What moved the needle?"
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">⚠️ What Fell Short?</label>
                <textarea value={form.evening_miss} onChange={(e) => set('evening_miss', e.target.value)}
                  placeholder="What didn't happen? What do you own?"
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">➡️ One Focus for Tomorrow</label>
                <input type="text" value={form.evening_tomorrow} onChange={(e) => set('evening_tomorrow', e.target.value)}
                  placeholder="Start tile closing prep"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors ${eveningMode ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
              {saving ? 'Saving…' : eveningMode ? 'Save Reflection' : 'Save Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Weekly Tab ───────────────────────────────────────────────────────────────

function WeeklyTab() {
  const [plans, setPlans] = useState<WeeklyPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editPlan, setEditPlan] = useState<WeeklyPlan | null>(null)

  const todayMonday = getMondayOfWeek(new Date())

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('weekly_plans')
      .select('*')
      .order('week_start', { ascending: false })
    setPlans(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const currentPlan = plans.find((p) => p.week_start === todayMonday) || null
  const pastPlans = plans.filter((p) => p.week_start !== todayMonday)

  const handleSaved = (plan: WeeklyPlan) => {
    setPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === plan.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = plan
        return next.sort((a, b) => b.week_start.localeCompare(a.week_start))
      }
      return [plan, ...prev].sort((a, b) => b.week_start.localeCompare(a.week_start))
    })
  }

  return (
    <div className="space-y-6">
      {/* Current week */}
      {loading ? (
        <div className="text-gray-500 text-sm">Loading…</div>
      ) : currentPlan ? (
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">This Week</span>
                <span className="text-xs text-gray-500">· {formatWeekRange(currentPlan.week_start)}</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{currentPlan.theme || 'No Theme Set'}</h2>
            </div>
            <button
              onClick={() => { setEditPlan(currentPlan); setShowModal(true) }}
              className="px-3 py-1.5 text-sm border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-colors">
              Edit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-900/60 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">🏗️ Tile</p>
              <p className="text-sm text-gray-200">{currentPlan.priority_tile || '—'}</p>
            </div>
            <div className="bg-gray-900/60 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">🚪 D2D</p>
              <p className="text-sm text-gray-200">{currentPlan.priority_d2d || '—'}</p>
            </div>
            <div className="bg-gray-900/60 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">🧘 Personal</p>
              <p className="text-sm text-gray-200">{currentPlan.priority_personal || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {currentPlan.revenue_target && (
              <div className="bg-green-900/20 border border-green-800/40 rounded-lg p-3">
                <p className="text-xs text-green-500 mb-0.5">💰 Revenue Target</p>
                <p className="text-green-300 font-medium">{currentPlan.revenue_target}</p>
              </div>
            )}
            {currentPlan.key_meetings && (
              <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-3">
                <p className="text-xs text-blue-400 mb-0.5">📅 Key Meetings</p>
                <p className="text-blue-200">{currentPlan.key_meetings}</p>
              </div>
            )}
            {currentPlan.stop_doing && (
              <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3">
                <p className="text-xs text-red-400 mb-0.5">🚫 Stop Doing</p>
                <p className="text-red-200">{currentPlan.stop_doing}</p>
              </div>
            )}
            {currentPlan.family_intention && (
              <div className="bg-pink-900/20 border border-pink-800/40 rounded-lg p-3">
                <p className="text-xs text-pink-400 mb-0.5">❤️ Family</p>
                <p className="text-pink-200">{currentPlan.family_intention}</p>
              </div>
            )}
          </div>

          {currentPlan.notes && (
            <div className="mt-3 text-sm text-gray-400 border-t border-gray-700 pt-3">
              <span className="text-gray-500">Notes: </span>{currentPlan.notes}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800/40 border border-dashed border-gray-700 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-lg font-semibold text-gray-300 mb-1">No plan for this week yet</p>
          <p className="text-sm text-gray-500 mb-5">Set the theme. Lock in your priorities. Own the week.</p>
          <button
            onClick={() => { setEditPlan(null); setShowModal(true) }}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition-colors">
            Create This Week&apos;s Plan
          </button>
        </div>
      )}

      {/* Create button if current plan exists */}
      {currentPlan && (
        <div className="flex justify-end">
          <button
            onClick={() => { setEditPlan(null); setShowModal(true) }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors">
            + New Week&apos;s Plan
          </button>
        </div>
      )}

      {/* Past weeks */}
      {pastPlans.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Past Weeks</h3>
          <div className="overflow-hidden rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/60 text-left">
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Week Of</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Theme</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider hidden md:table-cell">Tile</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider hidden md:table-cell">D2D</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider hidden md:table-cell">Personal</th>
                </tr>
              </thead>
              <tbody>
                {pastPlans.map((p, i) => (
                  <tr key={p.id}
                    className={`border-t border-gray-800 hover:bg-gray-800/40 cursor-pointer transition-colors ${i % 2 === 0 ? 'bg-gray-900/20' : ''}`}
                    onClick={() => { setEditPlan(p); setShowModal(true) }}>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatWeekRange(p.week_start)}</td>
                    <td className="px-4 py-3 text-white font-medium">{p.theme || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{p.priority_tile || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{p.priority_d2d || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{p.priority_personal || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <WeeklyModal
          initial={editPlan}
          onClose={() => { setShowModal(false); setEditPlan(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

// ─── Daily Tab ────────────────────────────────────────────────────────────────

function DailyTab() {
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([])
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDailyModal, setShowDailyModal] = useState(false)
  const [editDaily, setEditDaily] = useState<DailyPlan | null>(null)
  const [eveningMode, setEveningMode] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const todayMonday = getMondayOfWeek(new Date())

  const load = useCallback(async () => {
    setLoading(true)
    const [dailyResult, weeklyResult] = await Promise.all([
      supabase.from('daily_plans').select('*').order('date', { ascending: false }),
      supabase.from('weekly_plans').select('*').eq('week_start', todayMonday).single(),
    ])
    setDailyPlans(dailyResult.data || [])
    setWeeklyPlan(weeklyResult.data || null)
    setLoading(false)
  }, [todayMonday])

  useEffect(() => { load() }, [load])

  const todayPlan = dailyPlans.find((p) => p.date === today) || null
  const pastPlans = dailyPlans.filter((p) => p.date !== today)

  const handleSaved = (plan: DailyPlan) => {
    setDailyPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === plan.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = plan
        return next.sort((a, b) => b.date.localeCompare(a.date))
      }
      return [plan, ...prev].sort((a, b) => b.date.localeCompare(a.date))
    })
  }

  const openEvening = () => {
    setEditDaily(todayPlan)
    setEveningMode(true)
    setShowDailyModal(true)
  }

  const energyColor = (score: number) => {
    if (score >= 8) return 'text-green-400'
    if (score >= 5) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-gray-500 text-sm">Loading…</div>
      ) : todayPlan ? (
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Today</span>
                <span className="text-xs text-gray-500">· {formatDate(today)}</span>
                {todayPlan.completed && (
                  <span className="text-xs bg-green-900/40 text-green-400 border border-green-800 px-2 py-0.5 rounded-full">✅ Reflected</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">Day Plan</h2>
                <span className={`text-2xl font-bold ${energyColor(todayPlan.energy_score)}`}>
                  ⚡{todayPlan.energy_score}/10
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditDaily(todayPlan); setEveningMode(false); setShowDailyModal(true) }}
                className="px-3 py-1.5 text-sm border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-colors">
                Edit
              </button>
              <button
                onClick={openEvening}
                disabled={!isAfter5pm() && !todayPlan.completed}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  isAfter5pm() || todayPlan.completed
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                }`}
                title={!isAfter5pm() ? 'Unlocks after 5pm' : ''}>
                🌙 Evening Reflection {!isAfter5pm() && !todayPlan.completed && '(after 5pm)'}
              </button>
            </div>
          </div>

          {/* Weekly context strip */}
          {weeklyPlan && (
            <div className="mb-4 p-3 bg-gray-900/50 border border-gray-700/50 rounded-xl text-xs">
              <span className="text-blue-400 font-semibold">Week: {weeklyPlan.theme}</span>
              <span className="text-gray-500 mx-2">·</span>
              <span className="text-gray-400">Tile: {weeklyPlan.priority_tile}</span>
              <span className="text-gray-600 mx-2">|</span>
              <span className="text-gray-400">D2D: {weeklyPlan.priority_d2d}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-900/60 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">🎯 Top Priorities</p>
              <div className="space-y-1.5">
                {[todayPlan.priority_1, todayPlan.priority_2, todayPlan.priority_3]
                  .filter(Boolean)
                  .map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-gray-600 mt-0.5">{i + 1}.</span>
                      <span className="text-gray-200">{p}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="bg-gray-900/60 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">🗓️ Schedule</p>
              <div className="space-y-1.5 text-sm">
                {todayPlan.schedule_morning && <div><span className="text-gray-500">🌅 </span><span className="text-gray-300">{todayPlan.schedule_morning}</span></div>}
                {todayPlan.schedule_afternoon && <div><span className="text-gray-500">☀️ </span><span className="text-gray-300">{todayPlan.schedule_afternoon}</span></div>}
                {todayPlan.schedule_evening && <div><span className="text-gray-500">🌆 </span><span className="text-gray-300">{todayPlan.schedule_evening}</span></div>}
              </div>
            </div>
          </div>

          {todayPlan.win_of_day && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-800/40 rounded-xl text-sm">
              <span className="text-yellow-400 font-semibold">🏆 Win target: </span>
              <span className="text-yellow-200">{todayPlan.win_of_day}</span>
            </div>
          )}

          {todayPlan.completed && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {todayPlan.evening_big_win && (
                <div className="p-3 bg-green-900/20 border border-green-800/40 rounded-xl text-sm">
                  <p className="text-xs text-green-400 mb-1">🏆 Big Win</p>
                  <p className="text-green-200">{todayPlan.evening_big_win}</p>
                </div>
              )}
              {todayPlan.evening_miss && (
                <div className="p-3 bg-orange-900/20 border border-orange-800/40 rounded-xl text-sm">
                  <p className="text-xs text-orange-400 mb-1">⚠️ Miss</p>
                  <p className="text-orange-200">{todayPlan.evening_miss}</p>
                </div>
              )}
              {todayPlan.evening_tomorrow && (
                <div className="p-3 bg-blue-900/20 border border-blue-800/40 rounded-xl text-sm">
                  <p className="text-xs text-blue-400 mb-1">➡️ Tomorrow</p>
                  <p className="text-blue-200">{todayPlan.evening_tomorrow}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800/40 border border-dashed border-gray-700 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-3">🌅</p>
          <p className="text-lg font-semibold text-gray-300 mb-1">No plan for today yet</p>
          <p className="text-sm text-gray-500 mb-2">{formatDate(today)}</p>
          <p className="text-sm text-gray-600 mb-5">Build the day intentionally. Three priorities. Own it.</p>
          <button
            onClick={() => { setEditDaily(null); setEveningMode(false); setShowDailyModal(true) }}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition-colors">
            Start Today&apos;s Plan
          </button>
        </div>
      )}

      {/* Past days */}
      {pastPlans.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Past Days</h3>
          <div className="overflow-hidden rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/60 text-left">
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Energy</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider hidden md:table-cell">Top Priority</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider hidden md:table-cell">Win Target</th>
                  <th className="px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {pastPlans.map((p, i) => (
                  <tr key={p.id}
                    className={`border-t border-gray-800 hover:bg-gray-800/40 cursor-pointer transition-colors ${i % 2 === 0 ? 'bg-gray-900/20' : ''}`}
                    onClick={() => { setEditDaily(p); setEveningMode(false); setShowDailyModal(true) }}>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{formatDate(p.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${p.energy_score >= 8 ? 'text-green-400' : p.energy_score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {p.energy_score}/10
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{p.priority_1 || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{p.win_of_day || '—'}</td>
                    <td className="px-4 py-3">
                      {p.completed
                        ? <span className="text-xs bg-green-900/40 text-green-400 border border-green-800 px-2 py-0.5 rounded-full">✅ Done</span>
                        : <span className="text-xs bg-gray-800 text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDailyModal && (
        <DailyModal
          initial={editDaily}
          weeklyPlan={weeklyPlan}
          onClose={() => { setShowDailyModal(false); setEditDaily(null); setEveningMode(false) }}
          onSaved={handleSaved}
          eveningMode={eveningMode}
        />
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlanningPage() {
  const [tab, setTab] = useState<'weekly' | 'daily'>('daily')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Planning</h1>
          <p className="text-gray-400">Weekly sets the outline. Daily works off it.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800/60 p-1 rounded-xl w-fit mb-8 border border-gray-700">
          {[
            { key: 'daily', label: '🌅 Daily', },
            { key: 'weekly', label: '📋 Weekly', },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as 'weekly' | 'daily')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-gray-400 hover:text-gray-200'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'weekly' ? <WeeklyTab /> : <DailyTab />}
      </div>
    </div>
  )
}
