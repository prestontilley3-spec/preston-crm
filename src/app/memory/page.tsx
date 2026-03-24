'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const CATEGORIES = [
  'All',
  'Tile Business',
  'D2D Sales',
  'Finance',
  'Planning',
  'Personal',
  'Calendar',
  'CRM/Tech',
  'General',
]

const CATEGORY_COLORS: Record<string, string> = {
  'Tile Business': 'bg-orange-900/50 text-orange-400 border-orange-800',
  'D2D Sales': 'bg-purple-900/50 text-purple-400 border-purple-800',
  'Finance': 'bg-green-900/50 text-green-400 border-green-800',
  'Planning': 'bg-blue-900/50 text-blue-400 border-blue-800',
  'Personal': 'bg-pink-900/50 text-pink-400 border-pink-800',
  'Calendar': 'bg-cyan-900/50 text-cyan-400 border-cyan-800',
  'CRM/Tech': 'bg-indigo-900/50 text-indigo-400 border-indigo-800',
  'General': 'bg-gray-800 text-gray-400 border-gray-700',
}

interface MemoryLog {
  id: string
  created_at: string
  date: string
  category: string
  title: string
  summary: string
  key_decisions: string
  action_items: string
  tags: string
}

interface NewEntry {
  date: string
  category: string
  title: string
  summary: string
  key_decisions: string
  action_items: string
  tags: string
}

export default function MemoryPage() {
  const [entries, setEntries] = useState<MemoryLog[]>([])
  const [filtered, setFiltered] = useState<MemoryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newEntry, setNewEntry] = useState<NewEntry>({
    date: new Date().toISOString().split('T')[0],
    category: 'General',
    title: '',
    summary: '',
    key_decisions: '',
    action_items: '',
    tags: '',
  })

  useEffect(() => {
    fetchEntries()
  }, [])

  useEffect(() => {
    let result = entries
    if (category !== 'All') {
      result = result.filter((e) => e.category === category)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.summary?.toLowerCase().includes(q) ||
          e.tags?.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [entries, category, search])

  async function fetchEntries() {
    setLoading(true)
    const { data } = await supabase
      .from('memory_logs')
      .select('*')
      .order('date', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!newEntry.title.trim() || !newEntry.summary.trim()) return
    setSaving(true)
    await supabase.from('memory_logs').insert([newEntry])
    setSaving(false)
    setShowModal(false)
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      category: 'General',
      title: '',
      summary: '',
      key_decisions: '',
      action_items: '',
      tags: '',
    })
    fetchEntries()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🧠 Memory</h1>
          <p className="text-gray-400 text-sm mt-1">AI-Preston conversation logs — searchable and categorized</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
        >
          + New Entry
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by title, summary, or tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-500">{filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'}</p>

      {/* Cards */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading memory logs…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          No entries found.{' '}
          <button onClick={() => setShowModal(true)} className="text-blue-400 hover:underline">
            Add one →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry) => {
            const isExpanded = expandedId === entry.id
            return (
              <div
                key={entry.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['General']}`}>
                        {entry.category}
                      </span>
                      <span className="text-xs text-gray-500">{entry.date}</span>
                      {entry.tags && entry.tags.split(',').map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-white font-semibold text-base">{entry.title}</h3>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{entry.summary}</p>
                  </div>
                  <span className="text-gray-600 text-xs flex-shrink-0 pt-1">{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-3 border-t border-gray-800 pt-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Summary</p>
                      <p className="text-sm text-gray-300">{entry.summary}</p>
                    </div>
                    {entry.key_decisions && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Key Decisions</p>
                        <p className="text-sm text-gray-300">{entry.key_decisions}</p>
                      </div>
                    )}
                    {entry.action_items && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Action Items</p>
                        <p className="text-sm text-blue-300">{entry.action_items}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">New Memory Entry</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Category</label>
                  <select
                    value={newEntry.category}
                    onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Title *</label>
                <input
                  type="text"
                  placeholder="Short title / subject of the convo"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Summary *</label>
                <textarea
                  placeholder="What was discussed…"
                  value={newEntry.summary}
                  onChange={(e) => setNewEntry({ ...newEntry, summary: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Key Decisions</label>
                <textarea
                  placeholder="Any decisions made…"
                  value={newEntry.key_decisions}
                  onChange={(e) => setNewEntry({ ...newEntry, key_decisions: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Action Items</label>
                <textarea
                  placeholder="Follow-ups or tasks…"
                  value={newEntry.action_items}
                  onChange={(e) => setNewEntry({ ...newEntry, action_items: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. calendar, setup, ai"
                  value={newEntry.tags}
                  onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newEntry.title.trim() || !newEntry.summary.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-all"
              >
                {saving ? 'Saving…' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
