'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type StrategyNote = {
  id: string
  created_at: string
  date: string
  area: string
  title: string
  content: string
  priority: string
  status: string
}

const AREAS = ['D2D Sales', 'Tile Business', 'Finance', 'Personal', 'Long-term Vision']
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
const STATUSES = ['Active', 'Done', 'Paused', 'Reviewing']

const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-900/60 text-red-300 border border-red-800',
  High: 'bg-orange-900/60 text-orange-300 border border-orange-800',
  Medium: 'bg-yellow-900/60 text-yellow-300 border border-yellow-800',
  Low: 'bg-gray-700 text-gray-400',
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-900/60 text-green-300',
  Done: 'bg-blue-900/60 text-blue-300',
  Paused: 'bg-gray-700 text-gray-400',
  Reviewing: 'bg-purple-900/60 text-purple-300',
}

const AREA_ICONS: Record<string, string> = {
  'D2D Sales': '🚪',
  'Tile Business': '🏗️',
  'Finance': '💰',
  'Personal': '🧠',
  'Long-term Vision': '🔭',
}

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  area: 'D2D Sales',
  title: '',
  content: '',
  priority: 'High',
  status: 'Active',
}

export default function StrategyPage() {
  const [notes, setNotes] = useState<StrategyNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editNote, setEditNote] = useState<StrategyNote | null>(null)
  const [filterArea, setFilterArea] = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')
  const [form, setForm] = useState({ ...EMPTY_FORM })

  async function loadNotes() {
    setLoading(true)
    const { data } = await supabase.from('strategy_notes').select('*').order('created_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }

  useEffect(() => { loadNotes() }, [])

  function openAdd() {
    setEditNote(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  function openEdit(note: StrategyNote) {
    setEditNote(note)
    setForm({
      date: note.date || new Date().toISOString().split('T')[0],
      area: note.area,
      title: note.title,
      content: note.content,
      priority: note.priority,
      status: note.status,
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editNote) {
      await supabase.from('strategy_notes').update(form).eq('id', editNote.id)
    } else {
      await supabase.from('strategy_notes').insert([{ ...form }])
    }
    setShowModal(false)
    loadNotes()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this strategy note?')) return
    await supabase.from('strategy_notes').delete().eq('id', id)
    loadNotes()
  }

  const filtered = notes.filter(n => {
    if (filterArea !== 'All' && n.area !== filterArea) return false
    if (filterPriority !== 'All' && n.priority !== filterPriority) return false
    return true
  })

  const grouped: Record<string, StrategyNote[]> = {}
  AREAS.forEach(a => { grouped[a] = [] })
  filtered.forEach(n => {
    if (!grouped[n.area]) grouped[n.area] = []
    grouped[n.area].push(n)
  })

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Strategy 🎯</h1>
          <p className="text-gray-400 text-sm mt-1">$1M by age 30 — roadmap and business strategy hub</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Strategy Note
        </button>
      </div>

      {/* Mission Section */}
      <div className="mb-6 p-5 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-800/50 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-yellow-400 font-bold text-lg">🏆 Mission</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <p className="text-white font-bold text-xl mb-1">$1,000,000/year by January 2, 2030</p>
            <p className="text-gray-300 text-sm">Full time control, no money stress, $1M+/year income. Freedom on every level.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <p className="text-yellow-400 font-bold text-2xl">26</p>
              <p className="text-gray-400 text-xs">Current Age</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <p className="text-orange-400 font-bold text-lg">~3y 9m</p>
              <p className="text-gray-400 text-xs">Remaining</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2">
          <option value="All">All Areas</option>
          {AREAS.map(a => <option key={a}>{a}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2">
          <option value="All">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        <span className="text-gray-500 text-sm self-center">{filtered.length} note{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-12">Loading...</div>
      ) : (
        <div className="space-y-8">
          {AREAS.map(area => {
            const areaItems = grouped[area]
            if (areaItems.length === 0) return null
            return (
              <div key={area}>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>{AREA_ICONS[area]}</span>
                  <span>{area}</span>
                  <span className="text-gray-600">({areaItems.length})</span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {areaItems.map(note => (
                    <div
                      key={note.id}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex gap-2 flex-wrap flex-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${PRIORITY_COLORS[note.priority]}`}>
                            {note.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[note.status]}`}>
                            {note.status}
                          </span>
                        </div>
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          <button onClick={() => openEdit(note)} className="text-gray-500 hover:text-blue-400 text-sm p-1">✏️</button>
                          <button onClick={() => handleDelete(note.id)} className="text-gray-500 hover:text-red-400 text-sm p-1">🗑️</button>
                        </div>
                      </div>
                      <h3 className="text-white font-bold text-base mb-2">{note.title}</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">{note.content}</p>
                      {note.date && (
                        <p className="text-gray-600 text-xs mt-3">{note.date}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">🎯</p>
              <p>No strategy notes yet. Add your first one!</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">{editNote ? 'Edit Strategy Note' : 'Add Strategy Note'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                  placeholder="Strategy title..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Area</label>
                  <select value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
                    {AREAS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Content *</label>
                <textarea required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={5} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Strategic note, plan, or vision..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg">
                  {editNote ? 'Update' : 'Add'} Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
