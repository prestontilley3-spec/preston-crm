'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { TileJob } from '@/types'

const STAGES = ['All', 'lead', 'quoted', 'scheduled', 'in-progress', 'complete', 'closed']
const JOB_TYPES = ['floor', 'wall', 'shower', 'backsplash', 'outdoor', 'commercial', 'other']

function ScoreBadge({ score }: { score: number }) {
  const color = score <= 4 ? 'bg-red-900/60 text-red-400 border-red-700' :
                score <= 7 ? 'bg-yellow-900/60 text-yellow-400 border-yellow-700' :
                             'bg-green-900/60 text-green-400 border-green-700'
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${color}`}>
      {score}/10
    </span>
  )
}

export default function TileJobsPage() {
  const [jobs, setJobs] = useState<TileJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterStage, setFilterStage] = useState('All')
  const [form, setForm] = useState({
    client_name: '', client_phone: '', client_email: '',
    job_type: 'floor', description: '', estimated_value: '',
    stage: 'lead', score: '5', notes: '', job_date: '',
  })

  async function loadJobs() {
    setLoading(true)
    let query = supabase.from('tile_jobs').select('*').order('created_at', { ascending: false })
    if (filterStage !== 'All') query = query.eq('stage', filterStage)
    const { data } = await query
    setJobs(data || [])
    setLoading(false)
  }

  useEffect(() => { loadJobs() }, [filterStage])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('tile_jobs').insert([{
      ...form,
      id: crypto.randomUUID(),
      estimated_value: parseFloat(form.estimated_value) || 0,
      score: parseInt(form.score) || 5,
    }])
    setShowModal(false)
    setForm({ client_name: '', client_phone: '', client_email: '', job_type: 'floor', description: '', estimated_value: '', stage: 'lead', score: '5', notes: '', job_date: '' })
    loadJobs()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this job?')) return
    await supabase.from('tile_jobs').delete().eq('id', id)
    loadJobs()
  }

  async function updateStage(id: string, stage: string) {
    await supabase.from('tile_jobs').update({ stage }).eq('id', id)
    loadJobs()
  }

  const activeJobs = jobs.filter(j => j.stage !== 'closed')
  const pipelineValue = activeJobs.reduce((sum, j) => sum + (j.estimated_value || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tile Jobs</h1>
          <p className="text-gray-400 text-sm mt-1">{activeJobs.length} active · <span className="text-green-400 font-medium">${pipelineValue.toLocaleString()} pipeline</span></p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + New Job
        </button>
      </div>

      {/* Stage Filter */}
      <div className="flex gap-2 flex-wrap">
        {STAGES.map(s => (
          <button key={s} onClick={() => setFilterStage(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStage === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left px-4 py-3">Client</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Value</th>
              <th className="text-left px-4 py-3">Stage</th>
              <th className="text-left px-4 py-3">Score</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">No jobs found</td></tr>
            ) : jobs.map((job) => (
              <tr key={job.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-gray-200 font-medium">{job.client_name}</p>
                  <p className="text-gray-500 text-xs">{job.client_phone}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded text-xs">{job.job_type}</span>
                </td>
                <td className="px-4 py-3 text-green-400 font-medium">
                  ${(job.estimated_value || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={job.stage}
                    onChange={(e) => updateStage(job.id, e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1"
                  >
                    {['lead', 'quoted', 'scheduled', 'in-progress', 'complete', 'closed'].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <ScoreBadge score={job.score || 0} />
                </td>
                <td className="px-4 py-3 text-gray-400">{job.job_date}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(job.id)} className="text-red-500 hover:text-red-400 text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900">
              <h2 className="text-lg font-semibold text-white">New Tile Job</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Client Name</label>
                  <input type="text" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Phone</label>
                  <input type="text" value={form.client_phone} onChange={e => setForm({...form, client_phone: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Email</label>
                <input type="email" value={form.client_email} onChange={e => setForm({...form, client_email: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Job Type</label>
                  <select value={form.job_type} onChange={e => setForm({...form, job_type: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm">
                    {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Stage</label>
                  <select value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm">
                    {['lead', 'quoted', 'scheduled', 'in-progress', 'complete', 'closed'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Estimated Value ($)</label>
                  <input type="number" value={form.estimated_value} onChange={e => setForm({...form, estimated_value: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Score (1-10)</label>
                  <input type="number" min="1" max="10" value={form.score} onChange={e => setForm({...form, score: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Job Date</label>
                <input type="date" value={form.job_date} onChange={e => setForm({...form, job_date: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  rows={2} className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  rows={2} className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium">Save Job</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
