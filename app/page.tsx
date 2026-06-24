'use client'

import { useCallback, useEffect, useState } from 'react'

interface Address {
  id: number
  name: string
  company_name?: string | null
  phone_country_code: string
  phone_number: string
  address_line1: string
  address_line2?: string | null
  city: string
  state?: string | null
  postal_code?: string | null
  country?: string | null
  created_at: string
}

type FormData = Omit<Address, 'id' | 'created_at'>

const EMPTY_FORM: FormData = {
  name: '',
  company_name: '',
  phone_country_code: '+91',
  phone_number: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India'
}

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+65', label: '🇸🇬 +65' },
  { code: '+61', label: '🇦🇺 +61' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+33', label: '🇫🇷 +33' },
  { code: '+86', label: '🇨🇳 +86' },
  { code: '+81', label: '🇯🇵 +81' }
]

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function avatarColor(name: string): string {
  const palette = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
    'linear-gradient(135deg,#a18cd1,#fbc2eb)',
    'linear-gradient(135deg,#fccb90,#d57eeb)',
    'linear-gradient(135deg,#84fab0,#8fd3f4)'
  ]
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return palette[Math.abs(h) % palette.length]
}

function printEnvelope(address: Address) {
  const title = esc(address.company_name || address.city || 'Envelope')

  // Sender lines — skip any empty field, no blank gaps; phone is first
  const rows: Array<{ text: string; bold?: boolean }> = []

  const phone = [
    address.phone_country_code?.trim(),
    address.phone_number?.trim()
  ]
    .filter(Boolean)
    .join(' ')
  if (phone) rows.push({ text: esc(phone) })

  if (address.company_name?.trim())
    rows.push({ text: esc(address.company_name), bold: true })

  if (address.address_line1?.trim())
    rows.push({ text: esc(address.address_line1) })
  if (address.address_line2?.trim())
    rows.push({ text: esc(address.address_line2) })

  // city, state postalCode  (no comma before postal)
  if (address.city?.trim()) {
    let cl = esc(address.city)
    if (address.state?.trim()) cl += ', ' + esc(address.state)
    if (address.postal_code?.trim()) cl += ' ' + esc(address.postal_code)
    rows.push({ text: cl })
  }

  if (address.country?.trim()) rows.push({ text: esc(address.country) })

  const linesHtml = rows
    .map((r, i) => {
      const cls = r.bold ? 'ln-co' : i === 0 ? 'ln-phone' : 'ln'
      return `<div class="${cls}">${r.text}</div>`
    })
    .join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Envelope — ${title}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    @page { size: 10in 4.5in; margin: 0; }
    html, body { width:10in; height:4.5in; overflow:hidden; }

    /* Envelope canvas */
    .envelope {
      width:10in; height:4.5in; position:relative; background:white;
      display:flex; align-items:stretch; justify-content:flex-end;
    }

    /* Sender block — right side, text left-aligned */
    .sender {
      width:3.2in;
      display:flex; flex-direction:column;
      align-items:flex-start; justify-content:center;
      padding:0.25in 0.3in;
      text-align:left;
      font-family:Arial,Helvetica,sans-serif;
    }

    .ln-co {
      font-size:16pt; font-weight:700; color:#000;
      line-height:1.5;
    }
    .ln {
      font-size:16pt; font-weight:400; color:#000;
      line-height:1.5; width:100%;
    }
    .ln-phone {
      font-size:16pt; font-weight:400; color:#000;
      line-height:1.5; width:100%; text-align:center;
    }

    @media screen {
      body {
        background:#d1d9e6; display:flex; flex-direction:column;
        align-items:center; justify-content:center;
        min-height:100vh; gap:16px; font-family:Arial,sans-serif;
      }
      .envelope { background:#fffef8; box-shadow:0 10px 40px rgba(0,0,0,0.25); }
      .divider {
        position:absolute; left:6.7in; top:0.15in; bottom:0.15in;
        border-left:1.5px dashed #b8c4d4; pointer-events:none;
      }
      .toolbar { display:flex; align-items:center; gap:10px; }
      .btn-print {
        background:#16a34a; color:#fff; border:none;
        padding:11px 32px; border-radius:8px; font-size:14px;
        font-weight:700; cursor:pointer; box-shadow:0 2px 8px rgba(22,163,74,0.35);
      }
      .btn-print:hover { background:#15803d; }
      .btn-close {
        background:#fff; color:#374151; border:1px solid #d1d5db;
        padding:11px 22px; border-radius:8px; font-size:14px; cursor:pointer;
      }
      .btn-close:hover { background:#f3f4f6; }
      .hint { color:#6b7280; font-size:12px; text-align:center; max-width:820px; }
      .hint-warn {
        background:#fef3c7; border:1px solid #f59e0b; color:#92400e;
        padding:8px 18px; border-radius:8px; font-size:13px; font-weight:500;
      }
    }

    @media print {
      .toolbar, .hint, .divider { display:none !important; }
      body { background:white; display:block; margin:0; }
      .envelope { display:flex; }
      .sender { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn-print" onclick="window.print()">&#128424;&nbsp; Print Envelope</button>
    <button class="btn-close" onclick="window.close()">Close</button>
  </div>
  <div class="envelope">
    <div class="divider"></div>
    <div class="sender">${linesHtml}</div>
  </div>
  <div class="hint">
    <div class="hint-warn">
      &#9888;&nbsp; Before printing &rarr; <strong>More settings</strong>: Margins&nbsp;<strong>None</strong>, disable <strong>Headers &amp; footers</strong>, Scale&nbsp;<strong>100%</strong>, Paper&nbsp;<strong>Custom&nbsp;10&nbsp;&times;&nbsp;4.5&nbsp;in</strong>
    </div>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const blobUrl = URL.createObjectURL(blob)
  const win = window.open(blobUrl, '_blank', 'width=1120,height=520')
  if (!win) {
    URL.revokeObjectURL(blobUrl)
    alert('Please allow popups to enable printing.')
    return
  }
  win.onload = () => URL.revokeObjectURL(blobUrl)
}

/* ────────────────────────────────────────────────────────── */

const input =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-400'
const label =
  'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

export default function Home() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [dbError, setDbError] = useState('')

  const fetchAddresses = useCallback(async (q = '') => {
    setLoading(true)
    setDbError('')
    try {
      const res = await fetch(`/api/addresses?search=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setAddresses(Array.isArray(data) ? data : [])
    } catch (e) {
      setDbError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch('/api/init-db').finally(() => fetchAddresses())
  }, [fetchAddresses])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setSearch(v)
    fetchAddresses(v)
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (addr: Address) => {
    setEditingId(addr.id)
    setForm({
      name: addr.name,
      company_name: addr.company_name || '',
      phone_country_code: addr.phone_country_code || '+91',
      phone_number: addr.phone_number,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      city: addr.city,
      state: addr.state || '',
      postal_code: addr.postal_code || '',
      country: addr.country || ''
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete address for "${name}"?`)) return
    await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
    fetchAddresses(search)
  }

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return setFormError('Name is required.')
    if (!form.phone_number.trim())
      return setFormError('Phone number is required.')
    if (!form.address_line1.trim())
      return setFormError('Address line 1 is required.')
    if (!form.city.trim()) return setFormError('City is required.')

    setSaving(true)
    setFormError('')
    const res = await fetch(
      editingId ? `/api/addresses/${editingId}` : '/api/addresses',
      {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      }
    )
    if (!res.ok) {
      const d = await res.json()
      setFormError(d.error || 'Failed to save. Please try again.')
    } else {
      setModalOpen(false)
      fetchAddresses(search)
    }
    setSaving(false)
  }

  const set =
    (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  /* ── render ── */
  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg,#eef2ff 0%,#f8fafc 60%)' }}
    >
      {/* ── Header ── */}
      <header
        style={{
          background: 'linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)'
        }}
        className="shadow-lg"
      >
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="bg-white/20 rounded-xl p-2.5 backdrop-blur-sm">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight tracking-tight">
                Envelope Printer
              </h1>
              <p className="text-blue-200 text-xs mt-0.5">
                10&Prime; &times; 4.5&Prime; &nbsp;|&nbsp; Address Manager &amp;
                Print
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-white text-sm font-medium">
              <svg
                className="w-4 h-4 text-blue-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              <span className="text-blue-100">{addresses.length} addresses</span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* ── DB error ── */}
        {dbError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm shadow-sm">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Connection error:</strong> {dbError}
            </span>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name, company, address, phone..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-white rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
          </div>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-md transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Address
          </button>
        </div>

        {/* ── Main card ── */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          {/* ── Loading ── */}
          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : /* ── Empty state ── */
          addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)'
                }}
              >
                <svg
                  className="w-10 h-10 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-700 mb-1">
                {search ? `No results for "${search}"` : 'No addresses yet'}
              </h3>
              <p className="text-sm text-gray-400 mb-5">
                {search
                  ? 'Try a different search term'
                  : 'Add your first address to get started'}
              </p>
              {!search && (
                <button
                  onClick={openAdd}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow"
                  style={{
                    background: 'linear-gradient(135deg,#2563eb,#1d4ed8)'
                  }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add First Address
                </button>
              )}
            </div>
          ) : (
            /* ── Table ── */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                      Company
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                      Phone
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {addresses.map(addr => {
                    const fullName =
                      addr.name || addr.company_name || addr.city || 'Unknown'
                    const initials = fullName
                      .split(' ')
                      .map(w => w[0] || '')
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                    return (
                      <tr
                        key={addr.id}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center
                                            text-white text-xs font-bold shadow-sm select-none"
                              style={{ background: avatarColor(fullName) }}
                            >
                              {initials.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 leading-tight">
                                {fullName}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5 md:hidden">
                                {addr.company_name || addr.city}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          {addr.company_name ? (
                            <span className="inline-flex items-center gap-1.5 text-gray-600">
                              <svg
                                className="w-3.5 h-3.5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                              {addr.company_name}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          <p className="leading-tight">{addr.address_line1}</p>
                          {addr.address_line2 && (
                            <p className="text-xs text-gray-400">
                              {addr.address_line2}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {[addr.city, addr.state, addr.postal_code]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-gray-600 text-sm">
                            <svg
                              className="w-3.5 h-3.5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            {addr.phone_country_code} {addr.phone_number}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {/* Print */}
                            <button
                              onClick={() => printEnvelope(addr)}
                              title="Print Envelope"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                         text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                              </svg>
                              <span className="hidden sm:inline">Print</span>
                            </button>
                            {/* Edit */}
                            <button
                              onClick={() => openEdit(addr)}
                              title="Edit"
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(addr.id, fullName)}
                              title="Delete"
                              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && addresses.length > 0 && (
          <p className="text-xs text-gray-400 text-right pr-1">
            Showing {addresses.length}{' '}
            {addresses.length === 1 ? 'address' : 'addresses'}
            {search && ` matching "${search}"`}
          </p>
        )}
      </main>

      {/* ── Add / Edit Modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={e => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {editingId ? 'Edit Address' : 'Add New Address'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Fields marked{' '}
                    <span className="text-red-500 font-semibold">*</span> are
                    required
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* ── Personal info ── */}
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 inline-flex items-center justify-center text-blue-600 text-[10px] font-bold">
                    1
                  </span>
                  Personal Info
                </p>
                <div>
                  <label className={label}>
                    Full Name{' '}
                    <span className="text-red-500 normal-case">*</span>
                  </label>
                  <input
                    type="text"
                    className={input}
                    placeholder="John Doe"
                    value={form.name}
                    onChange={set('name')}
                  />
                </div>
              </div>

              {/* ── Company ── */}
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 inline-flex items-center justify-center text-blue-600 text-[10px] font-bold">
                    2
                  </span>
                  Company
                </p>
                <div>
                  <label className={label}>Company Name</label>
                  <input
                    type="text"
                    className={input}
                    placeholder="Acme Corp (optional)"
                    value={form.company_name || ''}
                    onChange={set('company_name')}
                  />
                </div>
              </div>

              {/* ── Contact ── */}
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 inline-flex items-center justify-center text-blue-600 text-[10px] font-bold">
                    3
                  </span>
                  Contact
                </p>
                <div>
                  <label className={label}>
                    Phone Number{' '}
                    <span className="text-red-500 normal-case">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.phone_country_code}
                      onChange={set('phone_country_code')}
                      className="border border-gray-200 rounded-lg px-2 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 flex-shrink-0"
                      style={{ minWidth: '110px' }}
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                      <option value="other">Other</option>
                    </select>
                    {form.phone_country_code === 'other' ? (
                      <input
                        type="text"
                        className={`${input} w-20 flex-shrink-0`}
                        placeholder="+00"
                        value=""
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            phone_country_code: e.target.value
                          }))
                        }
                      />
                    ) : null}
                    <input
                      type="tel"
                      className={`${input} flex-1`}
                      placeholder="9876543210"
                      value={form.phone_number}
                      onChange={set('phone_number')}
                    />
                  </div>
                </div>
              </div>

              {/* ── Address ── */}
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 inline-flex items-center justify-center text-blue-600 text-[10px] font-bold">
                    4
                  </span>
                  Address
                </p>
                <div className="space-y-3">
                  <div>
                    <label className={label}>
                      Address Line 1{' '}
                      <span className="text-red-500 normal-case">*</span>
                    </label>
                    <input
                      type="text"
                      className={input}
                      placeholder="House / Shop No., Street"
                      value={form.address_line1}
                      onChange={set('address_line1')}
                    />
                  </div>
                  <div>
                    <label className={label}>Address Line 2</label>
                    <input
                      type="text"
                      className={input}
                      placeholder="Area, Landmark (optional)"
                      value={form.address_line2 || ''}
                      onChange={set('address_line2')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label}>
                        City <span className="text-red-500 normal-case">*</span>
                      </label>
                      <input
                        type="text"
                        className={input}
                        placeholder="Delhi"
                        value={form.city}
                        onChange={set('city')}
                      />
                    </div>
                    <div>
                      <label className={label}>State</label>
                      <input
                        type="text"
                        className={input}
                        placeholder="Delhi"
                        value={form.state || ''}
                        onChange={set('state')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label}>PIN / ZIP</label>
                      <input
                        type="text"
                        className={input}
                        placeholder="110006"
                        value={form.postal_code || ''}
                        onChange={set('postal_code')}
                      />
                    </div>
                    <div>
                      <label className={label}>Country</label>
                      <input
                        type="text"
                        className={input}
                        placeholder="India"
                        value={form.country || ''}
                        onChange={set('country')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Error */}
              {formError && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {formError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg,#2563eb,#1d4ed8)'
                  }}
                >
                  {saving
                    ? 'Saving…'
                    : editingId
                      ? 'Update Address'
                      : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
