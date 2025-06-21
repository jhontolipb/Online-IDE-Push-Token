"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal } from "react-native"
import { useAuth } from "../../contexts/AuthContext"
import { supabase, type Event } from "../../lib/supabase"
import { QRCodeScanner } from "../../components/QRCodeScanner"

export const OICDashboard: React.FC = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })

    if (!error && data) {
      setEvents(data)
    }
  }

  const fetchAttendanceRecords = async (eventId: string) => {
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        *,
        student:students(
          *,
          user:users(*)
        )
      `)
      .eq("event_id", eventId)
      .order("timestamp", { ascending: false })

    if (!error && data) {
      setAttendanceRecords(data)
    }
  }

  const handleQRScan = async (qrData: string) => {
    if (!selectedEvent) {
      Alert.alert("Error", "Please select an event first")
      setShowScanner(false)
      return
    }

    try {
      // Find student by QR code
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select(`
          *,
          user:users(*)
        `)
        .eq("qr_code", qrData)
        .single()

      if (studentError || !studentData) {
        Alert.alert("Error", "Invalid QR code or student not found")
        setShowScanner(false)
        return
      }

      // Check if student already has an "IN" record for this event
      const { data: existingAttendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentData.id)
        .eq("event_id", selectedEvent.id)
        .order("timestamp", { ascending: false })
        .limit(1)

      let attendanceType: "in" | "out" = "in"

      if (existingAttendance && existingAttendance.length > 0) {
        const lastRecord = existingAttendance[0]
        attendanceType = lastRecord.type === "in" ? "out" : "in"
      }

      // Record attendance
      const { error: insertError } = await supabase.from("attendance").insert({
        student_id: studentData.id,
        event_id: selectedEvent.id,
        type: attendanceType,
        recorded_by: user?.id,
        location: "Event Venue",
      })

      if (insertError) {
        Alert.alert("Error", "Failed to record attendance")
      } else {
        Alert.alert(
          "Success",
          `${attendanceType.toUpperCase()} recorded for ${studentData.user?.first_name} ${studentData.user?.last_name}`` recorded for ${studentData.user?.first_name} ${studentData.user?.last_name}`,
        )
        fetchAttendanceRecords(selectedEvent.id)
      }
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setShowScanner(false)
    }
  }

  const selectEvent = (event: Event) => {
    setSelectedEvent(event)
    fetchAttendanceRecords(event.id)
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>OIC Dashboard</Text>
        <Text style={styles.roleText}>Officer in Charge</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Event</Text>
        {events.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming events</Text>
        ) : (
          events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[styles.eventCard, selectedEvent?.id === event.id && styles.selectedEventCard]}
              onPress={() => selectEvent(event)}
            >
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>{new Date(event.event_date).toLocaleDateString()}</Text>
              {event.location && <Text style={styles.eventLocation}>{event.location}</Text>}
            </TouchableOpacity>
          ))
        )}
      </View>

      {selectedEvent && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Actions</Text>
          <TouchableOpacity style={styles.scanButton} onPress={() => setShowScanner(true)}>
            <Text style={styles.scanButtonText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedEvent && attendanceRecords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Attendance</Text>
          {attendanceRecords.slice(0, 10).map((record) => (
            <View key={record.id} style={styles.attendanceCard}>
              <Text style={styles.studentName}>
                {record.student?.user?.first_name} {record.student?.user?.last_name}
              </Text>
              <Text style={styles.attendanceInfo}>
                {record.type.toUpperCase()} • {new Date(record.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Modal visible={showScanner} animationType="slide">
        <QRCodeScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
      </Modal>
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
  eventCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedEventCard: {
    borderColor: "#000",
    backgroundColor: "#e8e8e8",
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
  scanButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  scanButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  attendanceCard: {
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
  attendanceInfo: {
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
