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

const INTEGRATIONS = [
  {
    name: 'GitHub',
    icon: '🐙',
    status: 'connected' as const,
    detail: 'prestontilley3-spec',
    description: 'Code repository',
  },
  {
    name: 'Supabase',
    icon: '🗄️',
    status: 'connected' as const,
    detail: 'roghzufimqhiphqpmlhu',
    description: 'Database',
  },
  {
    name: 'Vercel',
    icon: '▲',
    status: 'connected' as const,
    detail: 'prestontilley3-6699',
    description: 'Hosting & deployment',
  },
  {
    name: 'Cloudflare',
    icon: '🌐',
    status: 'connected' as const,
    detail: 'DNS & CDN',
    description: 'CDN & domain',
  },
  {
    name: 'Vizard',
    icon: '🎬',
    status: 'connected' as const,
    detail: 'Video AI',
    description: 'Video repurposing',
  },
  {
    name: 'OpenAI',
    icon: '🤖',
    status: 'connected' as const,
    detail: 'GPT-4o',
    description: 'AI (GPT models)',
  },
  {
    name: 'Google Gemini',
    icon: '✨',
    status: 'connected' as const,
    detail: 'Gemini 1.5',
    description: 'AI (Gemini models)',
  },
  {
    name: 'Anthropic',
    icon: '🧠',
    status: 'connected' as const,
    detail: 'Connected',
    description: 'AI (Claude models)',
  },
  {
    name: 'Google Calendar',
    icon: '📅',
    status: 'connected' as const,
    detail: 'iCal synced',
    description: 'Calendar access',
  },
  {
    name: 'GoHighLevel',
    icon: '📊',
    status: 'connected' as const,
    detail: 'CRM platform',
    description: 'CRM & automations',
  },
  {
    name: 'Brave Search',
    icon: '🔍',
    status: 'connected' as const,
    detail: 'Search API',
    description: 'Web search',
  },
  {
    name: 'ElevenLabs',
    icon: '🎙️',
    status: 'connected' as const,
    detail: 'Connected',
    description: 'AI voice & text-to-speech',
  },
]

const statusConfig = {
  connected: { label: 'Connected', className: 'bg-green-900/50 text-green-400 border-green-800' },
  warning: { label: 'Low Credits', className: 'bg-yellow-900/50 text-yellow-400 border-yellow-800' },
  disconnected: { label: 'Disconnected', className: 'bg-red-900/50 text-red-400 border-red-800' },
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

      {/* Connected Integrations */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Connected Integrations</h2>
            <p className="text-xs text-gray-500 mt-0.5">All APIs and services connected to Preston AI</p>
          </div>
          <span className="text-xs text-gray-500">
            {INTEGRATIONS.filter((i) => i.status === 'connected').length}/{INTEGRATIONS.length} active
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {INTEGRATIONS.map((integration) => {
            const cfg = statusConfig[integration.status]
            return (
              <div
                key={integration.name}
                className="flex items-start gap-3 bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all"
              >
                <div className="text-2xl flex-shrink-0 mt-0.5">{integration.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{integration.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{integration.description}</p>
                  <p className="text-xs text-gray-600 truncate mt-0.5">{integration.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
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
