'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const GOLD = '#D4AF37'
const CREAM = '#FAF5EB'
const BORDER = 'rgba(212,175,55,0.2)'
const INPUT_BG = 'rgba(255,255,255,0.06)'

const STATUS_OPTIONS = ['AKTIF', 'BLACKLIST'] as const
type Status = typeof STATUS_OPTIONS[number]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        fontSize: '11px',
        color: CREAM,
        opacity: 0.6,
        marginBottom: '8px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  backgroundColor: INPUT_BG,
  border: `1px solid ${BORDER}`,
  borderRadius: '8px',
  color: CREAM,
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function EditVendorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState({
    nama: '',
    kode: '',
    kontak: '',
    kategori: '',
    catatan: '',
    status: 'AKTIF' as Status,
  })
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchVendor() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setError('Vendor tidak ditemukan.')
      } else {
        setForm({
          nama: data.nama ?? '',
          kode: data.kode ?? '',
          kontak: data.kontak ?? '',
          kategori: data.kategori ?? '',
          catatan: data.catatan ?? '',
          status: data.status ?? 'AKTIF',
        })
      }
      setLoadingData(false)
    }
    fetchVendor()
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'kode' ? value.toUpperCase().slice(0, 10) : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.nama.trim()) return setError('Nama vendor wajib diisi.')
    if (!form.kode.trim()) return setError('Kode vendor wajib diisi.')

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('vendors')
      .update({
        nama: form.nama.trim(),
        kode: form.kode.trim(),
        kontak: form.kontak.trim() || null,
        kategori: form.kategori.trim() || null,
        catatan: form.catatan.trim() || null,
        status: form.status,
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    router.push('/dashboard/vendors')
  }

  if (loadingData) {
    return (
      <div style={{ color: CREAM, opacity: 0.5, fontSize: '14px', paddingTop: '40px' }}>
        Memuat data vendor...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: CREAM, margin: '0 0 6px 0' }}>Edit Vendor</h1>
        <p style={{ fontSize: '13px', color: CREAM, opacity: 0.5, margin: 0 }}>Ubah detail vendor</p>
      </div>

      <div style={{
        backgroundColor: 'rgba(13,46,66,0.6)',
        border: `1px solid ${BORDER}`,
        borderRadius: '12px',
        padding: '32px',
      }}>
        <form onSubmit={handleSubmit}>
          <Field label="Nama Vendor *">
            <input
              name="nama"
              value={form.nama}
              onChange={handleChange}
              placeholder="Contoh: CV Maju Bersama"
              style={inputStyle}
            />
          </Field>

          <Field label="Kode Vendor * (maks. 10 karakter)">
            <input
              name="kode"
              value={form.kode}
              onChange={handleChange}
              placeholder="Contoh: CVMB001"
              maxLength={10}
              style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '2px' }}
            />
          </Field>

          <Field label="Kontak">
            <input
              name="kontak"
              value={form.kontak}
              onChange={handleChange}
              placeholder="Contoh: 0812-3456-7890"
              style={inputStyle}
            />
          </Field>

          <Field label="Kategori">
            <input
              name="kategori"
              value={form.kategori}
              onChange={handleChange}
              placeholder="Contoh: Sipil, Mekanikal, Elektrikal"
              style={inputStyle}
            />
          </Field>

          <Field label="Catatan">
            <textarea
              name="catatan"
              value={form.catatan}
              onChange={handleChange}
              placeholder="Catatan tambahan tentang vendor..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
            />
          </Field>

          <Field label="Status">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s} style={{ backgroundColor: '#0D2E42' }}>{s}</option>
              ))}
            </select>
          </Field>

          {error && (
            <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 28px',
                backgroundColor: saving ? 'rgba(212,175,55,0.5)' : GOLD,
                color: '#0D2E42',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer',
                letterSpacing: '0.5px',
              }}
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/vendors')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: CREAM,
                border: `1px solid ${BORDER}`,
                borderRadius: '8px',
                fontSize: '13px',
                cursor: 'pointer',
                opacity: 0.7,
              }}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
