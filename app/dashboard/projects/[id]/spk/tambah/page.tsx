'use client'

// SQL to run in Supabase before push:
// alter table spk add column if not exists sub_kategori text;
// alter table spk add column if not exists alasan_batal text;
// alter table spk add column if not exists satuan text;
// alter table spk add column if not exists volume numeric;
// alter table spk add column if not exists harga_satuan numeric;

import { useState, useEffect } from 'react'
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

const DIVISI_KODE: Record<string, string> = {
  PERSIAPAN: 'PRE', STRUKTUR: 'STR', ARSITEKTUR: 'ARS',
  MEP: 'MEP', LAINNYA: 'LNY', MATERIAL: 'MAT', SEWA: 'SEW', MANAJEMEN: 'MAN',
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', backgroundColor: INPUT_BG,
  border: `1px solid ${BORDER}`, borderRadius: '8px', color: NAVY,
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

type Vendor = { id: string; nama: string; kode: string; sub_kategori: string | null }
type RapItem = { id: string; sub_divisi: string | null; deskripsi: string; total_rap: number | null }

export default function TambahSpkPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const divisi = searchParams.get('divisi') ?? 'PERSIAPAN'

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [rapItems, setRapItems] = useState<RapItem[]>([])
  const [form, setForm] = useState({
    nomor_spk: '',
    sub_kategori: '',
    deskripsi: '',
    vendor_id: '',
    pp_rap: '',
    satuan: '',
    volume: '',
    harga_satuan: '',
    deal_spk: '',
    tanggal_spk: '',
    rap_item_id: '',
  })
  const [dealTouched, setDealTouched] = useState(false)
  const [subKategoriManual, setSubKategoriManual] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const subOptions = SUB_KATEGORI_MAP[divisi as RapDivisi] ?? null
  const isManualMode = subKategoriManual

  // Filter vendors by sub_kategori
  const matchedVendors = form.sub_kategori
    ? vendors.filter(v => v.sub_kategori === form.sub_kategori)
    : []
  const displayVendors = matchedVendors.length > 0 ? matchedVendors : vendors
  const vendorHint = form.sub_kategori
    ? matchedVendors.length > 0
      ? `${matchedVendors.length} vendor untuk sub kategori ini.`
      : 'Tidak ada vendor spesifik, menampilkan semua vendor aktif.'
    : undefined

  const computedDeal = (parseFloat(form.volume) || 0) * (parseFloat(form.harga_satuan) || 0)

  useEffect(() => {
    const supabase = createClient()
    async function fetchData() {
      const [{ data: projectData }, { data: vendorData }, { data: rapData }] = await Promise.all([
        supabase.from('projects').select('kode').eq('id', projectId).single(),
        supabase.from('vendors').select('id, nama, kode, sub_kategori').eq('status', 'AKTIF').order('nama'),
        supabase.from('rap_items').select('id, sub_divisi, deskripsi, total_rap')
          .eq('project_id', projectId).eq('divisi', divisi).order('created_at', { ascending: true }),
      ])

      setVendors((vendorData as Vendor[]) ?? [])
      setRapItems((rapData as RapItem[]) ?? [])

      if (projectData?.kode) {
        setGenerating(true)
        const kode = DIVISI_KODE[divisi] ?? divisi.slice(0, 3).toUpperCase()
        const now = new Date()
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
        const prefix = `${projectData.kode}-${kode}-${yearMonth}`

        const { data: existing } = await supabase
          .from('spk')
          .select('nomor_spk')
          .eq('project_id', projectId)
          .eq('divisi', divisi)
          .like('nomor_spk', `${prefix}-%`)

        let maxSeq = 0
        for (const row of existing ?? []) {
          const parts = (row.nomor_spk as string).split('-')
          const seq = parseInt(parts[parts.length - 1], 10)
          if (!isNaN(seq) && seq > maxSeq) maxSeq = seq
        }
        setForm(prev => ({ ...prev, nomor_spk: `${prefix}-${String(maxSeq + 1).padStart(3, '0')}` }))
        setGenerating(false)
      }
    }
    fetchData()
  }, [projectId, divisi])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    if (name === 'deal_spk') {
      setDealTouched(true)
      setForm(prev => ({ ...prev, deal_spk: value }))
    } else if (name === 'volume' || name === 'harga_satuan') {
      setForm(prev => {
        const newVolume = name === 'volume' ? value : prev.volume
        const newHarga = name === 'harga_satuan' ? value : prev.harga_satuan
        const computed = (parseFloat(newVolume) || 0) * (parseFloat(newHarga) || 0)
        return {
          ...prev,
          [name]: value,
          deal_spk: dealTouched ? prev.deal_spk : (computed > 0 ? String(computed) : ''),
        }
      })
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.nomor_spk.trim()) return setError('Nomor SPK wajib diisi.')
    if (!form.deskripsi.trim()) return setError('Deskripsi wajib diisi.')

    const subKategoriVal = subKategoriManual ? form.sub_kategori : form.sub_kategori

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('spk').insert({
      project_id: projectId,
      divisi,
      sub_kategori: subKategoriVal.trim() || null,
      nomor_spk: form.nomor_spk.trim(),
      deskripsi: form.deskripsi.trim(),
      vendor_id: form.vendor_id || null,
      pp_rap: form.pp_rap ? parseFloat(form.pp_rap) : null,
      satuan: form.satuan.trim() || null,
      volume: form.volume ? parseFloat(form.volume) : null,
      harga_satuan: form.harga_satuan ? parseFloat(form.harga_satuan) : null,
      deal_spk: form.deal_spk ? parseFloat(form.deal_spk) : null,
      status: 'DRAFT',
      tanggal_spk: form.tanggal_spk || null,
      rap_item_id: form.rap_item_id || null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push(`/dashboard/projects/${projectId}?tab=${divisi}`)
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '28px' }}>
        <button onClick={() => router.push(`/dashboard/projects/${projectId}?tab=${divisi}`)}
          style={{ background: 'none', border: 'none', color: SECONDARY, fontSize: '12px', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>
          ← Kembali
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: NAVY, margin: '0 0 6px 0' }}>Tambah SPK</h1>
        <p style={{ fontSize: '13px', color: SECONDARY, margin: 0 }}>
          Kategori: <strong style={{ color: GOLD }}>{divisi}</strong>
        </p>
      </div>

      <div style={{
        backgroundColor: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
        fontSize: '12px', color: SECONDARY,
      }}>
        SPK baru akan berstatus <strong style={{ color: NAVY }}>DRAFT</strong>. SPK akan aktif setelah disetujui Site Manager.
      </div>

      <div style={{ backgroundColor: CARD_BG, border: `1px solid rgba(13,46,66,0.15)`, borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px rgba(13,46,66,0.06)' }}>
        <form onSubmit={handleSubmit}>

          {/* Nomor SPK + Tanggal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Nomor SPK *">
              <input name="nomor_spk" value={form.nomor_spk} onChange={handleChange}
                placeholder={generating ? 'Generating...' : 'Auto-generate'}
                style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </Field>
            <Field label="Tanggal SPK">
              <input type="date" name="tanggal_spk" value={form.tanggal_spk} onChange={handleChange}
                style={{ ...inputStyle, colorScheme: 'light' }} />
            </Field>
          </div>

          {/* Sub Kategori */}
          <Field label="Sub Kategori">
            {subOptions ? (
              <>
                <select
                  value={isManualMode ? '__manual__' : form.sub_kategori}
                  onChange={e => {
                    if (e.target.value === '__manual__') {
                      setSubKategoriManual(true)
                      setForm(prev => ({ ...prev, sub_kategori: '', vendor_id: '' }))
                    } else {
                      setSubKategoriManual(false)
                      setForm(prev => ({ ...prev, sub_kategori: e.target.value, vendor_id: '' }))
                    }
                  }}
                  style={{ ...inputStyle, cursor: 'pointer', marginBottom: isManualMode ? '8px' : 0 }}
                >
                  <option value="" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>— Pilih Sub Kategori —</option>
                  {subOptions.map(s => (
                    <option key={s} value={s} style={{ backgroundColor: '#FFFFFF', color: NAVY }}>{s}</option>
                  ))}
                  <option value="__manual__" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>— Isi Manual —</option>
                </select>
                {isManualMode && (
                  <input
                    value={form.sub_kategori}
                    onChange={e => setForm(prev => ({ ...prev, sub_kategori: e.target.value, vendor_id: '' }))}
                    placeholder="Ketik sub kategori..."
                    style={inputStyle}
                    autoFocus
                  />
                )}
              </>
            ) : (
              <input
                name="sub_kategori"
                value={form.sub_kategori}
                onChange={e => {
                  setForm(prev => ({ ...prev, sub_kategori: e.target.value, vendor_id: '' }))
                }}
                placeholder="Opsional"
                style={inputStyle}
              />
            )}
          </Field>

          {/* Deskripsi */}
          <Field label="Deskripsi Pekerjaan *">
            <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange}
              placeholder="Contoh: Pekerjaan galian tanah dan pondasi..." rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
          </Field>

          {/* Vendor (filtered by sub_kategori) */}
          <Field label="Vendor" hint={vendorHint}>
            <select name="vendor_id" value={form.vendor_id} onChange={handleChange}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>— Pilih Vendor —</option>
              {displayVendors.map(v => (
                <option key={v.id} value={v.id} style={{ backgroundColor: '#FFFFFF', color: NAVY }}>
                  {v.nama}{v.sub_kategori ? ` — ${v.sub_kategori}` : ''}
                </option>
              ))}
            </select>
          </Field>

          {/* RAP Rujukan */}
          <Field
            label="RAP Rujukan (opsional)"
            hint={rapItems.length === 0 ? 'Belum ada item RAP untuk kategori ini.' : undefined}
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

          {/* PP RAP */}
          <Field label="PP / RAP (Rp)">
            <input type="number" name="pp_rap" value={form.pp_rap} onChange={handleChange}
              placeholder="0" min="0" step="1000" style={inputStyle} />
          </Field>

          {/* Satuan, Volume, Harga Satuan */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Field label="Satuan">
              <input name="satuan" value={form.satuan} onChange={handleChange}
                placeholder="m², unit, ls..." style={inputStyle} />
            </Field>
            <Field label="Volume">
              <input type="number" name="volume" value={form.volume} onChange={handleChange}
                placeholder="0" min="0" step="0.01" style={inputStyle} />
            </Field>
            <Field label="Harga Satuan (Rp)">
              <input type="number" name="harga_satuan" value={form.harga_satuan} onChange={handleChange}
                placeholder="0" min="0" step="1000" style={inputStyle} />
            </Field>
          </div>

          {/* Deal SPK (auto-computed or override) */}
          <Field
            label="Deal SPK (Rp)"
            hint={!dealTouched && form.volume && form.harga_satuan ? 'Auto-dihitung dari Volume × Harga Satuan. Edit untuk override.' : undefined}
          >
            <input type="number" name="deal_spk" value={form.deal_spk} onChange={handleChange}
              placeholder="0" min="0" step="1000" style={inputStyle} />
          </Field>

          {/* Computed preview */}
          {form.volume && form.harga_satuan && (
            <div style={{
              backgroundColor: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.4)',
              borderRadius: '10px', padding: '14px 18px', marginBottom: '24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '12px', color: SECONDARY, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>
                Volume × Harga Satuan
              </span>
              <span style={{ fontSize: '16px', fontWeight: '700', color: GOLD }}>
                {formatRupiah(computedDeal)}
              </span>
            </div>
          )}

          {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" disabled={loading} style={{
              padding: '12px 28px', backgroundColor: loading ? 'rgba(13,46,66,0.4)' : NAVY,
              color: '#FAF5EB', border: 'none', borderRadius: '8px', fontSize: '13px',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px',
            }}>
              {loading ? 'Menyimpan...' : 'Simpan SPK (Draft)'}
            </button>
            <button type="button" onClick={() => router.push(`/dashboard/projects/${projectId}?tab=${divisi}`)}
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
