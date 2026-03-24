'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/types'

const CATEGORIES = ['All', 'client', 'prospect', 'vendor', 'partner', 'personal', 'other']

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [filterCategory, setFilterCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '', phone: '', email: '', category: 'client', company: '', notes: '', last_contact: '',
  })

  async function loadContacts() {
    setLoading(true)
    let query = supabase.from('contacts').select('*').order('name')
    if (filterCategory !== 'All') query = query.eq('category', filterCategory)
    const { data } = await query
    setContacts(data || [])
    setLoading(false)
  }

  useEffect(() => { loadContacts() }, [filterCategory])

  function openAdd() {
    setEditContact(null)
    setForm({ name: '', phone: '', email: '', category: 'client', company: '', notes: '', last_contact: '' })
    setShowModal(true)
  }

  function openEdit(c: Contact) {
    setEditContact(c)
    setForm({ name: c.name, phone: c.phone, email: c.email, category: c.category, company: c.company, notes: c.notes, last_contact: c.last_contact })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editContact) {
      await supabase.from('contacts').update(form).eq('id', editContact.id)
    } else {
      await supabase.from('contacts').insert([{ ...form, id: crypto.randomUUID() }])
    }
    setShowModal(false)
    loadContacts()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact?')) return
    await supabase.from('contacts').delete().eq('id', id)
    loadContacts()
  }

  const filtered = contacts.filter(c =>
    search === '' || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-gray-400 text-sm mt-1">{contacts.length} total</p>
        </div>
        <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Search</label>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Name, company, email..."
            className="bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 w-56" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Category</label>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Company</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Last Contact</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">No contacts found</td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-200 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-400">{c.company}</td>
                <td className="px-4 py-3 text-gray-400">{c.phone}</td>
                <td className="px-4 py-3 text-gray-400">{c.email}</td>
                <td className="px-4 py-3">
                  <span className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded text-xs">{c.category}</span>
                </td>
                <td className="px-4 py-3 text-gray-400">{c.last_contact}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(c)} className="text-blue-400 hover:text-blue-300 text-xs">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-400 text-xs">Delete</button>
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
              <h2 className="text-lg font-semibold text-white">{editContact ? 'Edit Contact' : 'Add Contact'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Company</label>
                  <input type="text" value={form.company} onChange={e => setForm({...form, company: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Phone</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm">
                    {['client', 'prospect', 'vendor', 'partner', 'personal', 'other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Last Contact</label>
                  <input type="date" value={form.last_contact} onChange={e => setForm({...form, last_contact: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  rows={3} className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium">
                  {editContact ? 'Update Contact' : 'Add Contact'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
