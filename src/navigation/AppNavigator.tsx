"use client"

import type React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../contexts/AuthContext"
import { AuthScreen } from "../screens/AuthScreen"
import { StudentDashboard } from "../screens/student/StudentDashboard"
import { AdminDashboard } from "../screens/admin/AdminDashboard"
import { OICDashboard } from "../screens/oic/OICDashboard"
import { MessagesScreen } from "../screens/MessagesScreen"
import { ProfileScreen } from "../screens/ProfileScreen"
import { EventsScreen } from "../screens/student/EventsScreen"
import { ClearanceScreen } from "../screens/student/ClearanceScreen"
import { EventManagementScreen } from "../screens/admin/EventManagementScreen"

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

const StudentTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap

        if (route.name === "Dashboard") {
          iconName = focused ? "home" : "home-outline"
        } else if (route.name === "Events") {
          iconName = focused ? "calendar" : "calendar-outline"
        } else if (route.name === "Clearance") {
          iconName = focused ? "document" : "document-outline"
        } else if (route.name === "Messages") {
          iconName = focused ? "mail" : "mail-outline"
        } else if (route.name === "Profile") {
          iconName = focused ? "person" : "person-outline"
        } else {
          iconName = "help-outline"
        }

        return <Ionicons name={iconName} size={size} color={color} />
      },
      tabBarActiveTintColor: "#000",
      tabBarInactiveTintColor: "#666",
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={StudentDashboard} />
    <Tab.Screen name="Events" component={EventsScreen} />
    <Tab.Screen name="Clearance" component={ClearanceScreen} />
    <Tab.Screen name="Messages" component={MessagesScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
)

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap

        if (route.name === "Dashboard") {
          iconName = focused ? "grid" : "grid-outline"
        } else if (route.name === "Events") {
          iconName = focused ? "calendar" : "calendar-outline"
        } else if (route.name === "Messages") {
          iconName = focused ? "mail" : "mail-outline"
        } else if (route.name === "Profile") {
          iconName = focused ? "person" : "person-outline"
        } else {
          iconName = "help-outline"
        }

        return <Ionicons name={iconName} size={size} color={color} />
      },
      tabBarActiveTintColor: "#000",
      tabBarInactiveTintColor: "#666",
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={AdminDashboard} />
    <Tab.Screen name="Events" component={EventManagementScreen} />
    <Tab.Screen name="Messages" component={MessagesScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
)

const OICTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap

        if (route.name === "Dashboard") {
          iconName = focused ? "scan" : "scan-outline"
        } else if (route.name === "Messages") {
          iconName = focused ? "mail" : "mail-outline"
        } else if (route.name === "Profile") {
          iconName = focused ? "person" : "person-outline"
        } else {
          iconName = "help-outline"
        }

        return <Ionicons name={iconName} size={size} color={color} />
      },
      tabBarActiveTintColor: "#000",
      tabBarInactiveTintColor: "#666",
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={OICDashboard} />
    <Tab.Screen name="Messages" component={MessagesScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
)

export const AppNavigator: React.FC = () => {
  const { session, user, loading } = useAuth()

  if (loading) {
    return null // You could add a loading screen here
  }

  if (!session || !user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    )
  }

  const getTabNavigator = () => {
    switch (user.role) {
      case "student":
        return StudentTabs
      case "officer_in_charge":
        return OICTabs
      case "department_admin":
      case "club_admin":
      case "ssg_super_admin":
        return AdminTabs
      default:
        return StudentTabs
    }
  }

  const TabNavigator = getTabNavigator()

  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  )
}
