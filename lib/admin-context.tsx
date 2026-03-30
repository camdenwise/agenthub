'use client'

import { createClient } from '@/lib/supabase'
import { createContext, useContext, useEffect, useState } from 'react'

type Business = {
  id: string
  name: string
  timezone: string | null
}

type AdminContextType = {
  isAdmin: boolean
  allBusinesses: Business[]
  activeBusiness: Business | null
  setActiveBusiness: (business: Business) => void
  loading: boolean
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  allBusinesses: [],
  activeBusiness: null,
  setActiveBusiness: () => {},
  loading: true,
})

export function useAdmin() {
  return useContext(AdminContext)
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Check if current user is admin
      const { data: myBusiness } = await supabase
        .from('businesses')
        .select('id, name, is_admin, timezone')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!myBusiness) { setLoading(false); return }

      if (myBusiness.is_admin) {
        setIsAdmin(true)

        // Load all businesses for the switcher
        const { data: allBiz } = await supabase
          .from('businesses')
          .select('id, name, timezone')
          .order('name', { ascending: true })

        if (allBiz) {
          setAllBusinesses(allBiz)
        }

        // Default to the admin's own business
        setActiveBusiness({ id: myBusiness.id, name: myBusiness.name, timezone: myBusiness.timezone ?? null })
      } else {
        // Regular user — just use their own business
        setActiveBusiness({ id: myBusiness.id, name: myBusiness.name, timezone: myBusiness.timezone ?? null })
      }

      setLoading(false)
    }

    load()
  }, [])

  return (
    <AdminContext.Provider value={{ isAdmin, allBusinesses, activeBusiness, setActiveBusiness, loading }}>
      {children}
    </AdminContext.Provider>
  )
}