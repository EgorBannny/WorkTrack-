export interface ProjectCreator {
  id: string
  email: string
  display_name: string
}

export interface Project {
  id: string
  org_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  creator: ProjectCreator | null
}

export interface ProjectMember {
  user_id: string
  project_id: string
  created_at: string
  user: ProjectCreator
}