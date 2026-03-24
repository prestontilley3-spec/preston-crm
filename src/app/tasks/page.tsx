'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/types'

const PRIORITIES = ['All', 'high', 'medium', 'low']
const STATUSES_FILTER = ['All', 'open', 'in-progress', 'done']

const priorityColor: Record<string, string> = {
  high: 'bg-red-900/40 text-red-400 border-red-800',
  medium: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  low: 'bg-gray-800 text-gray-400 border-gray-700',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterPriority, setFilterPriority] = useState('All')
  const [filterStatus, setFilterStatus] = useState('open')
  const [form, setForm] = useState({
    title: '', description: '', due_date: '', priority: 'medium', status: 'open', category: '',
  })

  async function loadTasks() {
    setLoading(true)
    let query = supabase.from('tasks').select('*').order('due_date', { ascending: true })
    if (filterPriority !== 'All') query = query.eq('priority', filterPriority)
    if (filterStatus !== 'All') query = query.eq('status', filterStatus)
    const { data } = await query
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => { loadTasks() }, [filterPriority, filterStatus])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('tasks').insert([{ ...form, id: crypto.randomUUID() }])
    setShowModal(false)
    setForm({ title: '', description: '', due_date: '', priority: 'medium', status: 'open', category: '' })
    loadTasks()
  }

  async function toggleDone(task: Task) {
    const newStatus = task.status === 'done' ? 'open' : 'done'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    loadTasks()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    loadTasks()
  }

  const grouped = {
    high: tasks.filter(t => t.priority === 'high'),
    medium: tasks.filter(t => t.priority === 'medium'),
    low: tasks.filter(t => t.priority === 'low'),
  }

  const isOverdue = (due: string) => due && new Date(due) < new Date() && true

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-gray-400 text-sm mt-1">{tasks.filter(t => t.status !== 'done').length} open</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Priority</label>
          <div className="flex gap-1">
            {PRIORITIES.map(p => (
              <button key={p} onClick={() => setFilterPriority(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterPriority === p ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>{p}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Status</label>
          <div className="flex gap-1">
            {STATUSES_FILTER.map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No tasks found. <button onClick={() => setShowModal(true)} className="text-blue-400 hover:underline">Add one →</button></div>
      ) : (
        <div className="space-y-6">
          {(['high', 'medium', 'low'] as const).map(priority => {
            const items = grouped[priority]
            if (items.length === 0) return null
            return (
              <div key={priority}>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${priority === 'high' ? 'bg-red-500' : priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'}`}></span>
                  {priority} priority ({items.length})
                </h2>
                <div className="space-y-2">
                  {items.map(task => (
                    <div key={task.id} className={`bg-gray-900 border rounded-xl p-4 flex items-start gap-3 transition-all ${
                      task.status === 'done' ? 'border-gray-800 opacity-60' : 'border-gray-800 hover:border-gray-700'
                    }`}>
                      <button
                        onClick={() => toggleDone(task)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          task.status === 'done' ? 'bg-green-600 border-green-600' : 'border-gray-600 hover:border-blue-500'
                        }`}
                      >
                        {task.status === 'done' && <span className="text-white text-xs">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                            {task.title}
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${priorityColor[task.priority] || priorityColor.low}`}>
                            {task.priority}
                          </span>
                          {task.category && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{task.category}</span>
                          )}
                          {task.due_date && isOverdue(task.due_date) && task.status !== 'done' && (
                            <span className="text-xs text-red-400">⚠ Overdue</span>
                          )}
                        </div>
                        {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
                        {task.due_date && <p className="text-xs text-gray-600 mt-1">Due: {task.due_date}</p>}
                      </div>
                      <button onClick={() => handleDelete(task.id)} className="text-red-500 hover:text-red-400 text-xs flex-shrink-0">Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Add Task</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="What needs to be done?" className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  rows={2} className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm">
                    {['high', 'medium', 'low'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Category</label>
                <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  placeholder="e.g. follow-up, admin, site-visit" className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium">Add Task</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
