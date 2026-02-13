import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
    .select('id, unit_number, report_date, location, inspector_name, pdf_url, created_at')
    .order('created_at', { ascending: false })

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
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {isAdmin ? 'All Inspection Reports' : 'My Inspection Reports'}
            </h2>
            <p className="text-gray-500 mt-1">
              {reportsWithUrls.length} report{reportsWithUrls.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {reportsWithUrls.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-6xl">📋</span>
              <h3 className="text-xl font-semibold text-gray-700 mt-4">No reports yet</h3>
              <p className="text-gray-500 mt-2">Submit your first inspection report to see it here.</p>
              <a
                href="/"
                className="mt-6 inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
              >
                + Create Report
              </a>
            </div>
          ) : (
            <div className="divide-y">
              {reportsWithUrls.map((report) => (
                <div
                  key={report.id}
                  className="p-5 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-lg font-bold text-sky-900">
                        {report.unit_number || 'Unknown Unit'}
                      </span>
                      <span className="text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-0.5">
                        {formatDate(report.report_date)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-3">
                      {report.location && <span>📍 {report.location}</span>}
                      {report.inspector_name && <span>👤 {report.inspector_name}</span>}
                      <span className="text-gray-400">
                        Submitted {formatDate(report.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {report.signedUrl ? (
                      <a
                        href={report.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold text-sm transition-colors"
                      >
                        📄 Download PDF
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">PDF not available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
