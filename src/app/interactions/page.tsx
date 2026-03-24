'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Interaction } from '@/types'

const CATEGORIES = ['All', 'call', 'email', 'meeting', 'text', 'other']
const STATUSES = ['All', 'pending', 'complete', 'follow-up']

export default function InteractionsPage() {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'call',
    summary: '',
    action_items: '',
    status: 'pending',
    notes: '',
  })

  async function loadInteractions() {
    setLoading(true)
    let query = supabase.from('interactions').select('*').order('date', { ascending: false })
    if (filterCategory !== 'All') query = query.eq('category', filterCategory)
    if (filterStatus !== 'All') query = query.eq('status', filterStatus)
    const { data } = await query
    setInteractions(data || [])
    setLoading(false)
  }

  useEffect(() => { loadInteractions() }, [filterCategory, filterStatus])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('interactions').insert([{ ...form, id: crypto.randomUUID() }])
    setShowModal(false)
    setForm({ date: new Date().toISOString().split('T')[0], category: 'call', summary: '', action_items: '', status: 'pending', notes: '' })
    loadInteractions()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this interaction?')) return
    await supabase.from('interactions').delete().eq('id', id)
    loadInteractions()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Interactions</h1>
          <p className="text-gray-400 text-sm mt-1">{interactions.length} total</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Log Interaction
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2"
          >
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Summary</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Action Items</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : interactions.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No interactions found</td></tr>
            ) : interactions.map((i) => (
              <tr key={i.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{i.date}</td>
                <td className="px-4 py-3">
                  <span className="bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded text-xs">{i.category}</span>
                </td>
                <td className="px-4 py-3 text-gray-200 max-w-xs truncate">{i.summary}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    i.status === 'complete' ? 'bg-green-900/50 text-green-400' :
                    i.status === 'follow-up' ? 'bg-orange-900/50 text-orange-400' :
                    'bg-yellow-900/50 text-yellow-400'
                  }`}>{i.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{i.action_items}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(i.id)} className="text-red-500 hover:text-red-400 text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Log Interaction</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm">
                    {['call', 'email', 'meeting', 'text', 'other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Summary</label>
                <input type="text" value={form.summary} onChange={e => setForm({...form, summary: e.target.value})}
                  placeholder="What happened?" className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Action Items</label>
                <input type="text" value={form.action_items} onChange={e => setForm({...form, action_items: e.target.value})}
                  placeholder="What needs to happen next?" className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm">
                  {['pending', 'complete', 'follow-up'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  placeholder="Additional notes..." rows={3}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  Save Interaction
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
