'use client'

import { useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const GOLD = '#D4AF37'
const NAVY = '#0D2E42'
const SECONDARY = '#1A3B52'
const BORDER = 'rgba(13,46,66,0.2)'
const INPUT_BG = '#FFFFFF'
const CARD_BG = '#FFFFFF'

const RAP_DIVISI = ['PERSIAPAN', 'STRUKTUR', 'ARSITEKTUR', 'MEP', 'LAINNYA', 'MATERIAL', 'SEWA', 'MANAJEMEN'] as const
type RapDivisi = typeof RAP_DIVISI[number]

const SUB_KATEGORI_MAP: Partial<Record<RapDivisi, string[]>> = {
  PERSIAPAN:  ['Pek Site Clearing', 'Pek Pembuatan Bedeng', 'Pek Sumur Bor', 'Tenaga Harian'],
  STRUKTUR:   ['Struktur Utama', 'Struktur Baja', 'Struktur Kayu', 'Struktur Baja Ringan', 'Waterproofing'],
  ARSITEKTUR: ['Pasangan Dinding', 'Plester Aci', 'Pek Pasang Ceiling', 'Pasang Keramik / Granite Tile / Batu Alam', 'Finishing Cat dan Politur', 'Pek Daun Pintu Jendela', 'Aluminium'],
  MEP:        ['Pek Mekanikal', 'Pek Elektrikal', 'Pek Plumbing'],
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block', fontSize: '11px', color: SECONDARY,
        marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600',
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

export default function TambahRapItemPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const defaultDivisi = (searchParams.get('divisi') ?? 'PERSIAPAN') as RapDivisi

  const [form, setForm] = useState({
    divisi: defaultDivisi,
    sub_divisi: '',
    deskripsi: '',
    satuan: '',
    volume: '',
    harga_satuan: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const totalRap = (parseFloat(form.volume) || 0) * (parseFloat(form.harga_satuan) || 0)
  const subOptions = SUB_KATEGORI_MAP[form.divisi as RapDivisi] ?? null
  const isManualMode = form.sub_divisi === '__manual__'

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    if (name === 'divisi') {
      setForm(prev => ({ ...prev, divisi: value as RapDivisi, sub_divisi: '' }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.deskripsi.trim()) return setError('Deskripsi wajib diisi.')

    const subVal = isManualMode ? '' : form.sub_divisi

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('rap_items').insert({
      project_id: projectId,
      divisi: form.divisi,
      sub_divisi: subVal.trim() || null,
      deskripsi: form.deskripsi.trim(),
      satuan: form.satuan.trim() || null,
      volume: form.volume ? parseFloat(form.volume) : null,
      harga_satuan: form.harga_satuan ? parseFloat(form.harga_satuan) : null,
      total_rap: totalRap || null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push(`/dashboard/projects/${projectId}/rap`)
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '28px' }}>
        <button onClick={() => router.push(`/dashboard/projects/${projectId}/rap`)}
          style={{ background: 'none', border: 'none', color: SECONDARY, fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>
          ← Kembali
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>Tambah Item RAP</h1>
        <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>Rencana Anggaran Pelaksanaan</p>
      </div>

      <div style={{ backgroundColor: CARD_BG, border: `1px solid rgba(13,46,66,0.15)`, borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Kategori *">
              <select name="divisi" value={form.divisi} onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {RAP_DIVISI.map(d => (
                  <option key={d} value={d} style={{ backgroundColor: '#FFFFFF', color: NAVY }}>{d}</option>
                ))}
              </select>
            </Field>

            <Field label="Sub Kategori">
              {subOptions ? (
                <>
                  <select
                    name="sub_divisi"
                    value={isManualMode ? '__manual__' : form.sub_divisi}
                    onChange={e => {
                      if (e.target.value === '__manual__') {
                        setForm(prev => ({ ...prev, sub_divisi: '__manual__' }))
                      } else {
                        setForm(prev => ({ ...prev, sub_divisi: e.target.value }))
                      }
                    }}
                    style={{ ...inputStyle, cursor: 'pointer', marginBottom: isManualMode ? '8px' : '0' }}
                  >
                    <option value="" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>— Pilih Sub Kategori —</option>
                    {subOptions.map(s => (
                      <option key={s} value={s} style={{ backgroundColor: '#FFFFFF', color: NAVY }}>{s}</option>
                    ))}
                    <option value="__manual__" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>— Isi Manual —</option>
                  </select>
                  {isManualMode && (
                    <input
                      value=""
                      onChange={e => setForm(prev => ({ ...prev, sub_divisi: e.target.value }))}
                      placeholder="Ketik sub kategori..."
                      style={inputStyle}
                      autoFocus
                    />
                  )}
                </>
              ) : (
                <input
                  name="sub_divisi"
                  value={form.sub_divisi}
                  onChange={handleChange}
                  placeholder="Opsional, contoh: Pondasi"
                  style={inputStyle}
                />
              )}
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

          <div style={{
            backgroundColor: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.4)',
            borderRadius: '10px', padding: '16px 20px', marginBottom: '24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '12px', color: SECONDARY, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>
              Total RAP
            </span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: GOLD }}>
              {formatRupiah(totalRap)}
            </span>
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" disabled={loading} style={{
              padding: '12px 28px', backgroundColor: loading ? 'rgba(13,46,66,0.4)' : NAVY,
              color: '#FAF5EB', border: 'none', borderRadius: '8px', fontSize: '13px',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px',
            }}>
              {loading ? 'Menyimpan...' : 'Simpan Item RAP'}
            </button>
            <button type="button" onClick={() => router.push(`/dashboard/projects/${projectId}/rap`)}
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
