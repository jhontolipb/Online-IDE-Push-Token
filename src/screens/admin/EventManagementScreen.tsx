"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
  RefreshControl,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { useAuth } from "../../contexts/AuthContext"
import { supabase, type Event, type Department, type Club } from "../../lib/supabase"

export const EventManagementScreen: React.FC = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("")
  const [location, setLocation] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [selectedClub, setSelectedClub] = useState("")
  const [isMandatory, setIsMandatory] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchEvents(), fetchDepartments(), fetchClubs()])
    setLoading(false)
  }

  const fetchEvents = async () => {
    let query = supabase.from("events").select("*").order("event_date", { ascending: false })

    // Filter based on user role
    if (user?.role === "department_admin") {
      // Department admins see their department events
      query = query.eq("created_by", user.id)
    } else if (user?.role === "club_admin") {
      // Club admins see their club events
      query = query.eq("created_by", user.id)
    }

    const { data, error } = await query

    if (!error && data) {
      setEvents(data)
    }
  }

  const fetchDepartments = async () => {
    const { data, error } = await supabase.from("departments").select("*").order("name")

    if (!error && data) {
      setDepartments(data)
    }
  }

  const fetchClubs = async () => {
    const { data, error } = await supabase.from("clubs").select("*").order("name")

    if (!error && data) {
      setClubs(data)
    }
  }

  const createEvent = async () => {
    if (!title.trim() || !eventDate || !eventTime) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    const eventDateTime = new Date(`${eventDate}T${eventTime}:00`)

    const eventData: any = {
      title: title.trim(),
      description: description.trim() || null,
      event_date: eventDateTime.toISOString(),
      location: location.trim() || null,
      created_by: user?.id,
      is_mandatory: isMandatory,
    }

    // Add department or club based on user role and selection
    if (user?.role === "department_admin" && selectedDepartment) {
      eventData.department_id = selectedDepartment
    } else if (user?.role === "club_admin" && selectedClub) {
      eventData.club_id = selectedClub
    } else if (user?.role === "ssg_super_admin") {
      // SSG can create events for departments or clubs
      if (selectedDepartment) eventData.department_id = selectedDepartment
      if (selectedClub) eventData.club_id = selectedClub
    }

    const { error } = await supabase.from("events").insert(eventData)

    if (error) {
      Alert.alert("Error", "Failed to create event")
    } else {
      Alert.alert("Success", "Event created successfully")
      resetForm()
      setShowCreateModal(false)
      fetchEvents()
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setEventDate("")
    setEventTime("")
    setLocation("")
    setSelectedDepartment("")
    setSelectedClub("")
    setIsMandatory(false)
  }

  const deleteEvent = async (eventId: string) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("events").delete().eq("id", eventId)

          if (error) {
            Alert.alert("Error", "Failed to delete event")
          } else {
            Alert.alert("Success", "Event deleted successfully")
            fetchEvents()
          }
        },
      },
    ])
  }

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteEvent(item.id)}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {item.description && <Text style={styles.eventDescription}>{item.description}</Text>}

      <Text style={styles.eventDate}>
        {new Date(item.event_date).toLocaleDateString()} at {new Date(item.event_date).toLocaleTimeString()}
      </Text>

      {item.location && <Text style={styles.eventLocation}>📍 {item.location}</Text>}

      {item.is_mandatory && (
        <View style={styles.mandatoryBadge}>
          <Text style={styles.mandatoryText}>MANDATORY</Text>
        </View>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Management</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.createButtonText}>Create Event</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No events created yet</Text>}
        contentContainerStyle={styles.listContainer}
      />

      <Modal visible={showCreateModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Event</Text>
            <TouchableOpacity onPress={createEvent}>
              <Text style={styles.saveButton}>Create</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Event description"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              value={eventDate}
              onChangeText={setEventDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Time *</Text>
            <TextInput
              style={styles.input}
              value={eventTime}
              onChangeText={setEventTime}
              placeholder="HH:MM (24-hour format)"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Event location"
              placeholderTextColor="#666"
            />

            {(user?.role === "ssg_super_admin" || user?.role === "department_admin") && (
              <>
                <Text style={styles.label}>Department</Text>
                <Picker selectedValue={selectedDepartment} onValueChange={setSelectedDepartment} style={styles.picker}>
                  <Picker.Item label="Select Department (Optional)" value="" />
                  {departments.map((dept) => (
                    <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
                  ))}
                </Picker>
              </>
            )}

            {(user?.role === "ssg_super_admin" || user?.role === "club_admin") && (
              <>
                <Text style={styles.label}>Club</Text>
                <Picker selectedValue={selectedClub} onValueChange={setSelectedClub} style={styles.picker}>
                  <Picker.Item label="Select Club (Optional)" value="" />
                  {clubs.map((club) => (
                    <Picker.Item key={club.id} label={club.name} value={club.id} />
                  ))}
                </Picker>
              </>
            )}

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Mandatory Event</Text>
              <Switch
                value={isMandatory}
                onValueChange={setIsMandatory}
                trackColor={{ false: "#767577", true: "#000" }}
                thumbColor={isMandatory ? "#fff" : "#f4f3f4"}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  createButton: {
    backgroundColor: "#000",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  createButtonText: {
    color: "white",
    fontWeight: "600",
  },
  listContainer: {
    padding: 10,
  },
  eventCard: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
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
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
  },
  deleteButton: {
    backgroundColor: "#F44336",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  eventDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  eventDate: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  eventLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  mandatoryBadge: {
    backgroundColor: "#ffebee",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 5,
  },
  mandatoryText: {
    fontSize: 12,
    color: "#d32f2f",
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 50,
    fontStyle: "italic",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  cancelButton: {
    fontSize: 16,
    color: "#666",
  },
  saveButton: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    color: "#000",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
})
