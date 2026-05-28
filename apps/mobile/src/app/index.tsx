import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { useRouter } from "expo-router";

export default function Index() {
  const { data: session } = authClient.useSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await authClient.signOut();
      router.replace("/(auth)/sign-in");
    } catch (e) {
      console.error("Sign out failed", e);
    } finally {
      setLoggingOut(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "GC";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ground Control</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(session?.user?.name)}</Text>
          </View>

          <Text style={styles.userName}>{session?.user?.name || "Anonymous User"}</Text>
          <Text style={styles.userEmail}>{session?.user?.email || "No email provided"}</Text>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>Authenticated</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.signOutButton, loggingOut && styles.buttonDisabled]}
          onPress={handleSignOut}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F19",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.08)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#3B82F6",
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 32,
  },
  profileCard: {
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderColor: "rgba(71, 85, 105, 0.2)",
    borderWidth: 1,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 15,
    color: "#94A3B8",
    marginBottom: 20,
  },
  badge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  badgeText: {
    color: "#34D399",
    fontSize: 12,
    fontWeight: "600",
  },
  signOutButton: {
    backgroundColor: "#EF4444",
    borderRadius: 16,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "rgba(239, 68, 68, 0.6)",
  },
  signOutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
