'use client'

import { useState } from 'react'

interface Driver {
  id: string
  email: string
  name: string
  created_at: string
}

interface Props {
  drivers: Driver[]
}

export default function AdminPanelClient({ drivers: initialDrivers }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Failed to create driver account.' })
        return
      }

      setMessage({ type: 'success', text: `Account created for ${name} (${email})` })
      setDrivers(prev => [
        { id: data.id, email, name, created_at: new Date().toISOString() },
        ...prev,
      ])
      setName('')
      setEmail('')
      setPassword('')
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Create Driver Account */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Driver Account</h2>
        <form onSubmit={handleCreateDriver} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., John Smith"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="driver@email.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Password
              <span className="text-gray-400 font-normal ml-2">(tell the driver this in person)</span>
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none text-lg font-mono"
            />
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg font-medium ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 text-lg font-bold bg-sky-700 hover:bg-sky-800 text-white rounded-xl disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating Account...' : 'Create Driver Account'}
          </button>
        </form>
      </div>

      {/* Driver List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Driver Accounts</h2>
          <p className="text-gray-500 mt-1">
            {drivers.length} driver{drivers.length !== 1 ? 's' : ''} registered
          </p>
        </div>

        {drivers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No driver accounts yet. Create one above.
          </div>
        ) : (
          <div className="divide-y">
            {drivers.map((driver) => (
              <div key={driver.id} className="p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{driver.name}</p>
                  <p className="text-gray-500 text-sm">{driver.email}</p>
                </div>
                <div className="text-right text-sm text-gray-400">
                  Added {formatDate(driver.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
