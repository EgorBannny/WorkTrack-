export interface Project {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  creator: { id: string; display_name: string; email: string } | null
}