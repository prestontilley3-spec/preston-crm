'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/interactions', label: 'Interactions', icon: '💬' },
  { href: '/tile-jobs', label: 'Tile Jobs', icon: '🏗️' },
  { href: '/contacts', label: 'Contacts', icon: '👥' },
  { href: '/tasks', label: 'Tasks', icon: '✅' },
  { href: '/memory', label: 'Memory', icon: '🧠' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-50">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-blue-400">Preston CRM</h1>
        <p className="text-xs text-gray-500 mt-1">Personal Dashboard</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">Preston Tilley © 2026</p>
      </div>
    </aside>
  )
}
