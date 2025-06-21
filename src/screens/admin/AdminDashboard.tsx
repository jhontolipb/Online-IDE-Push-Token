"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from "react-native"
import { useAuth } from "../../contexts/AuthContext"
import { supabase, type Student, type Event, type ClearanceRequest } from "../../lib/supabase"

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [clearanceRequests, setClearanceRequests] = useState<ClearanceRequest[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchStudents(), fetchEvents(), fetchClearanceRequests()])
    setLoading(false)
  }

  const fetchStudents = async () => {
    let query = supabase.from("students").select(`
        *,
        department:departments(*),
        user:users(*)
      `)

    // Apply role-based filtering
    if (user?.role === "department_admin") {
      // Department admins can only see students in their department
      // This would need additional logic to determine admin's department
    } else if (user?.role === "club_admin") {
      // Club admins can see students across departments who are club members
      query = query.select(`
        *,
        department:departments(*),
        user:users(*),
        club_members!inner(*)
      `)
    }

    const { data, error } = await query.limit(10)

    if (!error && data) {
      setStudents(data)
    }
  }

  const fetchEvents = async () => {
    const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: false }).limit(5)

    if (!error && data) {
      setEvents(data)
    }
  }

  const fetchClearanceRequests = async () => {
    const { data, error } = await supabase
      .from("clearance_requests")
      .select(`
        *,
        student:students(
          *,
          user:users(*),
          department:departments(*)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(10)

    if (!error && data) {
      setClearanceRequests(data)
    }
  }

  const approveClearance = async (requestId: string, type: "department" | "club" | "ssg") => {
    const updateField = `${type}_status`
    const approvedByField = `${type}_approved_by`
    const approvedAtField = `${type}_approved_at`

    const { error } = await supabase
      .from("clearance_requests")
      .update({
        [updateField]: "approved",
        [approvedByField]: user?.id,
        [approvedAtField]: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (error) {
      Alert.alert("Error", "Failed to approve clearance")
    } else {
      Alert.alert("Success", "Clearance approved successfully")
      fetchClearanceRequests()
    }
  }

  const rejectClearance = async (requestId: string, type: "department" | "club" | "ssg") => {
    const updateField = `${type}_status`

    const { error } = await supabase
      .from("clearance_requests")
      .update({
        [updateField]: "rejected",
      })
      .eq("id", requestId)

    if (error) {
      Alert.alert("Error", "Failed to reject clearance")
    } else {
      Alert.alert("Success", "Clearance rejected")
      fetchClearanceRequests()
    }
  }

  const getApprovalType = () => {
    switch (user?.role) {
      case "department_admin":
        return "department"
      case "club_admin":
        return "club"
      case "ssg_super_admin":
        return "ssg"
      default:
        return "department"
    }
  }

  const canApprove = (request: ClearanceRequest) => {
    const type = getApprovalType()
    const status = request[`${type}_status` as keyof ClearanceRequest]
    return status === "pending"
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Admin Dashboard</Text>
        <Text style={styles.roleText}>{user?.role?.replace("_", " ").toUpperCase()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Students</Text>
        {students.length === 0 ? (
          <Text style={styles.emptyText}>No students found</Text>
        ) : (
          students.map((student) => (
            <View key={student.id} style={styles.studentCard}>
              <Text style={styles.studentName}>
                {student.user?.first_name} {student.user?.last_name}
              </Text>
              <Text style={styles.studentInfo}>
                {student.student_id} • {student.department?.name}
              </Text>
              <Text style={styles.studentPoints}>Points: {student.points}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Clearance Requests</Text>
        {clearanceRequests.filter(canApprove).length === 0 ? (
          <Text style={styles.emptyText}>No pending requests</Text>
        ) : (
          clearanceRequests.filter(canApprove).map((request) => (
            <View key={request.id} style={styles.clearanceCard}>
              <Text style={styles.studentName}>
                {request.student?.user?.first_name} {request.student?.user?.last_name}
              </Text>
              <Text style={styles.studentInfo}>
                {request.student?.student_id} • {request.student?.department?.name}
              </Text>
              <Text style={styles.requestDate}>Requested: {new Date(request.created_at).toLocaleDateString()}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => approveClearance(request.id, getApprovalType())}
                >
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => rejectClearance(request.id, getApprovalType())}
                >
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Events</Text>
        {events.length === 0 ? (
          <Text style={styles.emptyText}>No events found</Text>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>{new Date(event.event_date).toLocaleDateString()}</Text>
              {event.location && <Text style={styles.eventLocation}>{event.location}</Text>}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  roleText: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 15,
  },
  studentCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 5,
  },
  studentInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  studentPoints: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
  },
  clearanceCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  requestDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    padding: 10,
    borderRadius: 5,
    flex: 0.48,
  },
  approveButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  actionButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  eventCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  eventLocation: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
})
