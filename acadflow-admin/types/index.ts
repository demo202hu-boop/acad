// Shared TypeScript types for AcadFlow Admin Panel

export interface UserProfile {
  id: string
  name: string
  email: string
  role: 'student' | 'teacher' | 'admin'
  enrollment_number?: string   // student enrollment ID
  department?: string          // e.g. Computer Engineering
  year?: number                // Current year: 1–4
  division?: string            // e.g. B
  batch?: string               // Practical Batch e.g. A
  avatar_url?: string | null
  copy_paste_enabled?: boolean
  created_at: string
}

export interface Submission {
  id: string
  student_id: string
  assignment_id: string | null
  practical_id: string | null
  content?: string
  status: 'draft' | 'submitted' | 'evaluated'
  submitted_at: string | null
  last_saved_at?: string
  marks: number | null
  feedback: string | null
  plagiarism_score: number
  ai_score: number | null
  viva_score: number
  viva_cleared?: boolean
  violation_logs?: any[]
  evaluated_at: string | null
  evaluated_by: string | null
  output_link?: string | null
  image_link?: string | null
  rubric_scores?: Record<string, number | null>
  // Joined relations
  student?: Pick<UserProfile, 'id' | 'name' | 'email' | 'enrollment_number' | 'department' | 'year' | 'division' | 'batch'> | null
  assignment?: { id: string; title: string; subject_id?: string; total_points?: number; rubrics?: RubricItem[] } | null
  practical?: { id: string; title: string; experiment_number?: string; total_points?: number; rubrics?: RubricItem[] } | null
}

export interface BatchPractical {
  id: string
  title: string
  description?: string
  experiment_number?: string
  division: string
  batch: string
  practical_mode?: string
  programming_language?: string
  deadline: string
  total_points: number
  rubrics?: RubricItem[]
  status: 'active' | 'closed'
  created_at: string
  created_by?: string
  updated_at?: string
  notes?: string
  resource_url?: string
  resource_link?: string
  batch_id?: string
}

export interface Assignment {
  id: string
  title: string
  description?: string
  subject_id?: string
  created_by?: string
  deadline?: string
  type?: string
  target_division?: string
  target_batch?: string
  submission_mode?: string
  total_points: number
  rubrics?: RubricItem[]
  resource_link?: string
  is_quiz?: boolean
  created_at: string
}

export interface RubricItem {
  id?: string
  title: string
  description?: string
  max_marks: number
}

export interface Batch {
  id: string
  name: string
  description?: string
  code: string
  created_by?: string
  created_at: string
  academic_year?: string
  year?: number
  division?: string
  semester?: number
  batch?: string
}

export interface Participation {
  id: string
  student_id: string
  mentor_id?: string
  event_type: string
  event_details: string
  participation_status: string
  status: 'pending' | 'approved' | 'rejected'
  points_awarded: number
  created_at: string
  event_date?: string
  event_end_date?: string
  rejection_reason?: string | null
  other_status_text?: string | null
  student?: Pick<UserProfile, 'id' | 'name' | 'email' | 'enrollment_number'>
}

export interface DashboardMetrics {
  totalStudents: number
  totalTeachers: number
  totalAdmins: number
  totalSubmissions: number
  pendingEvaluations: number
  evaluatedSubmissions: number
  averageGrade: number
  activePracticals: number
  closedPracticals: number
  totalPracticals: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
  pagination?: PaginationMeta
}

export type UserRole = 'student' | 'teacher' | 'admin' | 'all'
export type SubmissionStatus = 'draft' | 'submitted' | 'evaluated' | 'all'
