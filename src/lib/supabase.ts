import { createClient } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { AppState } from "react-native"

const supabaseUrl = "https://ahgkfextlywgyizyplpa.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZ2tmZXh0bHl3Z3lpenlwbHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTA3NDUsImV4cCI6MjA2NTQ4Njc0NX0.uXY6Ka9Nsr-x-kvyLPhVG_83IlXOmfXffjM-jNLAP0Q"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Handle app state changes for auto-refresh
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export type UserRole = "ssg_super_admin" | "club_admin" | "department_admin" | "officer_in_charge" | "student"

export interface User {
  id: string
  email: string
  role: UserRole
  first_name?: string
  last_name?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  user_id: string
  student_id: string
  department_id: string
  year_level: number
  section?: string
  qr_code: string
  points: number
  created_at: string
  updated_at: string
  department?: Department
  user?: User
}

export interface Department {
  id: string
  name: string
  code: string
  created_at: string
  updated_at: string
}

export interface Club {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  description?: string
  event_date: string
  location?: string
  created_by: string
  department_id?: string
  club_id?: string
  is_mandatory: boolean
  created_at: string
  updated_at: string
}

export interface ClearanceRequest {
  id: string
  student_id: string
  department_status: "pending" | "approved" | "rejected"
  club_status: "pending" | "approved" | "rejected"
  ssg_status: "pending" | "approved" | "rejected"
  pdf_url?: string
  created_at: string
  updated_at: string
  student?: Student
}

export interface Message {
  id: string
  from_user_id: string
  to_user_id: string
  subject: string
  content: string
  is_read: boolean
  created_at: string
  from_user?: User
  to_user?: User
}
