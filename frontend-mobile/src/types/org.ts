export type OrgRole = 'owner' | 'admin' | 'manager' | 'employee'

export interface OrgWithRole {
  id: string
  name: string
  description: string | null
  is_active: boolean
  role: OrgRole
}

export const ROLE_LABELS: Record<OrgRole, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  manager: 'Менеджер',
  employee: 'Сотрудник',
}