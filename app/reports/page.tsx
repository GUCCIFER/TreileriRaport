import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
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

  const isAdmin = profile?.role === 'admin'

  // RLS handles scoping automatically: drivers see own, admins see all
  const { data: reports } = await supabase
    .from('reports')
    .select('id, user_id, unit_number, report_date, location, inspector_name, pdf_url, created_at')
    .order('created_at', { ascending: false })

  // Fetch all drivers (for admin filter dropdown)
  const { data: drivers } = isAdmin
    ? await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'driver')
        .order('name', { ascending: true })
    : { data: [] }

  // Generate signed URLs for each PDF (1-hour expiry)
  const reportsWithUrls = await Promise.all(
    (reports ?? []).map(async (report) => {
      if (!report.pdf_url) return { ...report, signedUrl: null }
      const { data } = await supabase.storage
        .from('reports')
        .createSignedUrl(report.pdf_url, 3600)
      return { ...report, signedUrl: data?.signedUrl ?? null }
    })
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-sky-50">
      <header className="bg-gradient-to-r from-sky-900 to-sky-700 text-white px-4 py-5 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚛</span>
            <div>
              <h1 className="text-xl font-bold">Trailer Inspection System</h1>
              <p className="text-sm opacity-80">
                {isAdmin ? 'All Reports' : `Reports for ${profile?.name ?? user.email}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium text-sm transition-colors"
            >
              + New Report
            </a>
            {isAdmin && (
              <a
                href="/admin"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg font-medium text-sm transition-colors"
              >
                ⚙️ Admin
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <ReportsClient
          reports={reportsWithUrls}
          drivers={drivers ?? []}
          isAdmin={isAdmin}
          currentUserName={profile?.name ?? user.email ?? 'Unknown User'}
        />
      </main>
    </div>
  )
}
