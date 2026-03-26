'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type ContentItem = {
  id: string
  created_at: string
  date: string
  platform: string
  type: string
  title: string
  description: string
  status: string
  account: string
  notes: string
}

const PLATFORMS = ['All', 'Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'All Platforms']
const TYPES = ['Post', 'Reel/Short', 'Story', 'Long-form', 'Recruiting']
const STATUSES = ['Idea', 'Scripted', 'Filmed', 'Editing', 'Scheduled', 'Posted']
const ACCOUNTS = ['Preston', 'Maycie', 'Both']

const STATUS_COLORS: Record<string, string> = {
  Idea: 'bg-gray-700 text-gray-300',
  Scripted: 'bg-yellow-900/60 text-yellow-300',
  Filmed: 'bg-blue-900/60 text-blue-300',
  Editing: 'bg-purple-900/60 text-purple-300',
  Scheduled: 'bg-orange-900/60 text-orange-300',
  Posted: 'bg-green-900/60 text-green-300',
}

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: 'bg-pink-900/60 text-pink-300',
  TikTok: 'bg-red-900/60 text-red-300',
  YouTube: 'bg-red-900/60 text-red-300',
  LinkedIn: 'bg-blue-900/60 text-blue-300',
  All: 'bg-gray-700 text-gray-300',
}

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  platform: 'Instagram',
  type: 'Reel/Short',
  title: '',
  description: '',
  status: 'Idea',
  account: 'Preston',
  notes: '',
}

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<ContentItem | null>(null)
  const [filterPlatform, setFilterPlatform] = useState('All')
  const [filterAccount, setFilterAccount] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [form, setForm] = useState({ ...EMPTY_FORM })

  async function loadItems() {
    setLoading(true)
    let query = supabase.from('content_items').select('*').order('created_at', { ascending: false })
    const { data } = await query
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { loadItems() }, [])

  function openAdd() {
    setEditItem(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  function openEdit(item: ContentItem) {
    setEditItem(item)
    setForm({
      date: item.date,
      platform: item.platform,
      type: item.type,
      title: item.title,
      description: item.description,
      status: item.status,
      account: item.account,
      notes: item.notes || '',
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editItem) {
      await supabase.from('content_items').update(form).eq('id', editItem.id)
    } else {
      await supabase.from('content_items').insert([{ ...form }])
    }
    setShowModal(false)
    loadItems()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this content item?')) return
    await supabase.from('content_items').delete().eq('id', id)
    loadItems()
  }

  async function quickIdeaAdd() {
    const title = prompt('Content idea title:')
    if (!title) return
    await supabase.from('content_items').insert([{
      date: new Date().toISOString().split('T')[0],
      platform: 'Instagram',
      type: 'Reel/Short',
      title,
      description: '',
      status: 'Idea',
      account: 'Preston',
      notes: '',
    }])
    loadItems()
  }

  const filtered = items.filter(item => {
    if (filterPlatform !== 'All' && item.platform !== filterPlatform) return false
    if (filterAccount !== 'All' && item.account !== filterAccount) return false
    if (filterStatus !== 'All' && item.status !== filterStatus) return false
    return true
  })

  const grouped: Record<string, ContentItem[]> = {}
  STATUSES.forEach(s => { grouped[s] = [] })
  filtered.forEach(item => {
    if (!grouped[item.status]) grouped[item.status] = []
    grouped[item.status].push(item)
  })

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Planning 📝</h1>
          <p className="text-gray-400 text-sm mt-1">Social media + D2D recruiting content hub</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={quickIdeaAdd}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            ⚡ Quick Idea
          </button>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add Content
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={filterPlatform}
          onChange={e => setFilterPlatform(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2"
        >
          <option value="All">All Platforms</option>
          {['Instagram', 'TikTok', 'YouTube', 'LinkedIn'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filterAccount}
          onChange={e => setFilterAccount(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2"
        >
          <option value="All">All Accounts</option>
          {ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2"
        >
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-gray-500 text-sm self-center">{filtered.length} items</span>
      </div>

      {/* Status Pipeline */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Pipeline</p>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUSES.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${STATUS_COLORS[s]}`}
                onClick={() => setFilterStatus(filterStatus === s ? 'All' : s)}
              >
                {s} ({grouped[s]?.length || 0})
              </span>
              {i < STATUSES.length - 1 && <span className="text-gray-600">→</span>}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-12">Loading...</div>
      ) : (
        <div className="space-y-8">
          {STATUSES.map(status => {
            const statusItems = grouped[status]
            if (statusItems.length === 0) return null
            return (
              <div key={status}>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[status]}`}>{status}</span>
                  <span>{statusItems.length} item{statusItems.length !== 1 ? 's' : ''}</span>
                </h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {statusItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLATFORM_COLORS[item.platform] || 'bg-gray-700 text-gray-300'}`}>
                            {item.platform}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400">
                            {item.type}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs bg-indigo-900/60 text-indigo-300">
                            {item.account}
                          </span>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button onClick={() => openEdit(item)} className="text-gray-500 hover:text-blue-400 text-sm p-1">✏️</button>
                          <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-400 text-sm p-1">🗑️</button>
                        </div>
                      </div>
                      <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
                      {item.description && (
                        <p className="text-gray-400 text-xs leading-relaxed mb-2">{item.description}</p>
                      )}
                      {item.notes && (
                        <p className="text-gray-500 text-xs italic">{item.notes}</p>
                      )}
                      {item.date && (
                        <p className="text-gray-600 text-xs mt-2">{item.date}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">📝</p>
              <p>No content items yet. Add your first idea!</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">{editItem ? 'Edit Content Item' : 'Add Content Item'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                  placeholder="Content title..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Platform</label>
                  <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
                    {['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'All'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
                    {TYPES.map(t => <option key={t}>{t}</option>)}
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
                  <label className="block text-xs text-gray-400 mb-1">Account</label>
                  <select value={form.account} onChange={e => setForm({ ...form, account: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm">
                    {ACCOUNTS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="What is this content about..." />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Additional notes..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg">
                  {editItem ? 'Update' : 'Add'} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
