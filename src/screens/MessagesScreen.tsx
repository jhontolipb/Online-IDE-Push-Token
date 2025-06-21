"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from "react-native"
import { useAuth } from "../contexts/AuthContext"
import { supabase, type Message, type User } from "../lib/supabase"

export const MessagesScreen: React.FC = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [showCompose, setShowCompose] = useState(false)
  const [recipients, setRecipients] = useState<User[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null)
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMessages()
    fetchRecipients()
  }, [])

  const fetchMessages = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        from_user:users!messages_from_user_id_fkey(*),
        to_user:users!messages_to_user_id_fkey(*)
      `)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setMessages(data)
    }
  }

  const fetchRecipients = async () => {
    if (!user) return

    let query = supabase.from("users").select("*")

    // Filter recipients based on user role
    if (user.role === "student") {
      // Students can message admins
      query = query.in("role", ["department_admin", "club_admin", "ssg_super_admin"])
    } else {
      // Admins can message students and other admins
      query = query.neq("id", user.id)
    }

    const { data, error } = await query

    if (!error && data) {
      setRecipients(data)
    }
  }

  const sendMessage = async () => {
    if (!selectedRecipient || !subject.trim() || !content.trim()) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)

    const { error } = await supabase.from("messages").insert({
      from_user_id: user?.id,
      to_user_id: selectedRecipient.id,
      subject: subject.trim(),
      content: content.trim(),
    })

    if (error) {
      Alert.alert("Error", "Failed to send message")
    } else {
      Alert.alert("Success", "Message sent successfully")
      setShowCompose(false)
      setSelectedRecipient(null)
      setSubject("")
      setContent("")
      fetchMessages()
    }

    setLoading(false)
  }

  const markAsRead = async (messageId: string) => {
    await supabase.from("messages").update({ is_read: true }).eq("id", messageId).eq("to_user_id", user?.id)

    fetchMessages()
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isReceived = item.to_user_id === user?.id
    const otherUser = isReceived ? item.from_user : item.to_user

    return (
      <TouchableOpacity
        style={[styles.messageCard, !item.is_read && isReceived && styles.unreadMessage]}
        onPress={() => isReceived && !item.is_read && markAsRead(item.id)}
      >
        <View style={styles.messageHeader}>
          <Text style={styles.messageUser}>
            {isReceived ? "From" : "To"}: {otherUser?.first_name} {otherUser?.last_name}
          </Text>
          <Text style={styles.messageDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.messageSubject}>{item.subject}</Text>
        <Text style={styles.messageContent} numberOfLines={2}>
          {item.content}
        </Text>
        {!item.is_read && isReceived && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.composeButton} onPress={() => setShowCompose(true)}>
          <Text style={styles.composeButtonText}>Compose</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMessages} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No messages</Text>}
      />

      <Modal visible={showCompose} animationType="slide">
        <View style={styles.composeContainer}>
          <View style={styles.composeHeader}>
            <TouchableOpacity onPress={() => setShowCompose(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.composeTitle}>New Message</Text>
            <TouchableOpacity onPress={sendMessage} disabled={loading}>
              <Text style={[styles.sendButton, loading && styles.disabledButton]}>Send</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.composeForm}>
            <Text style={styles.label}>To:</Text>
            <TouchableOpacity
              style={styles.recipientSelector}
              onPress={() => {
                // You could implement a recipient picker modal here
                Alert.alert("Select Recipient", "Feature coming soon")
              }}
            >
              <Text style={styles.recipientText}>
                {selectedRecipient
                  ? `${selectedRecipient.first_name} ${selectedRecipient.last_name}`
                  : "Select recipient..."}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Subject:</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Enter subject"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Message:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Enter your message"
              placeholderTextColor="#666"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
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
  composeButton: {
    backgroundColor: "#000",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  composeButtonText: {
    color: "white",
    fontWeight: "600",
  },
  messageCard: {
    backgroundColor: "white",
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    position: "relative",
  },
  unreadMessage: {
    borderLeftWidth: 4,
    borderLeftColor: "#000",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  messageUser: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  messageDate: {
    fontSize: 12,
    color: "#999",
  },
  messageSubject: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 5,
  },
  messageContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  unreadIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#000",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 50,
    fontStyle: "italic",
  },
  composeContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  composeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  composeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  cancelButton: {
    fontSize: 16,
    color: "#666",
  },
  sendButton: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },
  disabledButton: {
    color: "#ccc",
  },
  composeForm: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 5,
    marginTop: 15,
  },
  recipientSelector: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  recipientText: {
    fontSize: 16,
    color: "#000",
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
    height: 120,
  },
})
