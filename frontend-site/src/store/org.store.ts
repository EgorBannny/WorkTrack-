import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OrgWithRole } from '@/types/org'

interface OrgStore {
  currentOrg: OrgWithRole | null
  setCurrentOrg: (org: OrgWithRole | null) => void
}

export const useOrgStore = create<OrgStore>()(
  persist(
    (set) => ({
      currentOrg: null,
      setCurrentOrg: (org) => set({ currentOrg: org }),
    }),
    { name: 'wt-org' },
  ),
)