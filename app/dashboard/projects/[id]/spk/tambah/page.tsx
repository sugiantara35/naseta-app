'use client'

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
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block', fontSize: '11px', color: SECONDARY,
        marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600',
      }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: '11px', color: SECONDARY, margin: '4px 0 0', opacity: 0.7 }}>{hint}</p>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', backgroundColor: INPUT_BG,
  border: `1px solid ${BORDER}`, borderRadius: '8px', color: NAVY,
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}

type Vendor = { id: string; nama: string; kode: string; sub_kategori: string | null }
type RapItem = {
  id: string
  sub_divisi: string | null
  deskripsi: string
  total_rap: number | null
  satuan: string | null
  harga_satuan: number | null
}
type SpkItem = {
  id: string
  rap_item_id: string | null
  deskripsi: string
  satuan: string
  volume: string
  harga_satuan: string
  itemError?: string
}
type RapSaldo = { totalRap: number; totalSpkAktif: number; saldo: number }

let itemCounter = 1

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
    tanggal_spk: '',
  })
  const [subKategoriManual, setSubKategoriManual] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [items, setItems] = useState<SpkItem[]>([{
    id: 'item-1',
    rap_item_id: null,
    deskripsi: '',
    satuan: '',
    volume: '',
    harga_satuan: '',
  }])
  const [itemSaldos, setItemSaldos] = useState<Record<string, RapSaldo>>({})

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [overrideAlasan, setOverrideAlasan] = useState('')
  const [overrideLoading, setOverrideLoading] = useState(false)
  const [pendingOverride, setPendingOverride] = useState<{
    overItems: Array<{ deskripsi: string; jumlahOver: number }>
    totalOver: number
  } | null>(null)

  const subOptions = SUB_KATEGORI_MAP[divisi as RapDivisi] ?? null
  const totalDeal = items.reduce((s, it) => s + (parseFloat(it.volume) || 0) * (parseFloat(it.harga_satuan) || 0), 0)
  const matchedVendors = form.sub_kategori ? vendors.filter(v => v.sub_kategori === form.sub_kategori) : []
  const displayVendors = matchedVendors.length > 0 ? matchedVendors : vendors
  const vendorHint = form.sub_kategori
    ? matchedVendors.length > 0
      ? `${matchedVendors.length} vendor untuk sub kategori ini.`
      : 'Tidak ada vendor spesifik, menampilkan semua vendor aktif.'
    : undefined

  useEffect(() => {
    const supabase = createClient()
    async function fetchData() {
      const [{ data: projectData }, { data: vendorData }, { data: rapData }] = await Promise.all([
        supabase.from('projects').select('kode').eq('id', projectId).single(),
        supabase.from('vendors').select('id, nama, kode, sub_kategori').eq('status', 'AKTIF').order('nama'),
        supabase.from('rap_items')
          .select('id, sub_divisi, deskripsi, total_rap, satuan, harga_satuan')
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

  // ── Item helpers ──────────────────────────────────────────────────────────

  function addItem() {
    itemCounter++
    setItems(prev => [...prev, {
      id: `item-${itemCounter}`,
      rap_item_id: null,
      deskripsi: '',
      satuan: '',
      volume: '',
      harga_satuan: '',
    }])
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  function updateItem(id: string, updates: Partial<Omit<SpkItem, 'id' | 'itemError'>>) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...updates } : it))
  }

  async function handleSelectRap(itemId: string, rapItemId: string | null) {
    if (!rapItemId) {
      updateItem(itemId, { rap_item_id: null })
      return
    }
    const rapItem = rapItems.find(r => r.id === rapItemId)
    if (!rapItem) return

    updateItem(itemId, {
      rap_item_id: rapItemId,
      deskripsi: rapItem.deskripsi,
      satuan: rapItem.satuan ?? '',
      harga_satuan: rapItem.harga_satuan != null ? String(rapItem.harga_satuan) : '',
    })

    if (itemSaldos[rapItemId] !== undefined) return

    const totalRap = rapItem.total_rap ?? 0
    const { data } = await createClient()
      .from('spk')
      .select('deal_spk')
      .eq('rap_item_id', rapItemId)
      .in('status', ['AKTIF', 'SELESAI'])

    const totalSpkAktif = (data ?? []).reduce((s: number, r: { deal_spk: number | null }) => s + (r.deal_spk ?? 0), 0)
    setItemSaldos(prev => ({
      ...prev,
      [rapItemId]: { totalRap, totalSpkAktif, saldo: totalRap - totalSpkAktif },
    }))
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.nomor_spk.trim()) return setError('Nomor SPK wajib diisi.')
    if (!form.deskripsi.trim()) return setError('Deskripsi pekerjaan wajib diisi.')

    let hasItemError = false
    const validated = items.map(item => {
      const errs: string[] = []
      if (!item.deskripsi.trim()) errs.push('Deskripsi wajib diisi')
      if (!item.satuan.trim()) errs.push('Satuan wajib diisi')
      if (!(parseFloat(item.volume) > 0)) errs.push('Volume harus > 0')
      if (errs.length > 0) { hasItemError = true; return { ...item, itemError: errs.join(' · ') } }
      return { ...item, itemError: undefined }
    })
    if (hasItemError) { setItems(validated); return }

    const overItems: Array<{ deskripsi: string; jumlahOver: number }> = []
    for (const item of items) {
      if (!item.rap_item_id) continue
      const saldo = itemSaldos[item.rap_item_id]
      if (!saldo) continue
      const thisTotal = (parseFloat(item.volume) || 0) * (parseFloat(item.harga_satuan) || 0)
      const jumlahOver = (thisTotal + saldo.totalSpkAktif) - saldo.totalRap
      if (jumlahOver > 0) overItems.push({ deskripsi: item.deskripsi || 'Item tanpa deskripsi', jumlahOver })
    }

    if (overItems.length > 0) {
      setPendingOverride({ overItems, totalOver: overItems.reduce((s, i) => s + i.jumlahOver, 0) })
      setShowOverrideModal(true)
      return
    }

    await doSubmit('DRAFT')
  }

  async function doSubmit(status: 'DRAFT' | 'MENUNGGU_OVERRIDE', alasanOverride?: string) {
    if (status === 'MENUNGGU_OVERRIDE') setOverrideLoading(true)
    else setLoading(true)

    const supabase = createClient()
    const firstItem = items[0]

    const { data: spkData, error: spkError } = await supabase.from('spk').insert({
      project_id: projectId,
      divisi,
      sub_kategori: form.sub_kategori.trim() || null,
      nomor_spk: form.nomor_spk.trim(),
      deskripsi: form.deskripsi.trim(),
      vendor_id: form.vendor_id || null,
      pp_rap: null,
      satuan: firstItem?.satuan?.trim() || null,
      volume: firstItem?.volume ? parseFloat(firstItem.volume) : null,
      harga_satuan: firstItem?.harga_satuan ? parseFloat(firstItem.harga_satuan) : null,
      deal_spk: totalDeal || null,
      status,
      tanggal_spk: form.tanggal_spk || null,
      rap_item_id: null,
    }).select('id').single()

    if (spkError || !spkData) {
      setError(spkError?.message ?? 'Gagal menyimpan SPK.')
      setLoading(false); setOverrideLoading(false)
      return
    }

    const { error: itemsError } = await supabase.from('spk_items').insert(
      items.map(item => ({
        spk_id: spkData.id,
        rap_item_id: item.rap_item_id || null,
        deskripsi: item.deskripsi.trim(),
        satuan: item.satuan.trim() || null,
        volume: item.volume ? parseFloat(item.volume) : null,
        harga_satuan: item.harga_satuan ? parseFloat(item.harga_satuan) : null,
      }))
    )

    if (itemsError) {
      await supabase.from('spk').delete().eq('id', spkData.id)
      setError(itemsError.message)
      setLoading(false); setOverrideLoading(false)
      return
    }

    if (status === 'MENUNGGU_OVERRIDE' && pendingOverride && alasanOverride) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const firstOverItem = items.find(it => it.rap_item_id && itemSaldos[it.rap_item_id])
        await supabase.from('rap_overrides').insert({
          rap_item_id: firstOverItem?.rap_item_id || null,
          spk_id: spkData.id,
          requested_by: user.id,
          jumlah_over: pendingOverride.totalOver,
          alasan_request: alasanOverride,
          status: 'PENDING',
        })
      }
    }

    router.push(`/dashboard/projects/${projectId}?tab=${divisi}`)
  }

  async function handleOverrideSubmit() {
    if (!overrideAlasan.trim()) { setError('Alasan request override wajib diisi.'); return }
    await doSubmit('MENUNGGU_OVERRIDE', overrideAlasan.trim())
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '720px' }}>
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

      <form onSubmit={handleSubmit}>

        {/* ── SECTION HEADER ──────────────────────────────────────────────── */}
        <div style={{
          backgroundColor: CARD_BG, border: `1px solid rgba(13,46,66,0.15)`,
          borderRadius: '12px', padding: '28px 32px', marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(13,46,66,0.06)',
        }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: SECONDARY, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 20px 0' }}>
            Informasi Umum SPK
          </p>

          {/* Nomor SPK + Tanggal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Nomor SPK *">
              <input
                value={form.nomor_spk}
                onChange={e => setForm(prev => ({ ...prev, nomor_spk: e.target.value }))}
                placeholder={generating ? 'Generating...' : 'Auto-generate'}
                style={{ ...inputStyle, fontFamily: 'monospace' }}
              />
            </Field>
            <Field label="Tanggal SPK">
              <input
                type="date"
                value={form.tanggal_spk}
                onChange={e => setForm(prev => ({ ...prev, tanggal_spk: e.target.value }))}
                style={{ ...inputStyle, colorScheme: 'light' }}
              />
            </Field>
          </div>

          {/* Sub Kategori */}
          <Field label="Sub Kategori">
            {subOptions ? (
              <>
                <select
                  value={subKategoriManual ? '__manual__' : form.sub_kategori}
                  onChange={e => {
                    if (e.target.value === '__manual__') {
                      setSubKategoriManual(true)
                      setForm(prev => ({ ...prev, sub_kategori: '', vendor_id: '' }))
                    } else {
                      setSubKategoriManual(false)
                      setForm(prev => ({ ...prev, sub_kategori: e.target.value, vendor_id: '' }))
                    }
                  }}
                  style={{ ...inputStyle, cursor: 'pointer', marginBottom: subKategoriManual ? '8px' : 0 }}
                >
                  <option value="" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>— Pilih Sub Kategori —</option>
                  {subOptions.map(s => (
                    <option key={s} value={s} style={{ backgroundColor: '#FFFFFF', color: NAVY }}>{s}</option>
                  ))}
                  <option value="__manual__" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>— Isi Manual —</option>
                </select>
                {subKategoriManual && (
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
                value={form.sub_kategori}
                onChange={e => setForm(prev => ({ ...prev, sub_kategori: e.target.value, vendor_id: '' }))}
                placeholder="Opsional"
                style={inputStyle}
              />
            )}
          </Field>

          {/* Vendor */}
          <Field label="Vendor" hint={vendorHint}>
            <select
              value={form.vendor_id}
              onChange={e => setForm(prev => ({ ...prev, vendor_id: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>— Pilih Vendor —</option>
              {displayVendors.map(v => (
                <option key={v.id} value={v.id} style={{ backgroundColor: '#FFFFFF', color: NAVY }}>
                  {v.nama}{v.sub_kategori ? ` — ${v.sub_kategori}` : ''}
                </option>
              ))}
            </select>
          </Field>

          {/* Deskripsi Pekerjaan Umum */}
          <Field label="Deskripsi Pekerjaan Umum *">
            <textarea
              value={form.deskripsi}
              onChange={e => setForm(prev => ({ ...prev, deskripsi: e.target.value }))}
              placeholder="Contoh: Pasangan Pek Lt 2, Pekerjaan galian tanah dan pondasi..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5', marginBottom: 0 }}
            />
          </Field>
        </div>

        {/* ── SECTION ITEMS ────────────────────────────────────────────────── */}
        <div style={{
          backgroundColor: CARD_BG, border: `1px solid rgba(13,46,66,0.15)`,
          borderRadius: '12px', padding: '28px 32px', marginBottom: '16px',
          boxShadow: '0 1px 3px rgba(13,46,66,0.06)',
        }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: SECONDARY, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
              Detail Item Pekerjaan
            </p>
            <p style={{ fontSize: '12px', color: SECONDARY, margin: 0, opacity: 0.8 }}>
              Tambah satu atau lebih item pekerjaan
            </p>
          </div>

          {items.map((item, index) => {
            const totalItem = (parseFloat(item.volume) || 0) * (parseFloat(item.harga_satuan) || 0)
            const saldo = item.rap_item_id ? itemSaldos[item.rap_item_id] : null
            const afterSaldo = saldo ? saldo.saldo - totalItem : null

            return (
              <div key={item.id} style={{
                borderBottom: index < items.length - 1 ? `1px solid ${BORDER}` : 'none',
                paddingBottom: index < items.length - 1 ? '28px' : 0,
                marginBottom: index < items.length - 1 ? '28px' : 0,
              }}>
                {/* Item row header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: '700', color: NAVY,
                    backgroundColor: 'rgba(13,46,66,0.07)', borderRadius: '6px',
                    padding: '3px 10px',
                  }}>
                    Item {index + 1}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {!item.rap_item_id && (item.deskripsi || index === 0) && (
                      <span style={{
                        backgroundColor: '#FEF3C7', color: '#92400E',
                        border: '1px solid #FCD34D',
                        borderRadius: '4px', fontSize: '10px', fontWeight: '700',
                        padding: '2px 8px', letterSpacing: '0.3px',
                      }}>
                        ⚠️ Item tanpa link RAP
                      </span>
                    )}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        style={{
                          background: 'none', border: 'none', color: '#dc2626',
                          fontSize: '12px', cursor: 'pointer', padding: '2px 6px',
                          fontWeight: '500',
                        }}
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>

                {/* RAP Rujukan */}
                <Field label="RAP Rujukan">
                  <select
                    value={item.rap_item_id ?? '__custom__'}
                    onChange={e => {
                      const val = e.target.value
                      handleSelectRap(item.id, val === '__custom__' ? null : val)
                    }}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="__custom__" style={{ backgroundColor: '#FFFFFF', color: NAVY }}>+ Item Custom (tanpa link RAP)</option>
                    {rapItems.map(r => (
                      <option key={r.id} value={r.id} style={{ backgroundColor: '#FFFFFF', color: NAVY }}>
                        {r.sub_divisi ? `[${r.sub_divisi}] ` : ''}{r.deskripsi}
                        {r.total_rap != null ? ` — ${formatRupiah(r.total_rap)}` : ''}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Saldo RAP info */}
                {saldo && (
                  <div style={{
                    marginTop: '-8px', marginBottom: '16px',
                    backgroundColor: saldo.saldo <= 0 ? 'rgba(220,38,38,0.07)' : 'rgba(22,163,74,0.07)',
                    border: `1px solid ${saldo.saldo <= 0 ? 'rgba(220,38,38,0.25)' : 'rgba(22,163,74,0.25)'}`,
                    borderRadius: '6px', padding: '8px 14px', fontSize: '12px',
                    display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
                  }}>
                    <span style={{ color: SECONDARY }}>
                      RAP: <strong style={{ color: NAVY }}>{formatRupiah(saldo.totalRap)}</strong>
                      {' · '}
                      Saldo: <strong style={{ color: saldo.saldo <= 0 ? '#dc2626' : '#166534' }}>
                        {formatRupiah(saldo.saldo)}
                      </strong>
                    </span>
                    {totalItem > 0 && afterSaldo !== null && (
                      <span style={{ color: SECONDARY }}>
                        Setelah ini:{' '}
                        <strong style={{ color: afterSaldo < 0 ? '#dc2626' : '#166534' }}>
                          {formatRupiah(afterSaldo)}
                        </strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Deskripsi item */}
                <Field label="Deskripsi Item *">
                  <input
                    value={item.deskripsi}
                    onChange={e => updateItem(item.id, { deskripsi: e.target.value })}
                    placeholder="Deskripsi item pekerjaan..."
                    style={inputStyle}
                  />
                </Field>

                {/* Satuan + Volume + Harga Satuan */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <Field label="Satuan *">
                    <input
                      value={item.satuan}
                      onChange={e => updateItem(item.id, { satuan: e.target.value })}
                      placeholder="m², unit, ls..."
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Volume *">
                    <input
                      type="number"
                      value={item.volume}
                      onChange={e => updateItem(item.id, { volume: e.target.value })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Harga Satuan (Rp)">
                    <input
                      type="number"
                      value={item.harga_satuan}
                      onChange={e => updateItem(item.id, { harga_satuan: e.target.value })}
                      placeholder="0"
                      min="0"
                      step="1000"
                      style={inputStyle}
                    />
                  </Field>
                </div>

                {/* Total Item */}
                {totalItem > 0 && (
                  <div style={{
                    backgroundColor: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)',
                    borderRadius: '8px', padding: '10px 16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: '-4px',
                  }}>
                    <span style={{ fontSize: '11px', color: SECONDARY, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600' }}>
                      Total Item
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: GOLD }}>
                      {formatRupiah(totalItem)}
                    </span>
                  </div>
                )}

                {/* Item error */}
                {item.itemError && (
                  <p style={{ color: '#dc2626', fontSize: '12px', margin: '8px 0 0 0' }}>
                    {item.itemError}
                  </p>
                )}
              </div>
            )
          })}

          {/* Add item button */}
          <button
            type="button"
            onClick={addItem}
            style={{
              marginTop: '20px', width: '100%', padding: '11px',
              backgroundColor: 'rgba(13,46,66,0.04)', color: NAVY,
              border: `1px dashed rgba(13,46,66,0.3)`, borderRadius: '8px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              letterSpacing: '0.3px',
            }}
          >
            + Tambah Item
          </button>
        </div>

        {/* ── SECTION TOTAL ─────────────────────────────────────────────────── */}
        {totalDeal > 0 && (
          <div style={{
            backgroundColor: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.5)',
            borderRadius: '12px', padding: '18px 28px', marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: SECONDARY, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Total Deal SPK
            </span>
            <span style={{ fontSize: '22px', fontWeight: '800', color: GOLD }}>
              {formatRupiah(totalDeal)}
            </span>
          </div>
        )}

        {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={loading} style={{
            padding: '12px 28px', backgroundColor: loading ? 'rgba(13,46,66,0.4)' : NAVY,
            color: '#FAF5EB', border: 'none', borderRadius: '8px', fontSize: '13px',
            fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px',
          }}>
            {loading ? 'Menyimpan...' : 'Simpan SPK (Draft)'}
          </button>
          <button type="button" onClick={() => router.push(`/dashboard/projects/${projectId}?tab=${divisi}`)}
            style={{
              padding: '12px 24px', backgroundColor: '#FFFFFF', color: NAVY,
              border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
            }}>
            Batal
          </button>
        </div>
      </form>

      {/* ── OVERRIDE MODAL ────────────────────────────────────────────────── */}
      {showOverrideModal && pendingOverride && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '32px',
            maxWidth: '540px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#B45309', margin: '0 0 16px 0' }}>
              ⚠️ Melebihi RAP
            </h2>

            <div style={{
              backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: '10px', padding: '16px', marginBottom: '20px',
              fontSize: '13px', color: NAVY, lineHeight: '1.7',
            }}>
              <p style={{ margin: '0 0 12px 0' }}>Item-item berikut melebihi RAP:</p>
              <ul style={{ margin: '0 0 12px 0', paddingLeft: '18px', display: 'grid', gap: '4px' }}>
                {pendingOverride.overItems.map((oi, i) => (
                  <li key={i} style={{ color: '#dc2626', fontWeight: '500' }}>
                    {oi.deskripsi}{' '}
                    <span style={{ fontWeight: '400', color: SECONDARY }}>
                      — Over {formatRupiah(oi.jumlahOver)}
                    </span>
                  </li>
                ))}
              </ul>
              <div style={{ borderTop: '1px solid rgba(245,158,11,0.3)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: SECONDARY }}>Total over keseluruhan:</span>
                <strong style={{ color: '#dc2626', fontSize: '15px' }}>
                  {formatRupiah(pendingOverride.totalOver)}
                </strong>
              </div>
              <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: SECONDARY, fontStyle: 'italic' }}>
                Untuk melanjutkan, perlu persetujuan Direktur.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', fontSize: '11px', color: SECONDARY,
                marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '600',
              }}>
                Alasan Request Override *
              </label>
              <textarea
                value={overrideAlasan}
                onChange={e => setOverrideAlasan(e.target.value)}
                rows={3}
                placeholder="Jelaskan alasan mengapa SPK ini perlu melebihi RAP..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              />
            </div>

            {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowOverrideModal(false)
                  setPendingOverride(null)
                  setOverrideAlasan('')
                  setError('')
                }}
                style={{
                  padding: '11px 22px', backgroundColor: '#FFFFFF', color: NAVY,
                  border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleOverrideSubmit}
                disabled={overrideLoading}
                style={{
                  padding: '11px 22px',
                  backgroundColor: overrideLoading ? 'rgba(180,83,9,0.5)' : '#B45309',
                  color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px',
                  fontWeight: '700', cursor: overrideLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {overrideLoading ? 'Mengirim...' : 'Submit Request Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
