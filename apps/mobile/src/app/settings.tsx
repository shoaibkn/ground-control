import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: activeMember } = authClient.useActiveMember();

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
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#FAFAFA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView 
        style={styles.mainView}
        contentContainerStyle={styles.profileContainer}
      >
        <View style={styles.viewHeader}>
          <Text style={styles.viewTitle}>Account Profile</Text>
          <Text style={styles.viewSubtitle}>
            Manage organization roles and settings
          </Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(session?.user?.name)}</Text>
          </View>

          <Text style={styles.userName}>{session?.user?.name || "Anonymous User"}</Text>
          <Text style={styles.userEmail}>{session?.user?.email || "No email provided"}</Text>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {activeMember?.role 
                ? activeMember.role.charAt(0).toUpperCase() + activeMember.role.slice(1)
                : "Member"}
            </Text>
          </View>
        </View>

        {/* Org details */}
        {activeOrg && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Active Workspace</Text>
            <Text style={styles.orgDetailsName}>{activeOrg.name}</Text>
            <Text style={styles.orgDetailsSlug}>Slug: {activeOrg.slug}</Text>
          </View>
        )}

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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090B",
  },
  header: {
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E24",
    backgroundColor: "#09090B",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FAFAFA",
  },
  mainView: {
    flex: 1,
  },
  profileContainer: {
    paddingTop: 18,
    paddingBottom: 40,
    gap: 20,
  },
  viewHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  viewTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FAFAFA",
    letterSpacing: -0.5,
  },
  viewSubtitle: {
    fontSize: 12,
    color: "#A1A1AA",
    marginTop: 2,
  },
  profileCard: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    marginHorizontal: 16,
    alignItems: "center",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FAFAFA",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: "#A1A1AA",
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#71717A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  orgDetailsName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  orgDetailsSlug: {
    fontSize: 12,
    color: "#A1A1AA",
  },
  signOutButton: {
    backgroundColor: "#DC2626",
    borderRadius: 8,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signOutButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
