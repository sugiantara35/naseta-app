'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const GOLD = '#D4AF37'
const CREAM = '#FAF5EB'
const BORDER = 'rgba(212,175,55,0.2)'
const INPUT_BG = 'rgba(255,255,255,0.06)'

const RAP_DIVISI = ['PERSIAPAN', 'STRUKTUR', 'ARSITEKTUR', 'MEP', 'LAINNYA', 'MATERIAL', 'SEWA', 'MANAJEMEN'] as const

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

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

export default function EditRapItemPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const rapId = params.rapId as string

  const [form, setForm] = useState({
    divisi: 'PERSIAPAN',
    sub_divisi: '',
    deskripsi: '',
    satuan: '',
    volume: '',
    harga_satuan: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [fetching, setFetching] = useState(true)

  const totalRap = (parseFloat(form.volume) || 0) * (parseFloat(form.harga_satuan) || 0)

  useEffect(() => {
    async function fetchItem() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('rap_items')
        .select('*')
        .eq('id', rapId)
        .single()

      if (error || !data) {
        setError('Item RAP tidak ditemukan.')
        setFetching(false)
        return
      }

      setForm({
        divisi: data.divisi ?? 'PERSIAPAN',
        sub_divisi: data.sub_divisi ?? '',
        deskripsi: data.deskripsi ?? '',
        satuan: data.satuan ?? '',
        volume: data.volume != null ? String(data.volume) : '',
        harga_satuan: data.harga_satuan != null ? String(data.harga_satuan) : '',
      })
      setFetching(false)
    }
    fetchItem()
  }, [rapId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.deskripsi.trim()) return setError('Deskripsi wajib diisi.')

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('rap_items').update({
      divisi: form.divisi,
      sub_divisi: form.sub_divisi.trim() || null,
      deskripsi: form.deskripsi.trim(),
      satuan: form.satuan.trim() || null,
      volume: form.volume ? parseFloat(form.volume) : null,
      harga_satuan: form.harga_satuan ? parseFloat(form.harga_satuan) : null,
      total_rap: totalRap || null,
    }).eq('id', rapId)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/projects/${projectId}/rap`)
  }

  async function handleDelete() {
    if (!confirm('Hapus item RAP ini? Tindakan tidak dapat dibatalkan.')) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('rap_items').delete().eq('id', rapId)
    if (error) {
      setError(error.message)
      setDeleting(false)
      return
    }
    router.push(`/dashboard/projects/${projectId}/rap`)
  }

  if (fetching) {
    return (
      <div style={{ maxWidth: '640px', padding: '40px 0' }}>
        <p style={{ color: CREAM, opacity: 0.4, fontSize: '14px' }}>Memuat data...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '28px' }}>
        <button onClick={() => router.push(`/dashboard/projects/${projectId}/rap`)}
          style={{ background: 'none', border: 'none', color: CREAM, opacity: 0.5, fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>
          ← Kembali
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: CREAM, margin: '0 0 6px 0' }}>Edit Item RAP</h1>
        <p style={{ fontSize: '13px', color: CREAM, opacity: 0.5, margin: 0 }}>
          Rencana Anggaran Pelaksanaan
        </p>
      </div>

      <div style={{ backgroundColor: 'rgba(13,46,66,0.6)', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Divisi *">
              <select name="divisi" value={form.divisi} onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {RAP_DIVISI.map(d => (
                  <option key={d} value={d} style={{ backgroundColor: '#0D2E42' }}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Sub Divisi">
              <input name="sub_divisi" value={form.sub_divisi} onChange={handleChange}
                placeholder="Opsional, contoh: Pondasi" style={inputStyle} />
            </Field>
          </div>

          <Field label="Deskripsi *">
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange}
              placeholder="Contoh: Pekerjaan galian tanah..." rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Satuan">
              <input name="satuan" value={form.satuan} onChange={handleChange}
                placeholder="m², m³, unit, ls, ..." style={inputStyle} />
            </Field>
            <Field label="Volume">
              <input type="number" name="volume" value={form.volume} onChange={handleChange}
                placeholder="0" min="0" step="0.01" style={inputStyle} />
            </Field>
          </div>

          <Field label="Harga Satuan (Rp)">
            <input type="number" name="harga_satuan" value={form.harga_satuan} onChange={handleChange}
              placeholder="0" min="0" step="1000" style={inputStyle} />
          </Field>

          {/* Total RAP computed */}
          <div style={{
            backgroundColor: 'rgba(212,175,55,0.08)',
            border: `1px solid ${BORDER}`,
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '12px', color: CREAM, opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Total RAP
            </span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: GOLD }}>
              {formatRupiah(totalRap)}
            </span>
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={loading} style={{
                padding: '12px 28px', backgroundColor: loading ? 'rgba(212,175,55,0.5)' : GOLD,
                color: '#0D2E42', border: 'none', borderRadius: '8px', fontSize: '13px',
                fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px',
              }}>
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button type="button" onClick={() => router.push(`/dashboard/projects/${projectId}/rap`)}
                style={{
                  padding: '12px 24px', backgroundColor: 'transparent', color: CREAM,
                  border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px',
                  cursor: 'pointer', opacity: 0.7,
                }}>
                Batal
              </button>
            </div>
            <button type="button" onClick={handleDelete} disabled={deleting} style={{
              padding: '12px 20px', backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '13px',
              fontWeight: '600', color: '#f87171', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1,
            }}>
              {deleting ? 'Menghapus...' : 'Hapus Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
