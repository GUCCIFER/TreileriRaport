import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const fd = await request.formData()
  const formDataRaw = fd.get('formData') as string
  const pdfFile = fd.get('pdf') as File

  if (!formDataRaw || !pdfFile) {
    return NextResponse.json({ error: 'Missing form data or PDF' }, { status: 400 })
  }

  const formData = JSON.parse(formDataRaw)

  // Upload PDF to Supabase Storage
  const timestamp = Date.now()
  const safeName = (formData.unitNumber || 'report').replace(/[^a-zA-Z0-9-_]/g, '_')
  const safeDate = (formData.reportDate || 'unknown').replace(/[^a-zA-Z0-9-]/g, '-')
  const fileName = `${user.id}/${timestamp}-${safeName}-${safeDate}.pdf`

  const pdfBuffer = await pdfFile.arrayBuffer()

  const { error: storageError } = await supabase.storage
    .from('reports')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (storageError) {
    console.error('Storage error:', storageError)
    return NextResponse.json({ error: 'Storage upload failed' }, { status: 500 })
  }

  // Insert report record into DB
  const { data: report, error: dbError } = await supabase
    .from('reports')
    .insert({
      user_id: user.id,
      unit_number: formData.unitNumber || '',
      report_date: formData.reportDate || new Date().toISOString().split('T')[0],
      location: formData.location || null,
      inspector_name: formData.inspector || null,
      pdf_url: fileName,
      form_data: formData,
    })
    .select()
    .single()

  if (dbError) {
    console.error('DB error:', dbError)
    return NextResponse.json({ error: 'Database insert failed' }, { status: 500 })
  }

  return NextResponse.json({ id: report.id })
}
