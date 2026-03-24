import { supabase } from '@/lib/supabase'

async function getDashboardData() {
  const [tasksRes, jobsRes, interactionsRes] = await Promise.all([
    supabase.from('tasks').select('*').eq('status', 'open'),
    supabase.from('tile_jobs').select('*').neq('stage', 'closed'),
    supabase.from('interactions').select('*').order('date', { ascending: false }).limit(5),
  ])

  const openTasks = tasksRes.data || []
  const activeJobs = jobsRes.data || []
  const recentInteractions = interactionsRes.data || []

  const pipelineValue = activeJobs.reduce((sum: number, job: { estimated_value?: number }) => sum + (job.estimated_value || 0), 0)
  const followUps = openTasks.filter((t: { category?: string; priority?: string }) => t.category === 'follow-up' || t.priority === 'high')

  return { openTasks, activeJobs, recentInteractions, pipelineValue, followUps }
}

export default async function Dashboard() {
  const { openTasks, activeJobs, recentInteractions, pipelineValue, followUps } = await getDashboardData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Overview of your CRM</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Open Tasks</span>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-white">{openTasks.length}</p>
          <p className="text-xs text-gray-500 mt-1">Needs attention</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Active Tile Jobs</span>
            <span className="text-2xl">🏗️</span>
          </div>
          <p className="text-3xl font-bold text-white">{activeJobs.length}</p>
          <p className="text-xs text-gray-500 mt-1">In pipeline</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Pipeline Value</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-green-400">${pipelineValue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Estimated total</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Follow-ups Needed</span>
            <span className="text-2xl">🔔</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{followUps.length}</p>
          <p className="text-xs text-gray-500 mt-1">High priority</p>
        </div>
      </div>

      {/* Recent Interactions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Interactions</h2>
        {recentInteractions.length === 0 ? (
          <p className="text-gray-500 text-sm">No interactions yet. <a href="/interactions" className="text-blue-400 hover:underline">Add one →</a></p>
        ) : (
          <div className="space-y-3">
            {recentInteractions.map((interaction: { id: string; date?: string; category?: string; summary?: string; status?: string }) => (
              <div key={interaction.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-200">{interaction.summary}</p>
                  <p className="text-xs text-gray-500">{interaction.date} · {interaction.category}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  interaction.status === 'complete' ? 'bg-green-900/50 text-green-400' :
                  interaction.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                  'bg-gray-800 text-gray-400'
                }`}>{interaction.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/interactions', label: 'Log Interaction', icon: '💬' },
          { href: '/tile-jobs', label: 'Add Tile Job', icon: '🏗️' },
          { href: '/contacts', label: 'Add Contact', icon: '👥' },
          { href: '/tasks', label: 'Add Task', icon: '✅' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="bg-gray-900 border border-gray-800 hover:border-blue-600 rounded-xl p-4 text-center transition-all group"
          >
            <div className="text-2xl mb-2">{link.icon}</div>
            <p className="text-xs text-gray-400 group-hover:text-blue-400 transition-colors">{link.label}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
