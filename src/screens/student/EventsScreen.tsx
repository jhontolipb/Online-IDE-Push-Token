"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native"
import { useAuth } from "../../contexts/AuthContext"
import { supabase, type Event } from "../../lib/supabase"

export const EventsScreen: React.FC = () => {
  const { student } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)

    let query = supabase.from("events").select("*").order("event_date", { ascending: true })

    // Filter events based on student's department or general events
    if (student?.department_id) {
      query = query.or(`department_id.eq.${student.department_id},department_id.is.null`)
    }

    const { data, error } = await query

    if (!error && data) {
      setEvents(data)
    }
    setLoading(false)
  }

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      <Text style={styles.eventTitle}>{item.title}</Text>
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
        <Text style={styles.title}>Events</Text>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEvents} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No events available</Text>}
        contentContainerStyle={styles.listContainer}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
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
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
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
})
