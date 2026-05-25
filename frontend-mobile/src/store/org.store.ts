import { create } from 'zustand'
import type { OrgWithRole } from '../types/org'

interface OrgState {
  currentOrg: OrgWithRole | null
  setCurrentOrg: (org: OrgWithRole | null) => void
}

export const useOrgStore = create<OrgState>((set) => ({
  currentOrg: null,
  setCurrentOrg: (org) => set({ currentOrg: org }),
}))