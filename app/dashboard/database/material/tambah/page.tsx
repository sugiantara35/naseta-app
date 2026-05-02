'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.2)'
const CARD_BG = '#FFFFFF'

const KATEGORI_OPTIONS = [
  { value: 'GALIAN_C',       label: 'Galian C' },
  { value: 'BESI',           label: 'Besi' },
  { value: 'KAYU',           label: 'Kayu' },
  { value: 'MATERIAL_UMUM',  label: 'Material Umum' },
  { value: 'MEP',            label: 'MEP' },
  { value: 'LAINNYA',        label: 'Lainnya' },
]

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

export default function TambahHargaMaterialPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nama_material: '', kategori: '', satuan: '', harga: '', berlaku_mulai: '', catatan: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.nama_material.trim()) return setError('Nama material wajib diisi.')

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('harga_material').insert({
      nama_material: form.nama_material.trim(),
      kategori: form.kategori || null,
      satuan: form.satuan.trim() || null,
      harga: form.harga ? parseFloat(form.harga) : null,
      berlaku_mulai: form.berlaku_mulai || null,
      catatan: form.catatan.trim() || null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard/database/material')
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '28px' }}>
        <button onClick={() => router.push('/dashboard/database/material')}
          style={{ background: 'none', border: 'none', color: SECONDARY, fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>
          ← Kembali
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>Tambah Harga Material</h1>
        <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>Tambah item harga material baru</p>
      </div>

      <div style={{ backgroundColor: CARD_BG, border: `1px solid rgba(13,46,66,0.15)`, borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <form onSubmit={handleSubmit}>
          <Field label="Nama Material *">
            <input name="nama_material" value={form.nama_material} onChange={handleChange}
              placeholder="Contoh: Semen Portland" style={inputStyle} />
          </Field>

          <Field label="Kategori">
            <select name="kategori" value={form.kategori} onChange={handleChange}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>— Pilih Kategori —</option>
              {KATEGORI_OPTIONS.map(k => (
                <option key={k.value} value={k.value} style={{ backgroundColor: '#FFFFFF', color: NAVY }}>{k.label}</option>
              ))}
            </select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Satuan">
              <input name="satuan" value={form.satuan} onChange={handleChange}
                placeholder="Contoh: zak, m³, kg" style={inputStyle} />
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
            <button type="submit" disabled={loading} style={{
              padding: '12px 28px', backgroundColor: loading ? 'rgba(13,46,66,0.4)' : NAVY,
              color: '#FAF5EB', border: 'none', borderRadius: '8px', fontSize: '13px',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px',
            }}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" onClick={() => router.push('/dashboard/database/material')}
              style={{ padding: '12px 24px', backgroundColor: '#FFFFFF', color: NAVY, border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
