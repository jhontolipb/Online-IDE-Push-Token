"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from "react-native"
import { useAuth } from "../contexts/AuthContext"

export const ProfileScreen: React.FC = () => {
  const { user, student, signOut, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState(user?.first_name || "")
  const [lastName, setLastName] = useState(user?.last_name || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)

    const { error } = await updateProfile({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
    })

    if (error) {
      Alert.alert("Error", "Failed to update profile")
    } else {
      Alert.alert("Success", "Profile updated successfully")
      setIsEditing(false)
    }

    setLoading(false)
  }

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ])
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.editButtonText}>{isEditing ? "Cancel" : "Edit"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{user?.email}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>First Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor="#666"
            />
          ) : (
            <Text style={styles.fieldValue}>{user?.first_name || "Not set"}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Last Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor="#666"
            />
          ) : (
            <Text style={styles.fieldValue}>{user?.last_name || "Not set"}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Phone</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.fieldValue}>{user?.phone || "Not set"}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Role</Text>
          <Text style={styles.fieldValue}>{user?.role?.replace("_", " ").toUpperCase()}</Text>
        </View>

        {isEditing && (
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>{loading ? "Saving..." : "Save Changes"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {student && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Information</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Student ID</Text>
            <Text style={styles.fieldValue}>{student.student_id}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Department</Text>
            <Text style={styles.fieldValue}>{student.department?.name}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Year Level</Text>
            <Text style={styles.fieldValue}>
              {student.year_level}
              {student.year_level === 1
                ? "st"
                : student.year_level === 2
                  ? "nd"
                  : student.year_level === 3
                    ? "rd"
                    : "th"}{" "}
              Year
            </Text>
          </View>

          {student.section && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Section</Text>
              <Text style={styles.fieldValue}>{student.section}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Points</Text>
            <Text style={styles.fieldValue}>{student.points}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
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
  editButton: {
    backgroundColor: "#000",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  editButtonText: {
    color: "white",
    fontWeight: "600",
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
  field: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: "#000",
  },
  saveButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#666",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  signOutButton: {
    backgroundColor: "#F44336",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  signOutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})
