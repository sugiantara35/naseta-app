'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const GOLD = '#D4AF37'
const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.2)'
const INPUT_BG = '#FFFFFF'
const CARD_BG = '#FFFFFF'

const STATUS_OPTIONS = ['DRAFT', 'AKTIF', 'SELESAI'] as const
type Status = typeof STATUS_OPTIONS[number]

type Vendor = { id: string; nama: string; kode: string }
type RapItem = { id: string; sub_divisi: string | null; deskripsi: string; total_rap: number | null }

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block', fontSize: '11px', color: SECONDARY,
        marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600',
      }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: '11px', color: SECONDARY, margin: '5px 0 0', opacity: 0.7 }}>{hint}</p>}
    </div>
  )
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', backgroundColor: INPUT_BG,
  border: `1px solid ${BORDER}`, borderRadius: '8px', color: NAVY,
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

export default function EditSpkPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const spkId = params.spkId as string

  const [divisi, setDivisi] = useState('')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [rapItems, setRapItems] = useState<RapItem[]>([])
  const [form, setForm] = useState({
    nomor_spk: '', deskripsi: '', vendor_id: '', pp_rap: '',
    deal_spk: '', status: 'DRAFT' as Status, tanggal_spk: '', rap_item_id: '',
  })
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    async function fetchData() {
      const { data: spk, error: spkErr } = await supabase
        .from('spk')
        .select('nomor_spk, deskripsi, vendor_id, pp_rap, deal_spk, status, tanggal_spk, rap_item_id, divisi')
        .eq('id', spkId)
        .single()

      if (spkErr || !spk) { setError('SPK tidak ditemukan.'); setLoadingData(false); return }

      setDivisi(spk.divisi ?? '')
      setForm({
        nomor_spk: spk.nomor_spk ?? '',
        deskripsi: spk.deskripsi ?? '',
        vendor_id: spk.vendor_id ?? '',
        pp_rap: spk.pp_rap != null ? String(spk.pp_rap) : '',
        deal_spk: spk.deal_spk != null ? String(spk.deal_spk) : '',
        status: (spk.status as Status) ?? 'DRAFT',
        tanggal_spk: spk.tanggal_spk ?? '',
        rap_item_id: spk.rap_item_id ?? '',
      })

      const [{ data: vendorData }, { data: rapData }] = await Promise.all([
        supabase.from('vendors').select('id, nama, kode').eq('status', 'AKTIF').order('nama'),
        supabase.from('rap_items').select('id, sub_divisi, deskripsi, total_rap')
          .eq('project_id', projectId).eq('divisi', spk.divisi).order('created_at', { ascending: true }),
      ])
      setVendors(vendorData ?? [])
      setRapItems((rapData as RapItem[]) ?? [])
      setLoadingData(false)
    }
    fetchData()
  }, [projectId, spkId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.nomor_spk.trim()) return setError('Nomor SPK wajib diisi.')
    if (!form.deskripsi.trim()) return setError('Deskripsi wajib diisi.')

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('spk').update({
      nomor_spk: form.nomor_spk.trim(),
      deskripsi: form.deskripsi.trim(),
      vendor_id: form.vendor_id || null,
      pp_rap: form.pp_rap ? parseFloat(form.pp_rap) : null,
      deal_spk: form.deal_spk ? parseFloat(form.deal_spk) : null,
      status: form.status,
      tanggal_spk: form.tanggal_spk || null,
      rap_item_id: form.rap_item_id || null,
    }).eq('id', spkId)

    if (error) { setError(error.message); setSaving(false); return }
    router.push(`/dashboard/projects/${projectId}/spk/${spkId}`)
  }

  if (loadingData) return <div style={{ color: SECONDARY, fontSize: '14px', paddingTop: '40px' }}>Memuat data SPK...</div>

  const backHref = `/dashboard/projects/${projectId}/spk/${spkId}`

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '28px' }}>
        <button onClick={() => router.push(backHref)}
          style={{ background: 'none', border: 'none', color: SECONDARY, fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>
          ← Kembali
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>Edit SPK</h1>
        {divisi && (
          <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>
            Divisi: <strong style={{ color: GOLD }}>{divisi}</strong>
          </p>
        )}
      </div>

      <div style={{ backgroundColor: CARD_BG, border: `1px solid rgba(13,46,66,0.15)`, borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Nomor SPK *">
              <input name="nomor_spk" value={form.nomor_spk} onChange={handleChange}
                placeholder="Contoh: SPK/001/2025" style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </Field>
            <Field label="Tanggal SPK">
              <input type="date" name="tanggal_spk" value={form.tanggal_spk} onChange={handleChange}
                style={{ ...inputStyle, colorScheme: 'light' }} />
            </Field>
          </div>

          <Field label="Deskripsi Pekerjaan *">
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange}
              placeholder="Contoh: Pekerjaan galian tanah dan pondasi..." rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
          </Field>

          <Field label="Vendor">
            <select name="vendor_id" value={form.vendor_id} onChange={handleChange}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>— Pilih Vendor —</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id} style={{ backgroundColor: '#FFFFFF', color: NAVY }}>
                  {v.nama} ({v.kode})
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="RAP Rujukan (opsional)"
            hint={rapItems.length === 0 ? 'Belum ada item RAP untuk divisi ini.' : undefined}
          >
            <select name="rap_item_id" value={form.rap_item_id} onChange={handleChange}
              style={{ ...inputStyle, cursor: 'pointer' }}
              disabled={rapItems.length === 0}
            >
              <option value="" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>— Tidak ada RAP rujukan —</option>
              {rapItems.map(r => (
                <option key={r.id} value={r.id} style={{ backgroundColor: '#FFFFFF', color: NAVY }}>
                  {r.sub_divisi ? `[${r.sub_divisi}] ` : ''}{r.deskripsi}{r.total_rap != null ? ` (RAP: ${formatRupiah(r.total_rap)})` : ''}
                </option>
              ))}
            </select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="PP / RAP (Rp)">
              <input type="number" name="pp_rap" value={form.pp_rap} onChange={handleChange}
                placeholder="0" min="0" step="1000" style={inputStyle} />
            </Field>
            <Field label="Deal SPK (Rp)">
              <input type="number" name="deal_spk" value={form.deal_spk} onChange={handleChange}
                placeholder="0" min="0" step="1000" style={inputStyle} />
            </Field>
          </div>

          <Field label="Status">
            <select name="status" value={form.status} onChange={handleChange}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s} style={{ backgroundColor: '#FFFFFF', color: NAVY }}>{s}</option>
              ))}
            </select>
          </Field>

          {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" disabled={saving} style={{
              padding: '12px 28px', backgroundColor: saving ? 'rgba(13,46,66,0.4)' : NAVY,
              color: '#FAF5EB', border: 'none', borderRadius: '8px', fontSize: '13px',
              fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '0.5px',
            }}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button type="button" onClick={() => router.push(backHref)}
              style={{ padding: '12px 24px', backgroundColor: '#FFFFFF', color: NAVY,
                border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
