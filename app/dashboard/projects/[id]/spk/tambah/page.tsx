'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const GOLD = '#D4AF37'
const CREAM = '#FAF5EB'
const BORDER = 'rgba(212,175,55,0.2)'
const INPUT_BG = 'rgba(255,255,255,0.06)'

const STATUS_OPTIONS = ['DRAFT', 'AKTIF', 'SELESAI'] as const

type Vendor = { id: string; nama: string; kode: string }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block', fontSize: '11px', color: CREAM, opacity: 0.6,
        marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', backgroundColor: INPUT_BG,
  border: `1px solid ${BORDER}`, borderRadius: '8px', color: CREAM,
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

export default function TambahSpkPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const divisi = searchParams.get('divisi') ?? 'PERSIAPAN'

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [form, setForm] = useState({
    nomor_spk: '',
    deskripsi: '',
    vendor_id: '',
    pp_rap: '',
    deal_spk: '',
    status: 'DRAFT' as typeof STATUS_OPTIONS[number],
    tanggal_spk: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchVendors() {
      const supabase = createClient()
      const { data } = await supabase
        .from('vendors')
        .select('id, nama, kode')
        .eq('status', 'AKTIF')
        .order('nama')
      setVendors(data ?? [])
    }
    fetchVendors()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.nomor_spk.trim()) return setError('Nomor SPK wajib diisi.')
    if (!form.deskripsi.trim()) return setError('Deskripsi wajib diisi.')

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('spk').insert({
      project_id: projectId,
      divisi,
      nomor_spk: form.nomor_spk.trim(),
      deskripsi: form.deskripsi.trim(),
      vendor_id: form.vendor_id || null,
      pp_rap: form.pp_rap ? parseFloat(form.pp_rap) : null,
      deal_spk: form.deal_spk ? parseFloat(form.deal_spk) : null,
      status: form.status,
      tanggal_spk: form.tanggal_spk || null,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/projects/${projectId}?tab=${divisi}`)
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '28px' }}>
        <button onClick={() => router.push(`/dashboard/projects/${projectId}?tab=${divisi}`)}
          style={{ background: 'none', border: 'none', color: CREAM, opacity: 0.5, fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>
          ← Kembali
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: CREAM, margin: '0 0 6px 0' }}>Tambah SPK</h1>
        <p style={{ fontSize: '13px', color: CREAM, opacity: 0.5, margin: 0 }}>
          Divisi: <strong style={{ color: GOLD }}>{divisi}</strong>
        </p>
      </div>

      <div style={{ backgroundColor: 'rgba(13,46,66,0.6)', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Nomor SPK *">
              <input name="nomor_spk" value={form.nomor_spk} onChange={handleChange}
                placeholder="Contoh: SPK/001/2025" style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </Field>
            <Field label="Tanggal SPK">
              <input type="date" name="tanggal_spk" value={form.tanggal_spk} onChange={handleChange}
                style={{ ...inputStyle, colorScheme: 'dark' }} />
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
              <option value="" style={{ backgroundColor: '#0D2E42' }}>— Pilih Vendor —</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id} style={{ backgroundColor: '#0D2E42' }}>
                  {v.nama} ({v.kode})
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
                <option key={s} value={s} style={{ backgroundColor: '#0D2E42' }}>{s}</option>
              ))}
            </select>
          </Field>

          {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" disabled={loading} style={{
              padding: '12px 28px', backgroundColor: loading ? 'rgba(212,175,55,0.5)' : GOLD,
              color: '#0D2E42', border: 'none', borderRadius: '8px', fontSize: '13px',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px',
            }}>
              {loading ? 'Menyimpan...' : 'Simpan SPK'}
            </button>
            <button type="button" onClick={() => router.push(`/dashboard/projects/${projectId}?tab=${divisi}`)}
              style={{
                padding: '12px 24px', backgroundColor: 'transparent', color: CREAM,
                border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px',
                cursor: 'pointer', opacity: 0.7,
              }}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
