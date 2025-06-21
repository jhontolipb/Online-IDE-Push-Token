"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from "react-native"
import { useAuth } from "../../contexts/AuthContext"
import { supabase, type ClearanceRequest } from "../../lib/supabase"
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"

export const ClearanceScreen: React.FC = () => {
  const { student, user } = useAuth()
  const [clearanceRequests, setClearanceRequests] = useState<ClearanceRequest[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchClearanceRequests()
  }, [])

  const fetchClearanceRequests = async () => {
    if (!student) return

    setLoading(true)
    const { data, error } = await supabase
      .from("clearance_requests")
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setClearanceRequests(data)
    }
    setLoading(false)
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

  const generatePDF = async (request: ClearanceRequest) => {
    if (!student || !user) return

    const isFullyApproved =
      request.department_status === "approved" &&
      request.club_status === "approved" &&
      request.ssg_status === "approved"

    if (!isFullyApproved) {
      Alert.alert("Error", "Clearance must be fully approved to generate PDF")
      return
    }

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .student-info { margin: 20px 0; }
            .approval-section { margin: 15px 0; }
            .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
            .qr-code { text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">SSG DIGITAL CLEARANCE</div>
            <p>Student Governance Clearance Certificate</p>
          </div>
          
          <div class="student-info">
            <p><strong>Student Name:</strong> ${user.first_name} ${user.last_name}</p>
            <p><strong>Student ID:</strong> ${student.student_id}</p>
            <p><strong>Department:</strong> ${student.department?.name}</p>
            <p><strong>Year Level:</strong> ${student.year_level}</p>
            <p><strong>Date Issued:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="approval-section">
            <h3>Clearance Status:</h3>
            <p>✅ Department: APPROVED</p>
            <p>✅ Club: APPROVED</p>
            <p>✅ SSG: APPROVED</p>
          </div>

          <div class="qr-code">
            <p><strong>Verification Code:</strong> ${student.qr_code}</p>
            <p>This clearance is digitally verified and valid.</p>
          </div>

          <div class="signature-section">
            <div>
              <p>_____________________</p>
              <p>Department Representative</p>
            </div>
            <div>
              <p>_____________________</p>
              <p>SSG Representative</p>
            </div>
          </div>
        </body>
      </html>
    `

    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      })

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri)
      } else {
        Alert.alert("Success", "PDF generated successfully")
      }
    } catch (error) {
      Alert.alert("Error", "Failed to generate PDF")
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

  const getOverallStatus = (request: ClearanceRequest) => {
    if (
      request.department_status === "approved" &&
      request.club_status === "approved" &&
      request.ssg_status === "approved"
    ) {
      return "FULLY APPROVED"
    }
    if (
      request.department_status === "rejected" ||
      request.club_status === "rejected" ||
      request.ssg_status === "rejected"
    ) {
      return "REJECTED"
    }
    return "PENDING"
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchClearanceRequests} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>E-Clearance</Text>
        <TouchableOpacity style={styles.requestButton} onPress={requestClearance}>
          <Text style={styles.requestButtonText}>Request New Clearance</Text>
        </TouchableOpacity>
      </View>

      {clearanceRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No clearance requests yet</Text>
          <Text style={styles.emptySubtext}>Tap "Request New Clearance" to get started</Text>
        </View>
      ) : (
        clearanceRequests.map((request) => (
          <View key={request.id} style={styles.clearanceCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.requestDate}>Requested: {new Date(request.created_at).toLocaleDateString()}</Text>
              <Text
                style={[
                  styles.overallStatus,
                  {
                    color: getStatusColor(
                      getOverallStatus(request) === "FULLY APPROVED"
                        ? "approved"
                        : getOverallStatus(request) === "REJECTED"
                          ? "rejected"
                          : "pending",
                    ),
                  },
                ]}
              >
                {getOverallStatus(request)}
              </Text>
            </View>

            <View style={styles.statusContainer}>
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

            {getOverallStatus(request) === "FULLY APPROVED" && (
              <TouchableOpacity style={styles.downloadButton} onPress={() => generatePDF(request)}>
                <Text style={styles.downloadButtonText}>Download PDF</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  requestButton: {
    backgroundColor: "#000",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  requestButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  clearanceCard: {
    backgroundColor: "white",
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  requestDate: {
    fontSize: 14,
    color: "#666",
  },
  overallStatus: {
    fontSize: 14,
    fontWeight: "bold",
  },
  statusContainer: {
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  downloadButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  downloadButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
})
