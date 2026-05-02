'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.2)'
const CARD_BG = '#FFFFFF'

const KATEGORI_OPTIONS = [
  { value: 'GALIAN_C',          label: 'Galian C' },
  { value: 'BESI',              label: 'Besi' },
  { value: 'KAYU',              label: 'Kayu' },
  { value: 'MATERIAL_UMUM',     label: 'Material Umum' },
  { value: 'KERAMIK_BATU_ALAM', label: 'Keramik & Batu Alam' },
  { value: 'MATERIAL_PEMIPAAN', label: 'Material Pemipaan' },
  { value: 'MATERIAL_LISTRIK',  label: 'Material Listrik' },
  { value: 'MEP',               label: 'MEP' },
  { value: 'LAINNYA',           label: 'Lainnya' },
]

const SUB_KATEGORI_MAP: Record<string, string[]> = {
  GALIAN_C:          ['Pasir', 'Batu', 'Koral'],
  BESI:              ['Besi Ulir TS 420', 'Besi Ulir TS 280', 'Besi Polos TP 280'],
  KAYU:              ['Kayu Lepasan'],
  MATERIAL_UMUM:     ['Semen', 'Bata Ringan'],
  KERAMIK_BATU_ALAM: ['Batu Alam', 'Batu Andesit', 'Koral Hias'],
  MATERIAL_PEMIPAAN: ['Pipa AW', 'Pipa D', 'Aksesori Pipa'],
  MATERIAL_LISTRIK:  ['Kabel'],
}

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
  const [form, setForm] = useState({
    nama_material: '', kategori: '', sub_kategori: '',
    satuan: '', harga: '', berlaku_mulai: '', catatan: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const subKategoriOptions = form.kategori ? (SUB_KATEGORI_MAP[form.kategori] ?? []) : []

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    if (name === 'kategori') {
      setForm(prev => ({ ...prev, kategori: value, sub_kategori: '' }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.nama_material.trim()) return setError('Nama material wajib diisi.')

    setLoading(true)
    const supabase = createClient()
    const subVal = form.sub_kategori === '__manual__' ? '' : form.sub_kategori
    const { error } = await supabase.from('harga_material').insert({
      nama_material: form.nama_material.trim(),
      kategori: form.kategori || null,
      sub_kategori: subVal.trim() || null,
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

          <Field label="Sub Kategori">
            {subKategoriOptions.length > 0 ? (
              <>
                <select name="sub_kategori" value={form.sub_kategori} onChange={handleChange}
                  style={{ ...inputStyle, cursor: 'pointer', marginBottom: form.sub_kategori === '__manual__' ? '8px' : '0' }}>
                  <option value="" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>— Pilih Sub Kategori —</option>
                  {subKategoriOptions.map(s => (
                    <option key={s} value={s} style={{ backgroundColor: '#FFFFFF', color: NAVY }}>{s}</option>
                  ))}
                  <option value="__manual__" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>— Isi Manual —</option>
                </select>
                {form.sub_kategori === '__manual__' && (
                  <input
                    name="sub_kategori"
                    value=""
                    onChange={e => setForm(prev => ({ ...prev, sub_kategori: e.target.value }))}
                    placeholder="Ketik sub kategori..."
                    style={inputStyle}
                    autoFocus
                  />
                )}
              </>
            ) : (
              <input name="sub_kategori" value={form.sub_kategori} onChange={handleChange}
                placeholder={form.kategori ? 'Ketik sub kategori...' : 'Pilih kategori terlebih dahulu'}
                style={{ ...inputStyle, opacity: form.kategori ? 1 : 0.5 }} />
            )}
            <p style={{ fontSize: '11px', color: SECONDARY, margin: '6px 0 0', opacity: 0.7 }}>
              Bisa diisi bebas untuk item baru di luar daftar.
            </p>
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
