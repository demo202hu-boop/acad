'use client'

import { useState, useEffect } from 'react'
import MaintenanceOverlay from '@/components/MaintenanceOverlay'

/**
 * Client-side gate — fetches real maintenance status from server API.
 * The middleware already blocks non-JS clients (crawlers, direct URL access, incognito).
 * This handles the in-app SPA experience after JS loads.
 */
export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [maintenance, setMaintenance] = useState(false)
  const [checked, setChecked]         = useState(false)

  useEffect(() => {
    fetch('/api/admin/maintenance')
      .then(r => r.json())
      .then(json => { setMaintenance(json.active === true) })
      .catch(() => {/* fail open */})
      .finally(() => setChecked(true))
  }, [])

  const disableMaintenance = async () => {
    // The overlay's mkc-unlock calls the API directly via the maintenance page script.
    // If somehow reached here, just reload so middleware re-checks.
    window.location.reload()
  }

  // Don't render anything until we've checked — avoids flash of wrong content
  if (!checked) return null

  if (maintenance) return <MaintenanceOverlay onDisable={disableMaintenance} />

  return <>{children}</>
}
