'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const GOLD = '#D4AF37'
const NAVY = '#0D2E42'
const CREAM = '#FAF5EB'
const BORDER = 'rgba(212,175,55,0.2)'
const ACTIVE_BG = 'rgba(212,175,55,0.15)'

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

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

function FileTextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
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

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
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

const ROLE_BADGE: Record<string, React.CSSProperties> = {
  ADMIN:        { backgroundColor: 'rgba(212,175,55,0.25)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.4)' },
  DIREKTUR:     { backgroundColor: 'rgba(167,139,250,0.2)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.35)' },
  SITE_MANAGER: { backgroundColor: 'rgba(147,197,253,0.2)', color: '#93c5fd', border: '1px solid rgba(147,197,253,0.35)' },
  QS:           { backgroundColor: 'rgba(134,239,172,0.2)', color: '#86efac', border: '1px solid rgba(134,239,172,0.35)' },
  ESTIMATOR:    { backgroundColor: 'rgba(253,186,116,0.2)', color: '#fdba74', border: '1px solid rgba(253,186,116,0.35)' },
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin', DIREKTUR: 'Direktur', SITE_MANAGER: 'Site Manager',
  QS: 'QS', ESTIMATOR: 'Estimator',
}

type SidebarProfile = { nama: string; role: string }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [dbOpen, setDbOpen] = useState(pathname.startsWith('/dashboard/database'))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [profile, setProfile] = useState<SidebarProfile | null>(null)

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('nama, role')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data as SidebarProfile)
    }
    fetchProfile()
  }, [])

  // Close sidebar whenever route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  function closeSidebar() {
    setSidebarOpen(false)
  }

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

      {/* Dark overlay behind sidebar, in front of content */}
      {isMobile && sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* Hamburger button — only rendered on mobile */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          aria-label="Toggle menu"
          style={{
            position: 'fixed',
            top: '12px',
            left: '12px',
            zIndex: 60,
            width: '40px',
            height: '40px',
            backgroundColor: NAVY,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: GOLD,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <HamburgerIcon />
        </button>
      )}

      {/* Sidebar — fixed, slides in/out on mobile */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '240px',
          height: '100vh',
          backgroundColor: NAVY,
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${BORDER}`,
          overflowY: 'auto',
          zIndex: 50,
          transform: isMobile
            ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)')
            : 'translateX(0)',
          transition: 'transform 0.25s ease',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '28px 20px 24px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: GOLD, letterSpacing: '5px' }}>
            NASETA
          </div>
          <div style={{ fontSize: '11px', color: CREAM, opacity: 0.5, marginTop: '4px', letterSpacing: '0.5px' }}>
            PT Upadana Semesta
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <Link href="/dashboard" onClick={closeSidebar} style={menuItemStyle('/dashboard')}>
            <HomeIcon />
            Home
          </Link>

          <div style={{ marginTop: '4px' }}>
            <Link href="/dashboard/projects" onClick={closeSidebar} style={menuItemStyle('/dashboard/projects')}>
              <FolderIcon />
              Projects
            </Link>
          </div>

          <div style={{ marginTop: '4px' }}>
            <Link href="/dashboard/pengajuan" onClick={closeSidebar} style={menuItemStyle('/dashboard/pengajuan')}>
              <FileTextIcon />
              Pengajuan
            </Link>
          </div>

          <div style={{ marginTop: '4px' }}>
            <button
              onClick={() => setDbOpen(prev => !prev)}
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
                <Link href="/dashboard/database/upah" onClick={closeSidebar} style={subMenuItemStyle('/dashboard/database/upah')}>
                  Harga Upah
                </Link>
                <Link href="/dashboard/database/material" onClick={closeSidebar} style={subMenuItemStyle('/dashboard/database/material')}>
                  Harga Material
                </Link>
                <Link href="/dashboard/database/borongan" onClick={closeSidebar} style={subMenuItemStyle('/dashboard/database/borongan')}>
                  Harga Borongan
                </Link>
                <Link href="/dashboard/database/sewa" onClick={closeSidebar} style={subMenuItemStyle('/dashboard/database/sewa')}>
                  Harga Sewa
                </Link>
              </div>
            )}
          </div>

          <div style={{ marginTop: '4px' }}>
            <Link href="/dashboard/vendors" onClick={closeSidebar} style={menuItemStyle('/dashboard/vendors')}>
              <UsersIcon />
              Vendors
            </Link>
          </div>

          {profile?.role === 'ADMIN' && (
            <div style={{ marginTop: '4px' }}>
              <Link href="/dashboard/users" onClick={closeSidebar} style={menuItemStyle('/dashboard/users')}>
                <ShieldIcon />
                Users
              </Link>
            </div>
          )}
        </nav>

        {/* Profile + Logout */}
        <div style={{ padding: '16px 12px', borderTop: `1px solid ${BORDER}` }}>
          {profile && (
            <div style={{ marginBottom: '10px', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', border: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: '13px', color: CREAM, margin: '0 0 6px 0', fontWeight: '600', lineHeight: '1.3' }}>
                {profile.nama}
              </p>
              <span style={{
                ...(ROLE_BADGE[profile.role] ?? {}),
                padding: '2px 8px', borderRadius: '4px',
                fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px',
              }}>
                {ROLE_LABEL[profile.role] ?? profile.role}
              </span>
            </div>
          )}
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

      {/* Main content */}
      <main
        style={{
          marginLeft: isMobile ? 0 : '240px',
          width: isMobile ? '100%' : 'calc(100% - 240px)',
          backgroundColor: '#F5F0E8',
          minHeight: '100vh',
          padding: isMobile ? '64px 16px 28px' : '32px',
          color: '#0D2E42',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </main>
    </div>
  )
}
