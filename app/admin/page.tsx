import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPanelClient from './AdminPanelClient'

export default async function AdminPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  // Fetch existing drivers
  const { data: drivers } = await supabase
    .from('profiles')
    .select('id, email, name, created_at')
    .eq('role', 'driver')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-50">
      <header className="bg-gradient-to-r from-sky-900 to-sky-700 text-white px-4 py-5 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚛</span>
            <div>
              <h1 className="text-xl font-bold">Trailer Inspection System</h1>
              <p className="text-sm opacity-80">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/reports"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg font-medium text-sm transition-colors"
            >
              📁 All Reports
            </a>
            <a
              href="/"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium text-sm transition-colors"
            >
              + New Report
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <AdminPanelClient drivers={drivers ?? []} />
      </main>
    </div>
  )
}
