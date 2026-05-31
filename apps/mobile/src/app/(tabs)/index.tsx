import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Pressable } from "react-native";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../packages/backend/convex/_generated/api";
import { authClient } from "../../lib/auth-client";
import { useRouter } from "expo-router";
import { 
  ChevronDown, 
  Check, 
  ListTodo, 
  Calendar, 
  Shield, 
  MessageSquare, 
  TrendingUp, 
  Users 
} from "lucide-react-native";

export default function HomeTab() {
  const router = useRouter();
  
  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: organizations } = authClient.useListOrganizations();
  const { data: activeMember } = authClient.useActiveMember();

  const [orgModalVisible, setOrgModalVisible] = useState(false);
  const [switchingOrgId, setSwitchingOrgId] = useState<string | null>(null);

  // Fetch tasks for the active organization
  const tasks = useQuery(
    api.tasks.getTasks,
    activeOrg ? { organizationId: activeOrg.id } : "skip"
  );

  const handleSwitchOrg = async (orgId: string) => {
    setSwitchingOrgId(orgId);
    try {
      await authClient.organization.setActive({ organizationId: orgId });
      setOrgModalVisible(false);
    } catch (err) {
      console.error("Failed to switch organization", err);
    } finally {
      setSwitchingOrgId(null);
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

  // Stats calculation
  const totalTasks = tasks?.length || 0;
  const pendingTasks = tasks?.filter((t) => t.status !== "Completed" && t.status !== "Cancelled").length || 0;
  const completedTasks = tasks?.filter((t) => t.status === "Completed").length || 0;

  // Recent tasks (limit 3)
  const recentTasks = tasks 
    ? tasks.slice(0, 3)
    : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "#EAB308";
      case "In Progress":
        return "#3B82F6";
      case "Under Review":
        return "#A855F7";
      case "Completed":
        return "#10B981";
      case "Cancelled":
        return "#64748B";
      default:
        return "#94A3B8";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        {activeOrg ? (
          <TouchableOpacity 
            style={styles.orgSelector} 
            onPress={() => setOrgModalVisible(true)}
          >
            <Text style={styles.orgName} numberOfLines={1}>
              {activeOrg.name}
            </Text>
            <ChevronDown size={14} color="#94A3B8" style={styles.chevron} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.headerTitle}>Ground Control</Text>
        )}

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => router.push("/settings")}
        >
          <Text style={styles.avatarButtonText}>
            {getInitials(session?.user?.name)}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Hello, {session?.user?.name?.split(" ")[0] || "User"} 👋</Text>
          <Text style={styles.subtitle}>Welcome to Ground Control control center.</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: "rgba(59, 130, 246, 0.1)" }]}>
              <ListTodo size={16} color="#3B82F6" />
            </View>
            <Text style={styles.statNumber}>{totalTasks}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: "rgba(234, 179, 8, 0.1)" }]}>
              <TrendingUp size={16} color="#EAB308" />
            </View>
            <Text style={styles.statNumber}>{pendingTasks}</Text>
            <Text style={styles.statLabel}>Active Tasks</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
              <Check size={16} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Active Workspace Info */}
        {activeOrg && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Text style={styles.sectionCardTitle}>Workspace Overview</Text>
              <Users size={14} color="#71717A" />
            </View>
            <View style={styles.workspaceInfo}>
              <Text style={styles.orgNameLabel}>{activeOrg.name}</Text>
              <View style={styles.roleBadgeRow}>
                <View style={styles.roleBadge}>
                  <Shield size={10} color="#3B82F6" style={{ marginRight: 4 }} />
                  <Text style={styles.roleBadgeText}>
                    {activeMember?.role 
                      ? activeMember.role.charAt(0).toUpperCase() + activeMember.role.slice(1)
                      : "Member"}
                  </Text>
                </View>
                <Text style={styles.membersCount}>
                  {(activeOrg.members || []).length} members
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Tasks */}
        <View style={styles.tasksSection}>
          <Text style={styles.sectionHeaderTitle}>Recent Tasks</Text>
          {tasks === undefined ? (
            <ActivityIndicator size="small" color="#3B82F6" style={{ marginVertical: 20 }} />
          ) : recentTasks.length === 0 ? (
            <View style={styles.emptyTasksBox}>
              <Text style={styles.emptyTasksText}>No tasks created yet.</Text>
            </View>
          ) : (
            <View style={styles.recentTasksList}>
              {recentTasks.map((t) => (
                <TouchableOpacity
                  key={t._id}
                  style={styles.recentTaskItem}
                  onPress={() => {
                    router.push({
                      pathname: "/task-details",
                      params: { taskId: t._id },
                    });
                  }}
                >
                  <View style={styles.recentTaskLeft}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(t.status) }]} />
                    <Text style={styles.recentTaskTitle} numberOfLines={1}>
                      {t.title}
                    </Text>
                  </View>
                  <Calendar size={12} color="#71717A" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Shortcuts */}
        <View style={styles.tasksSection}>
          <Text style={styles.sectionHeaderTitle}>Quick Access</Text>
          <View style={styles.shortcutsRow}>
            <TouchableOpacity 
              style={styles.shortcutBtn}
              onPress={() => router.push("/(tabs)/tasks")}
            >
              <ListTodo size={16} color="#FAFAFA" />
              <Text style={styles.shortcutBtnText}>View Tasks</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.shortcutBtn}
              onPress={() => router.push("/settings")}
            >
              <Users size={16} color="#FAFAFA" />
              <Text style={styles.shortcutBtnText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Organization Switcher Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={orgModalVisible}
        onRequestClose={() => setOrgModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setOrgModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Switch Workspace</Text>
              <Text style={styles.modalSubtitle}>
                Select another workspace to view its tasks
              </Text>
            </View>

            <ScrollView style={styles.modalOrgList}>
              {(organizations || []).map((org: any) => {
                const isSelected = activeOrg?.id === org.id;
                const isSwitching = switchingOrgId === org.id;

                return (
                  <TouchableOpacity
                    key={org.id}
                    style={[
                      styles.modalOrgItem,
                      isSelected && styles.modalOrgItemActive
                    ]}
                    onPress={() => !isSelected && handleSwitchOrg(org.id)}
                    disabled={isSwitching || isSelected}
                  >
                    <View style={styles.modalOrgInfo}>
                      <Text style={styles.modalOrgName}>{org.name}</Text>
                      <Text style={styles.modalOrgSlug}>{org.slug}</Text>
                    </View>

                    {isSwitching ? (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    ) : isSelected ? (
                      <Check size={18} color="#3B82F6" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setOrgModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E24",
    backgroundColor: "#09090B",
  },
  orgSelector: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "80%",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#27272A",
    backgroundColor: "#18181B",
  },
  orgName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  chevron: {
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3B82F6",
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  avatarButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    gap: 4,
    paddingVertical: 6,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FAFAFA",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: "#A1A1AA",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  statIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FAFAFA",
  },
  statLabel: {
    fontSize: 10,
    color: "#71717A",
    fontWeight: "500",
  },
  sectionCard: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  sectionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionCardTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#71717A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  workspaceInfo: {
    gap: 6,
  },
  orgNameLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  roleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    borderColor: "rgba(37, 99, 235, 0.2)",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeText: {
    color: "#3B82F6",
    fontSize: 9,
    fontWeight: "600",
  },
  membersCount: {
    fontSize: 11,
    color: "#71717A",
  },
  tasksSection: {
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FAFAFA",
    letterSpacing: -0.2,
  },
  emptyTasksBox: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
  },
  emptyTasksText: {
    fontSize: 12,
    color: "#71717A",
    fontStyle: "italic",
  },
  recentTasksList: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 8,
    padding: 4,
    gap: 2,
  },
  recentTaskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  recentTaskLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recentTaskTitle: {
    fontSize: 12,
    color: "#E4E4E7",
    fontWeight: "500",
    maxWidth: "85%",
  },
  shortcutsRow: {
    flexDirection: "row",
    gap: 12,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
  },
  shortcutBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: "#09090B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    gap: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FAFAFA",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#71717A",
  },
  modalOrgList: {
    maxHeight: 250,
  },
  modalOrgItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: 6,
  },
  modalOrgItemActive: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
  },
  modalOrgInfo: {
    gap: 2,
    flex: 1,
  },
  modalOrgName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  modalOrgSlug: {
    fontSize: 11,
    color: "#71717A",
  },
  modalCloseButton: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27272A",
    backgroundColor: "#18181B",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FAFAFA",
  },
});
