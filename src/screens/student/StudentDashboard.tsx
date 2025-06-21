"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from "react-native"
import { useAuth } from "../../contexts/AuthContext"
import { supabase, type Event, type ClearanceRequest } from "../../lib/supabase"
import { QRCodeGenerator } from "../../components/QRCodeGenerator"

export const StudentDashboard: React.FC = () => {
  const { user, student } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [clearanceRequests, setClearanceRequests] = useState<ClearanceRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchEvents(), fetchClearanceRequests()])
    setLoading(false)
  }

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(5)

    if (!error && data) {
      setEvents(data)
    }
  }

  const fetchClearanceRequests = async () => {
    if (!student) return

    const { data, error } = await supabase
      .from("clearance_requests")
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setClearanceRequests(data)
    }
  }

  const requestClearance = async () => {
    if (!student) return

    const { error } = await supabase.from("clearance_requests").insert({
      student_id: student.id,
    })

    if (error) {
      Alert.alert("Error", "Failed to request clearance")
    } else {
      Alert.alert("Success", "Clearance request submitted successfully")
      fetchClearanceRequests()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#4CAF50"
      case "rejected":
        return "#F44336"
      default:
        return "#FF9800"
    }
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.first_name} {user?.last_name}
        </Text>
        <Text style={styles.studentInfo}>
          {student?.student_id} • {student?.department?.name}
        </Text>
        <Text style={styles.pointsText}>Points: {student?.points || 0}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowQR(!showQR)}>
            <Text style={styles.actionButtonText}>{showQR ? "Hide QR Code" : "Show QR Code"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={requestClearance}>
            <Text style={styles.actionButtonText}>Request Clearance</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showQR && student && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your QR Code</Text>
          <View style={styles.qrContainer}>
            <QRCodeGenerator value={student.qr_code} size={200} />
            <Text style={styles.qrText}>{student.qr_code}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        {events.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming events</Text>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>{new Date(event.event_date).toLocaleDateString()}</Text>
              {event.location && <Text style={styles.eventLocation}>{event.location}</Text>}
              {event.is_mandatory && <Text style={styles.mandatoryText}>MANDATORY</Text>}
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Clearance Status</Text>
        {clearanceRequests.length === 0 ? (
          <Text style={styles.emptyText}>No clearance requests</Text>
        ) : (
          clearanceRequests.slice(0, 3).map((request) => (
            <View key={request.id} style={styles.clearanceCard}>
              <Text style={styles.clearanceDate}>Requested: {new Date(request.created_at).toLocaleDateString()}</Text>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Department:</Text>
                <Text style={[styles.statusText, { color: getStatusColor(request.department_status) }]}>
                  {request.department_status.toUpperCase()}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Club:</Text>
                <Text style={[styles.statusText, { color: getStatusColor(request.club_status) }]}>
                  {request.club_status.toUpperCase()}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>SSG:</Text>
                <Text style={[styles.statusText, { color: getStatusColor(request.ssg_status) }]}>
                  {request.ssg_status.toUpperCase()}
                </Text>
              </View>
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
  studentInfo: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
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
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
  },
  actionButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  qrContainer: {
    alignItems: "center",
  },
  qrText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
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
    marginBottom: 3,
  },
  mandatoryText: {
    fontSize: 12,
    color: "#F44336",
    fontWeight: "bold",
  },
  clearanceCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  clearanceDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  statusLabel: {
    fontSize: 14,
    color: "#000",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
})
