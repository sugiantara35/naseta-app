'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.2)'
const INPUT_BG = '#FFFFFF'
const CARD_BG = '#FFFFFF'

const STATUS_OPTIONS = ['AKTIF', 'BLACKLIST'] as const

const KATEGORI_OPTIONS = [
  { value: 'PERSIAPAN',  label: 'Persiapan' },
  { value: 'STRUKTUR',   label: 'Struktur' },
  { value: 'ARSITEKTUR', label: 'Arsitektur' },
  { value: 'MEP',        label: 'MEP' },
  { value: 'SEWA',       label: 'Sewa' },
  { value: 'LAINNYA',    label: 'Lainnya' },
]

const SUB_KATEGORI_MAP: Record<string, string[]> = {
  PERSIAPAN:  ['Sumur Bor', 'Site Clearing', 'Bongkaran', 'Antitermite', 'Setting Out'],
  STRUKTUR:   ['Beton Bertulang', 'Struktur Baja', 'Struktur Kayu', 'Struktur Baja Ringan', 'Waterproofing'],
  ARSITEKTUR: ['Pasangan Dinding', 'Plester Aci', 'Pek Pasang Ceiling', 'Pasang Keramik / Granite Tile / Batu Alam', 'Finishing Cat dan Politur', 'Pek Daun Pintu Jendela', 'Aluminium'],
  MEP:        ['MEP'],
  SEWA:       ['Alat Berat'],
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block', fontSize: '11px', color: SECONDARY, marginBottom: '8px',
        letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', backgroundColor: INPUT_BG,
  border: `1px solid ${BORDER}`, borderRadius: '8px', color: NAVY,
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

export default function TambahVendorPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    nama: '', kode: '', nama_ktp: '', alias: '', no_hp: '',
    alamat: '', kategori: '', sub_kategori: '', catatan: '',
    status: 'AKTIF' as typeof STATUS_OPTIONS[number],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const subKategoriOptions = form.kategori ? (SUB_KATEGORI_MAP[form.kategori] ?? []) : []

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    if (name === 'kategori') {
      setForm(prev => ({ ...prev, kategori: value, sub_kategori: '' }))
    } else {
      setForm(prev => ({
        ...prev,
        [name]: name === 'kode' ? value.toUpperCase().slice(0, 10) : value,
      }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.nama.trim()) return setError('Nama vendor wajib diisi.')
    if (!form.kode.trim()) return setError('Kode vendor wajib diisi.')

    setLoading(true)
    const supabase = createClient()
    const subVal = form.sub_kategori === '__manual__' ? '' : form.sub_kategori
    const { error } = await supabase.from('vendors').insert({
      nama: form.nama.trim(),
      kode: form.kode.trim(),
      nama_ktp: form.nama_ktp.trim() || null,
      alias: form.alias.trim() || null,
      kontak: form.no_hp.trim() || null,
      alamat: form.alamat.trim() || null,
      kategori: form.kategori || null,
      sub_kategori: subVal.trim() || null,
      catatan: form.catatan.trim() || null,
      status: form.status,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard/vendors')
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '28px' }}>
        <button onClick={() => router.push('/dashboard/vendors')}
          style={{ background: 'none', border: 'none', color: SECONDARY, fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>
          ← Kembali
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>Tambah Vendor</h1>
        <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>Isi detail vendor baru</p>
      </div>

      <div style={{ backgroundColor: CARD_BG, border: `1px solid rgba(13,46,66,0.15)`, borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Nama Vendor *">
              <input name="nama" value={form.nama} onChange={handleChange}
                placeholder="Contoh: CV Maju Bersama" style={inputStyle} />
            </Field>
            <Field label="Kode Vendor * (maks. 10)">
              <input name="kode" value={form.kode} onChange={handleChange}
                placeholder="Contoh: CVMB001" maxLength={10}
                style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '2px' }} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Nama sesuai KTP">
              <input name="nama_ktp" value={form.nama_ktp} onChange={handleChange}
                placeholder="Nama lengkap sesuai KTP" style={inputStyle} />
            </Field>
            <Field label="Alias">
              <input name="alias" value={form.alias} onChange={handleChange}
                placeholder="Nama panggilan / singkatan" style={inputStyle} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="No. HP">
              <input name="no_hp" value={form.no_hp} onChange={handleChange}
                placeholder="Contoh: 0812-3456-7890" style={inputStyle} />
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
          </div>

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

          <Field label="Alamat">
            <textarea name="alamat" value={form.alamat} onChange={handleChange}
              placeholder="Alamat lengkap vendor..." rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
          </Field>

          <Field label="Catatan">
            <textarea name="catatan" value={form.catatan} onChange={handleChange}
              placeholder="Catatan tambahan tentang vendor..." rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
          </Field>

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
            <button type="submit" disabled={loading} style={{
              padding: '12px 28px', backgroundColor: loading ? 'rgba(13,46,66,0.4)' : NAVY,
              color: '#FAF5EB', border: 'none', borderRadius: '8px', fontSize: '13px',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px',
            }}>
              {loading ? 'Menyimpan...' : 'Simpan Vendor'}
            </button>
            <button type="button" onClick={() => router.push('/dashboard/vendors')}
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
