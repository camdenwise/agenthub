'use client'

import { useRef, useState } from 'react'

const MOCK_INITIAL_CONTENT = `Business name: Iron Temple Gym
Location: 4521 Trade Street, Charlotte, NC 28203
Website: www.irontemple.com

HOURS:
Monday–Friday: 5:00 AM – 10:00 PM
Saturday: 6:00 AM – 8:00 PM
Sunday: 6:00 AM – 8:00 PM

MEMBERSHIP OPTIONS:
• Day Pass: $15
• Monthly: $55/month
• Annual: $550/year (save $110)
• Student Rate: $45/month (valid ID required)
• Family Plan: $95/month (2 adults + up to 2 kids)

All memberships include full gym access, locker rooms, and free WiFi.

CLASSES (Included with membership):
`

type UploadedFile = {
  id: string
  name: string
  size: string
  date: string
  content: string | null
}

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

export default function InstructionFilesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editorContent, setEditorContent] = useState(MOCK_INITIAL_CONTENT)
  const [activeFileId, setActiveFileId] = useState<string | null>('mock-1')
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: 'mock-1',
      name: 'business-info.txt',
      size: '4.2 KB',
      date: 'Mar 1 2024',
      content: MOCK_INITIAL_CONTENT,
    },
  ])
  const [isDragging, setIsDragging] = useState(false)

  function handleFileSelect(fileList: FileList | null) {
    if (!fileList?.length) return
    const date = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const readFile = (file: File): Promise<UploadedFile> => {
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const size =
        file.size < 1024
          ? `${file.size} B`
          : file.size < 1024 * 1024
            ? `${(file.size / 1024).toFixed(1)} KB`
            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      const base = { id, name: file.name, size, date }
      if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve({ ...base, content: (reader.result as string) ?? '' })
          }
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
        setEditorContent(firstWithContent.content)
        setActiveFileId(firstWithContent.id)
      }
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function openFileDialog() {
    fileInputRef.current?.click()
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    if (activeFileId === id) {
      setActiveFileId(null)
      setEditorContent('')
    }
  }

  function selectFile(file: UploadedFile) {
    setActiveFileId(file.id)
    if (file.content != null) {
      setEditorContent(file.content)
    } else {
      setEditorContent(
        `[Preview not available for ${file.name}. Upload a .txt or text-based file to view and edit content here.]`
      )
    }
  }

  const hasLiveContent = editorContent.trim().length > 0

  function handleEditorChange(value: string) {
    setEditorContent(value)
    if (activeFileId) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFileId ? { ...f, content: value } : f
        )
      )
    }
  }

  return (
    <div className="flex flex-col lg:flex-row lg:gap-6">
      <div className="min-w-0 flex-1">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Instruction Files
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload files or edit directly. Your AI agents use these to answer
            questions.
          </p>
        </div>

        {/* Upload zone */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            handleFileSelect(e.target.files)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={openFileDialog}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mt-6 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 transition-colors ${
            isDragging
              ? 'border-indigo-400 bg-indigo-500/5'
              : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-slate-100/80'
          }`}
        >
          <svg
            className="h-12 w-12 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="mt-3 text-sm font-medium text-slate-700">
            Drop files here or click to upload
          </p>
          <p className="mt-1 text-xs text-slate-500">
            PDF, DOC, TXT, or any text-based file.
          </p>
        </button>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Uploaded files
              </h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {files.map((file) => (
                <li key={file.id}>
                  <div className="flex items-center gap-3 px-5 py-3">
                    <button
                      type="button"
                      onClick={() => selectFile(file)}
                      className="min-w-0 flex-1 text-left hover:opacity-80"
                    >
                      <span className="block truncate font-medium text-slate-900">
                        {file.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {file.size} · {file.date}
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      {activeFileId === file.id ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                          Active
                        </span>
                      ) : file.content != null ? (
                        <span className="text-xs text-slate-400">
                          Click to view
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(file.id)
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label={`Remove ${file.name}`}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Direct Editor */}
        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Direct Editor</h2>
            {hasLiveContent && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Live
              </span>
            )}
          </div>
          <div className="p-4">
            <textarea
              value={editorContent}
              onChange={(e) => handleEditorChange(e.target.value)}
              placeholder="Paste or type instruction content here. Your AI agents use this to answer questions."
              className="min-h-[320px] max-h-[60vh] w-full resize-y overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              spellCheck={false}
              rows={16}
            />
          </div>
        </div>
      </div>

      {/* Tips panel */}
      <aside className="mt-6 w-full shrink-0 space-y-4 lg:mt-8 lg:w-[300px]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">What to Include</h3>
          <ul className="mt-3 space-y-2">
            {TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-sm text-slate-700">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
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
            Edit or upload files here, then go to Messages and send a test
            message. The AI uses your latest content immediately.
          </p>
        </div>
      </aside>
    </div>
  )
}
