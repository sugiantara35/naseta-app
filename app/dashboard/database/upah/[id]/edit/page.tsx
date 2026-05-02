'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.2)'
const CARD_BG = '#FFFFFF'

const KATEGORI_OPTIONS = ['PERSIAPAN', 'STRUKTUR', 'ARSITEKTUR', 'MEP'] as const

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '11px', color: SECONDARY, marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', backgroundColor: '#FFFFFF',
  border: `1px solid ${BORDER}`, borderRadius: '8px', color: NAVY,
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

export default function EditHargaUpahPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState({ nama_pekerjaan: '', kategori: '', satuan: '', harga: '', berlaku_mulai: '', catatan: '' })
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetch() {
      const supabase = createClient()
      const { data, error } = await supabase.from('harga_upah').select('*').eq('id', id).single()
      if (error || !data) { setError('Data tidak ditemukan.'); setLoadingData(false); return }
      setForm({
        nama_pekerjaan: data.nama_pekerjaan ?? '',
        kategori: data.kategori ?? '',
        satuan: data.satuan ?? '',
        harga: data.harga != null ? String(data.harga) : '',
        berlaku_mulai: data.berlaku_mulai ?? '',
        catatan: data.catatan ?? '',
      })
      setLoadingData(false)
    }
    fetch()
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.nama_pekerjaan.trim()) return setError('Nama pekerjaan wajib diisi.')

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('harga_upah').update({
      nama_pekerjaan: form.nama_pekerjaan.trim(),
      kategori: form.kategori || null,
      satuan: form.satuan.trim() || null,
      harga: form.harga ? parseFloat(form.harga) : null,
      berlaku_mulai: form.berlaku_mulai || null,
      catatan: form.catatan.trim() || null,
    }).eq('id', id)

    if (error) { setError(error.message); setSaving(false); return }
    router.push('/dashboard/database/upah')
  }

  if (loadingData) return <div style={{ color: SECONDARY, fontSize: '14px', paddingTop: '40px' }}>Memuat data...</div>

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '28px' }}>
        <button onClick={() => router.push('/dashboard/database/upah')}
          style={{ background: 'none', border: 'none', color: SECONDARY, fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>
          ← Kembali
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>Edit Harga Upah</h1>
        <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>Ubah detail harga upah</p>
      </div>

      <div style={{ backgroundColor: CARD_BG, border: `1px solid rgba(13,46,66,0.15)`, borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <form onSubmit={handleSubmit}>
          <Field label="Nama Pekerjaan *">
            <input name="nama_pekerjaan" value={form.nama_pekerjaan} onChange={handleChange}
              placeholder="Contoh: Tukang Batu" style={inputStyle} />
          </Field>

          <Field label="Kategori">
            <select name="kategori" value={form.kategori} onChange={handleChange}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>— Pilih Kategori —</option>
              {KATEGORI_OPTIONS.map(k => (
                <option key={k} value={k} style={{ backgroundColor: '#FFFFFF', color: NAVY }}>{k}</option>
              ))}
            </select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Satuan">
              <input name="satuan" value={form.satuan} onChange={handleChange}
                placeholder="Contoh: OH, m², ls" style={inputStyle} />
            </Field>
            <Field label="Harga (Rp)">
              <input name="harga" type="number" value={form.harga} onChange={handleChange}
                placeholder="0" min="0" step="1000" style={inputStyle} />
            </Field>
          </div>

          <Field label="Berlaku Mulai">
            <input name="berlaku_mulai" type="date" value={form.berlaku_mulai} onChange={handleChange}
              style={{ ...inputStyle, colorScheme: 'light' }} />
          </Field>

          <Field label="Catatan">
            <textarea name="catatan" value={form.catatan} onChange={handleChange}
              placeholder="Catatan tambahan..." rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
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
            <button type="button" onClick={() => router.push('/dashboard/database/upah')}
              style={{ padding: '12px 24px', backgroundColor: '#FFFFFF', color: NAVY, border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
