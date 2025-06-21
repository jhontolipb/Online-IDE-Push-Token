"use client"

import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { useAuth } from "../contexts/AuthContext"
import { supabase, type UserRole } from "../lib/supabase"

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<UserRole>("student")
  const [studentId, setStudentId] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [yearLevel, setYearLevel] = useState(1)
  const [section, setSection] = useState("")
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])

  const { signIn, signUp } = useAuth()

  React.useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    const { data, error } = await supabase.from("departments").select("*").order("name")

    if (!error && data) {
      setDepartments(data)
      if (data.length > 0) {
        setDepartmentId(data[0].id)
      }
    }
  }

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) {
          Alert.alert("Login Error", error.message)
        }
      } else {
        if (!firstName || !lastName) {
          Alert.alert("Error", "Please fill in all required fields")
          setLoading(false)
          return
        }

        const userData: any = {
          role,
          first_name: firstName,
          last_name: lastName,
          phone,
        }

        if (role === "student") {
          if (!departmentId) {
            Alert.alert("Error", "Please select a department")
            setLoading(false)
            return
          }
          userData.department_id = departmentId
          userData.year_level = yearLevel
          userData.section = section
        }

        const { error } = await signUp(email, password, userData)
        if (error) {
          Alert.alert("Registration Error", error.message)
        } else {
          Alert.alert("Success", "Registration successful! Please check your email for verification.")
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>SSG Digi</Text>
          <Text style={styles.subtitle}>Digital Student Governance Platform</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>{isLogin ? "Sign In" : "Create Account"}</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#666"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#666"
          />

          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#666"
              />

              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#666"
              />

              <TextInput
                style={styles.input}
                placeholder="Phone (Optional)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#666"
              />

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Role</Text>
                <Picker selectedValue={role} onValueChange={setRole} style={styles.picker}>
                  <Picker.Item label="Student" value="student" />
                  <Picker.Item label="Officer in Charge" value="officer_in_charge" />
                  <Picker.Item label="Department Admin" value="department_admin" />
                  <Picker.Item label="Club Admin" value="club_admin" />
                  <Picker.Item label="SSG Super Admin" value="ssg_super_admin" />
                </Picker>
              </View>

              {role === "student" && (
                <>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Department</Text>
                    <Picker selectedValue={departmentId} onValueChange={setDepartmentId} style={styles.picker}>
                      {departments.map((dept) => (
                        <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
                      ))}
                    </Picker>
                  </View>

                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Year Level</Text>
                    <Picker selectedValue={yearLevel} onValueChange={setYearLevel} style={styles.picker}>
                      <Picker.Item label="1st Year" value={1} />
                      <Picker.Item label="2nd Year" value={2} />
                      <Picker.Item label="3rd Year" value={3} />
                      <Picker.Item label="4th Year" value={4} />
                    </Picker>
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Section (Optional)"
                    value={section}
                    onChangeText={setSection}
                    placeholderTextColor="#666"
                  />
                </>
              )}
            </>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchButtonText}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  form: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    color: "#000",
    marginBottom: 5,
    fontWeight: "500",
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  switchButton: {
    marginTop: 20,
    alignItems: "center",
  },
  switchButtonText: {
    color: "#666",
    fontSize: 14,
  },
})
