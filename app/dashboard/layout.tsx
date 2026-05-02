'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const GOLD = '#D4AF37'
const NAVY = '#0D2E42'
const CREAM = '#FAF5EB'
const BORDER = 'rgba(212,175,55,0.2)'
const ACTIVE_BG = 'rgba(212,175,55,0.15)'

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function DatabaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [dbOpen, setDbOpen] = useState(pathname.startsWith('/dashboard/database'))

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  function isActive(href: string) {
    return pathname === href
  }

  function menuItemStyle(href: string): React.CSSProperties {
    const active = isActive(href)
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 16px',
      borderRadius: '8px',
      color: active ? GOLD : CREAM,
      opacity: active ? 1 : 0.7,
      backgroundColor: active ? ACTIVE_BG : 'transparent',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: active ? '600' : '400',
      transition: 'all 0.15s',
      cursor: 'pointer',
    }
  }

  function subMenuItemStyle(href: string): React.CSSProperties {
    const active = isActive(href)
    return {
      display: 'block',
      padding: '8px 16px 8px 42px',
      borderRadius: '8px',
      color: active ? GOLD : CREAM,
      opacity: active ? 1 : 0.65,
      backgroundColor: active ? ACTIVE_BG : 'transparent',
      textDecoration: 'none',
      fontSize: '13px',
      fontWeight: active ? '600' : '400',
      transition: 'all 0.15s',
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar — stays navy */}
      <aside style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: NAVY,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${BORDER}`,
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{
          padding: '28px 20px 24px',
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: GOLD, letterSpacing: '5px' }}>
            NASETA
          </div>
          <div style={{ fontSize: '11px', color: CREAM, opacity: 0.5, marginTop: '4px', letterSpacing: '0.5px' }}>
            PT Upadana Semesta
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <Link href="/dashboard/projects" style={menuItemStyle('/dashboard/projects')}>
            <FolderIcon />
            Projects
          </Link>

          <div style={{ marginTop: '4px' }}>
            <button
              onClick={() => setDbOpen(!dbOpen)}
              style={{
                ...menuItemStyle('/dashboard/database'),
                width: '100%',
                border: 'none',
                background: dbOpen ? ACTIVE_BG : 'transparent',
                justifyContent: 'space-between',
                color: dbOpen ? GOLD : CREAM,
                opacity: 1,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: dbOpen ? 1 : 0.7 }}>
                <DatabaseIcon />
                Database
              </span>
              <ChevronIcon open={dbOpen} />
            </button>

            {dbOpen && (
              <div style={{ marginTop: '2px' }}>
                <Link href="/dashboard/database/upah" style={subMenuItemStyle('/dashboard/database/upah')}>
                  Harga Upah
                </Link>
                <Link href="/dashboard/database/material" style={subMenuItemStyle('/dashboard/database/material')}>
                  Harga Material
                </Link>
                <Link href="/dashboard/database/borongan" style={subMenuItemStyle('/dashboard/database/borongan')}>
                  Harga Borongan
                </Link>
                <Link href="/dashboard/database/sewa" style={subMenuItemStyle('/dashboard/database/sewa')}>
                  Harga Sewa
                </Link>
              </div>
            )}
          </div>

          <div style={{ marginTop: '4px' }}>
            <Link href="/dashboard/vendors" style={menuItemStyle('/dashboard/vendors')}>
              <UsersIcon />
              Vendors
            </Link>
          </div>
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: `1px solid ${BORDER}`,
              color: CREAM,
              opacity: 0.7,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <LogoutIcon />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content — light cream */}
      <main style={{
        marginLeft: '240px',
        flex: 1,
        backgroundColor: '#F5F0E8',
        minHeight: '100vh',
        padding: '32px',
        color: '#0D2E42',
      }}>
        {children}
      </main>
    </div>
  )
}
