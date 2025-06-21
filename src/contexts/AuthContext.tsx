"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase, type User, type Student } from "../lib/supabase"

interface AuthContextType {
  session: Session | null
  user: User | null
  student: Student | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        setStudent(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

      if (userError) throw userError

      setUser(userData)

      // If user is a student, fetch student profile
      if (userData.role === "student") {
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select(`
            *,
            department:departments(*),
            user:users(*)
          `)
          .eq("user_id", userId)
          .single()

        if (!studentError && studentData) {
          setStudent(studentData)
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) return { error }

    if (data.user) {
      // Create user profile
      const { error: profileError } = await supabase.from("users").insert({
        id: data.user.id,
        email,
        ...userData,
      })

      if (profileError) return { error: profileError }

      // If registering as student, create student record
      if (userData.role === "student") {
        const qrCode = `SSG-${Date.now()}-${data.user.id.slice(0, 8)}`
        const { error: studentError } = await supabase.from("students").insert({
          user_id: data.user.id,
          student_id: `STU-${Date.now()}`,
          department_id: userData.department_id || "",
          year_level: userData.year_level || 1,
          section: userData.section || "",
          qr_code: qrCode,
        })

        if (studentError) return { error: studentError }
      }
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { error: new Error("No user logged in") }

    const { error } = await supabase.from("users").update(updates).eq("id", user.id)

    if (!error) {
      setUser({ ...user, ...updates })
    }

    return { error }
  }

  const value = {
    session,
    user,
    student,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
