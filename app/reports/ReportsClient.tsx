'use client'

import { useState, useMemo } from 'react'

type Report = {
  id: string
  unit_number: string
  report_date: string
  location: string | null
  inspector_name: string | null
  pdf_url: string | null
  created_at: string
  signedUrl: string | null
  user_id: string
}

type Driver = {
  id: string
  name: string
  email: string
}

type Props = {
  reports: Report[]
  drivers: Driver[]
  isAdmin: boolean
  currentUserName: string
}

export default function ReportsClient({ reports, drivers, isAdmin, currentUserName }: Props) {
  const [filterDriver, setFilterDriver] = useState<string>('all')
  const [filterUnitNumber, setFilterUnitNumber] = useState<string>('')
  const [filterLocation, setFilterLocation] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')

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

  // Filter reports based on selected filters
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Driver filter
      if (filterDriver !== 'all' && report.user_id !== filterDriver) {
        return false
      }

      // Unit number filter (case-insensitive partial match)
      if (filterUnitNumber && !report.unit_number?.toLowerCase().includes(filterUnitNumber.toLowerCase())) {
        return false
      }

      // Location filter (case-insensitive partial match)
      if (filterLocation && !report.location?.toLowerCase().includes(filterLocation.toLowerCase())) {
        return false
      }

      // Date range filter
      if (filterDateFrom) {
        const reportDate = new Date(report.report_date)
        const fromDate = new Date(filterDateFrom)
        if (reportDate < fromDate) return false
      }

      if (filterDateTo) {
        const reportDate = new Date(report.report_date)
        const toDate = new Date(filterDateTo)
        if (reportDate > toDate) return false
      }

      return true
    })
  }, [reports, filterDriver, filterUnitNumber, filterLocation, filterDateFrom, filterDateTo])

  const clearFilters = () => {
    setFilterDriver('all')
    setFilterUnitNumber('')
    setFilterLocation('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  const hasActiveFilters = filterDriver !== 'all' || filterUnitNumber || filterLocation || filterDateFrom || filterDateTo

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          {isAdmin ? 'All Inspection Reports' : 'My Inspection Reports'}
        </h2>
        <p className="text-gray-500 mt-1">
          {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''} found
          {hasActiveFilters && ` (filtered from ${reports.length} total)`}
        </p>
      </div>

      {/* Filters - Only show for admins */}
      {isAdmin && (
        <div className="p-6 bg-gray-50 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-sky-700 hover:text-sky-900 font-medium"
              >
                ✕ Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Driver filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Driver
              </label>
              <select
                value={filterDriver}
                onChange={(e) => setFilterDriver(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none"
              >
                <option value="all">All Drivers</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit number filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Unit Number
              </label>
              <input
                type="text"
                placeholder="e.g. FS6257"
                value={filterUnitNumber}
                onChange={(e) => setFilterUnitNumber(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Location filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Tallinn"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Date from filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Date From
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Date to filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Date To
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reports list */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center">
          <span className="text-6xl">📋</span>
          <h3 className="text-xl font-semibold text-gray-700 mt-4">
            {hasActiveFilters ? 'No reports match your filters' : 'No reports yet'}
          </h3>
          <p className="text-gray-500 mt-2">
            {hasActiveFilters
              ? 'Try adjusting your filter criteria.'
              : 'Submit your first inspection report to see it here.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="mt-6 inline-block px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition-colors"
            >
              Clear Filters
            </button>
          ) : (
            <a
              href="/"
              className="mt-6 inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
            >
              + Create Report
            </a>
          )}
        </div>
      ) : (
        <div className="divide-y">
          {filteredReports.map((report) => (
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
  )
}
