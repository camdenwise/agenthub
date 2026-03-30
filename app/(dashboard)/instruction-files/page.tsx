'use client'

import { createClient } from '@/lib/supabase'
import { useAdmin } from '@/lib/admin-context'
import { useEffect, useRef, useState } from 'react'

const TIPS = [
  'Business hours and holiday schedules',
  'All pricing and membership tiers',
  'Parking and directions',
  'Class schedules and descriptions',
  'Amenities and special features',
  'Trial offers and promotions',
  'Lead conversion CTAs and links',
  'Tone and personality guidelines',
  'FAQs from common questions',
]

const ACCEPT = '.pdf,.doc,.docx,.txt,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/** `datetime-local` value in the user's local timezone (YYYY-MM-DDTHH:mm). */
function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Parse a `datetime-local` string as local wall time → ISO for timestamptz. */
function fromDatetimeLocalValue(value: string) {
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return null
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}

function formatNoteDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

type TemporaryNote = {
  id: string
  business_id: string
  content: string
  starts_at: string
  expires_at: string
  created_at: string
}

type UploadedFile = {
  id: string
  name: string
  size: string
  date: string
  content: string | null
}

export default function InstructionFilesPage() {
  const { activeBusiness, loading: adminLoading } = useAdmin()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editorContent, setEditorContent] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [docId, setDocId] = useState<string | null>(null)

  const [notes, setNotes] = useState<TemporaryNote[]>([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [noteContent, setNoteContent] = useState('')
  const [noteStarts, setNoteStarts] = useState(() => toDatetimeLocalValue(new Date()))
  const [noteStartsTouched, setNoteStartsTouched] = useState(false)
  const [noteExpires, setNoteExpires] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const supabase = createClient()

  async function purgeExpiredNotesAndFetch(businessId: string) {
    const nowIso = new Date().toISOString()
    await supabase
      .from('temporary_notes')
      .delete()
      .eq('business_id', businessId)
      .lt('expires_at', nowIso)

    const { data } = await supabase
      .from('temporary_notes')
      .select('id, business_id, content, starts_at, expires_at, created_at')
      .eq('business_id', businessId)
      .gt('expires_at', nowIso)
      .order('expires_at', { ascending: true })

    setNotes((data as TemporaryNote[]) ?? [])
  }

  // Load instruction doc when activeBusiness changes
  useEffect(() => {
    async function load() {
      if (!activeBusiness) return
      setLoading(true)
      setEditorContent('')
      setDocId(null)

      const { data: doc } = await supabase
        .from('instruction_docs')
        .select('id, content')
        .eq('business_id', activeBusiness.id)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (doc) {
        setDocId(doc.id)
        setEditorContent(doc.content || '')
      }

      setLoading(false)
    }

    if (!adminLoading) load()
  }, [activeBusiness?.id, adminLoading])

  useEffect(() => {
    async function loadNotes() {
      if (!activeBusiness) {
        setNotes([])
        setNotesLoading(false)
        return
      }
      setNotesLoading(true)
      await purgeExpiredNotesAndFetch(activeBusiness.id)
      setNotesLoading(false)
    }

    if (!adminLoading) loadNotes()
  }, [activeBusiness?.id, adminLoading])

  useEffect(() => {
    if (activeBusiness?.id) {
      setNoteStarts(toDatetimeLocalValue(new Date()))
      setNoteStartsTouched(false)
      setNoteExpires('')
      setNoteContent('')
    }
  }, [activeBusiness?.id])

  async function handleSave() {
    if (!activeBusiness) return
    setSaving(true)

    if (docId) {
      await supabase
        .from('instruction_docs')
        .update({ content: editorContent })
        .eq('id', docId)
    } else {
      const { data: newDoc } = await supabase
        .from('instruction_docs')
        .insert({
          business_id: activeBusiness.id,
          content: editorContent,
          version: 1,
          is_active: true,
        })
        .select('id')
        .single()

      if (newDoc) setDocId(newDoc.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  function handleEditorChange(value: string) {
    setEditorContent(value)
    setSaved(false)

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(() => {
      if (activeBusiness) handleSave()
    }, 2000)
  }

  function handleFileSelect(fileList: FileList | null) {
    if (!fileList?.length) return
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    const readFile = (file: File): Promise<UploadedFile> => {
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const size = file.size < 1024 ? `${file.size} B` : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      const base = { id, name: file.name, size, date }
      if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve({ ...base, content: (reader.result as string) ?? '' })
          reader.onerror = () => resolve({ ...base, content: null })
          reader.readAsText(file)
        })
      }
      return Promise.resolve({ ...base, content: null })
    }

    Promise.all(Array.from(fileList).map(readFile)).then((newFiles) => {
      setFiles((prev) => [...prev, ...newFiles])
      const firstWithContent = newFiles.find((f) => f.content != null)
      if (firstWithContent?.content != null) {
        const newContent = editorContent
          ? editorContent + '\n\n' + firstWithContent.content
          : firstWithContent.content
        setEditorContent(newContent)
        if (activeBusiness) {
          setTimeout(() => handleSave(), 500)
        }
      }
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  async function handleAddTemporaryNote(e: React.FormEvent) {
    e.preventDefault()
    if (!activeBusiness || !noteExpires.trim()) return

    const expires = fromDatetimeLocalValue(noteExpires)
    if (!expires) return

    const now = new Date()
    const starts = noteStartsTouched ? fromDatetimeLocalValue(noteStarts) : null
    if (noteStartsTouched && !starts) return

    const hasFutureStart = Boolean(starts && starts.getTime() > now.getTime())
    const effectiveStartMs = hasFutureStart ? starts!.getTime() : now.getTime()
    if (expires.getTime() <= effectiveStartMs) {
      alert('End time must be after start time.')
      return
    }

    setAddingNote(true)
    const insertPayload: {
      business_id: string
      content: string
      expires_at: string
      starts_at?: string
    } = {
      business_id: activeBusiness.id,
      content: noteContent.trim(),
      expires_at: expires.toISOString(),
    }
    if (hasFutureStart) {
      insertPayload.starts_at = starts!.toISOString()
    }

    const { error } = await supabase.from('temporary_notes').insert(insertPayload)
    setAddingNote(false)

    if (error) {
      console.error(error)
      alert(error.message || 'Could not add note.')
      return
    }

    setNoteContent('')
    setNoteStarts(toDatetimeLocalValue(new Date()))
    setNoteStartsTouched(false)
    setNoteExpires('')
    await purgeExpiredNotesAndFetch(activeBusiness.id)
  }

  async function handleDeleteTemporaryNote(id: string) {
    if (!activeBusiness) return
    const { error } = await supabase.from('temporary_notes').delete().eq('id', id)
    if (error) {
      console.error(error)
      alert(error.message || 'Could not delete note.')
      return
    }
    await purgeExpiredNotesAndFetch(activeBusiness.id)
  }

  function noteStatus(note: TemporaryNote): 'active' | 'scheduled' {
    const now = Date.now()
    const start = new Date(note.starts_at).getTime()
    if (start > now) return 'scheduled'
    return 'active'
  }

  if (adminLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading instruction files...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row lg:gap-6">
      <div className="min-w-0 flex-1">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Instruction Files</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload files or edit directly. Your AI agents use these to answer questions.
          </p>
        </div>

        <input ref={fileInputRef} type="file" accept={ACCEPT} multiple className="hidden"
          onChange={(e) => { handleFileSelect(e.target.files); e.target.value = '' }} />
        <button type="button" onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          className={`mt-6 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 transition-colors ${
            isDragging ? 'border-indigo-400 bg-indigo-500/5' : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-slate-100/80'
          }`}>
          <svg className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          <p className="mt-3 text-sm font-medium text-slate-700">Drop files here or click to upload</p>
          <p className="mt-1 text-xs text-slate-500">PDF, DOC, TXT, or any text-based file.</p>
        </button>

        {files.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Uploaded files</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {files.map((file) => (
                <li key={file.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900">{file.name}</span>
                    <span className="text-xs text-slate-500">{file.size} · {file.date}</span>
                  </div>
                  <button type="button" onClick={() => removeFile(file.id)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Direct Editor</h2>
            <div className="flex items-center gap-3">
              {saving && <span className="text-xs text-slate-400">Saving...</span>}
              {saved && !saving && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </span>
              )}
              {editorContent.trim().length > 0 && !saving && !saved && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Live</span>
              )}
              <button type="button" onClick={handleSave} disabled={saving}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Now'}
              </button>
            </div>
          </div>
          <div className="p-4">
            <textarea value={editorContent} onChange={(e) => handleEditorChange(e.target.value)}
              placeholder="Paste or type instruction content here. Your AI agents use this to answer questions."
              className="min-h-[320px] max-h-[60vh] w-full resize-y overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              spellCheck={false} rows={16} />
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Temporary Notes</h2>
            <p className="mt-1 text-sm text-slate-500">
              Add time-limited info your AI will use automatically. Expired notes are removed automatically.
            </p>
          </div>

          <form onSubmit={handleAddTemporaryNote} className="border-b border-slate-100 px-5 py-4 space-y-4">
            <div>
              <label htmlFor="temp-note-content" className="block text-xs font-medium text-slate-600">Note</label>
              <textarea
                id="temp-note-content"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="e.g., We are closed this Saturday and Sunday due to weather"
                rows={3}
                className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="temp-note-starts" className="block text-xs font-medium text-slate-600">Starts</label>
                <input
                  id="temp-note-starts"
                  type="datetime-local"
                  value={noteStarts}
                  onChange={(e) => {
                    setNoteStartsTouched(true)
                    setNoteStarts(e.target.value)
                  }}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="temp-note-expires" className="block text-xs font-medium text-slate-600">
                  Expires <span className="text-red-500">*</span>
                </label>
                <input
                  id="temp-note-expires"
                  type="datetime-local"
                  value={noteExpires}
                  onChange={(e) => setNoteExpires(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={addingNote || !noteExpires.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {addingNote ? 'Adding…' : 'Add Note'}
            </button>
          </form>

          <div className="px-5 py-4">
            {notesLoading ? (
              <p className="text-sm text-slate-500">Loading notes…</p>
            ) : notes.length === 0 ? (
              <p className="text-sm text-slate-500">No temporary notes yet. Add one above.</p>
            ) : (
              <ul className="space-y-3">
                {notes.map((note) => {
                  const status = noteStatus(note)
                  return (
                    <li
                      key={note.id}
                      className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-wrap text-sm text-slate-900">{note.content}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {status === 'active' ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">Active</span>
                          ) : (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800">Scheduled</span>
                          )}
                          <span>
                            {formatNoteDateTime(note.starts_at)} → {formatNoteDateTime(note.expires_at)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemporaryNote(note.id)}
                        className="shrink-0 self-start rounded-lg p-2 text-slate-400 hover:bg-slate-200/80 hover:text-slate-700"
                        aria-label="Delete note"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <aside className="mt-6 w-full shrink-0 space-y-4 lg:mt-8 lg:w-[300px]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">What to Include</h3>
          <ul className="mt-3 space-y-2">
            {TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-sm text-slate-700">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {tip}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-indigo-200/80 bg-indigo-500/5 p-5">
          <h3 className="font-semibold text-slate-900">Test your changes live</h3>
          <p className="mt-2 text-sm text-slate-600">
            Edit content here, then go to Messages and send a test message. The AI uses your latest saved content immediately.
          </p>
        </div>
      </aside>
    </div>
  )
}