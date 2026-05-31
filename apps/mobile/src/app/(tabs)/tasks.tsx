import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Pressable } from "react-native";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../packages/backend/convex/_generated/api";
import { authClient } from "../../lib/auth-client";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { 
  Plus, 
  Check, 
  ChevronDown, 
  Calendar, 
  AlertCircle 
} from "lucide-react-native";

export default function TasksTab() {
  const { data: session } = authClient.useSession();
  const { data: activeOrg, refetch: refetchActiveOrg } = authClient.useActiveOrganization();
  const { data: organizations } = authClient.useListOrganizations();
  
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [orgModalVisible, setOrgModalVisible] = useState(false);
  const [switchingOrgId, setSwitchingOrgId] = useState<string | null>(null);

  const router = useRouter();

  // Refetch active organization when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchActiveOrg?.();
    }, [refetchActiveOrg])
  );

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

  // Filter tasks based on statusFilter state
  const filteredTasks = tasks
    ? tasks.filter((t) => {
        if (statusFilter === "All") return true;
        return t.status.toLowerCase() === statusFilter.toLowerCase();
      })
    : [];

  const getPriorityStyle = (priority: string) => {
    const num = parseInt(priority, 10);
    if (isNaN(num)) {
      switch (priority) {
        case "Low":
          return { bg: "rgba(100, 116, 139, 0.15)", text: "#94A3B8" };
        case "Normal":
          return { bg: "rgba(59, 130, 246, 0.15)", text: "#60A5FA" };
        case "High":
          return { bg: "rgba(245, 158, 11, 0.15)", text: "#FBBF24" };
        case "Urgent":
          return { bg: "rgba(249, 115, 22, 0.15)", text: "#FB923C" };
        case "Critical":
          return { bg: "rgba(239, 68, 68, 0.15)", text: "#F87171" };
        default:
          return { bg: "rgba(100, 116, 139, 0.15)", text: "#94A3B8" };
      }
    }
    if (num <= 3) return { bg: "rgba(56, 189, 248, 0.15)", text: "#38BDF8" };
    if (num <= 7) return { bg: "rgba(245, 158, 11, 0.15)", text: "#FBBF24" };
    return { bg: "rgba(239, 68, 68, 0.15)", text: "#F87171" };
  };

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

  const formatDueDate = (timestamp?: number) => {
    if (!timestamp) return "No due date";
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const getMemberUserInitials = (userId: string) => {
    const member = activeOrg?.members?.find((m: any) => m.userId === userId);
    return getInitials(member?.user?.name);
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

      <View style={styles.mainView}>
        {/* Header Title */}
        <View style={styles.viewHeader}>
          <Text style={styles.viewTitle}>Tasks</Text>
          <Text style={styles.viewSubtitle}>
            Manage and collaborate on tasks inside your team
          </Text>
        </View>

        {/* Filter Row */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {["All", "Pending", "In Progress", "Under Review", "Completed", "Cancelled"].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterTab,
                  statusFilter === status && styles.filterTabActive
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text 
                  style={[
                    styles.filterText,
                    statusFilter === status && styles.filterTextActive
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tasks List */}
        {tasks === undefined ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading tasks...</Text>
          </View>
        ) : !activeOrg ? (
          <View style={styles.centerContainer}>
            <AlertCircle size={40} color="#EF4444" />
            <Text style={styles.emptyTitle}>No Active Organization</Text>
            <Text style={styles.emptySubtitle}>
              Please switch to or create an organization to view tasks.
            </Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.centerContainer}>
            <AlertCircle size={40} color="#475569" />
            <Text style={styles.emptyTitle}>No Tasks Found</Text>
            <Text style={styles.emptySubtitle}>
              {statusFilter === "All"
                ? "Get started by creating a new task."
                : `No tasks found with status "${statusFilter}".`}
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.tasksScroll}
            contentContainerStyle={styles.tasksContent}
          >
            {filteredTasks.map((task) => {
              const priorityStyle = getPriorityStyle(task.priority);
              return (
                <TouchableOpacity
                  key={task._id}
                  style={styles.taskCard}
                  onPress={() => {
                    router.push({
                      pathname: "/task-details",
                      params: { taskId: task._id },
                    });
                  }}
                >
                  <View style={styles.taskCardHeader}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
                      <Text style={[styles.priorityText, { color: priorityStyle.text }]}>
                        Lvl {task.priority}
                      </Text>
                    </View>
                  </View>

                  {task.description ? (
                    <Text style={styles.taskDesc} numberOfLines={2}>
                      {task.description}
                    </Text>
                  ) : null}

                  <View style={styles.taskCardFooter}>
                    <View style={styles.taskInfoRow}>
                      <View 
                        style={[
                          styles.statusDot, 
                          { backgroundColor: getStatusColor(task.status) }
                        ]} 
                      />
                      <Text style={styles.statusText}>{task.status}</Text>
                      
                      <View style={styles.dotSeparator} />
                      
                      <Calendar size={12} color="#64748B" />
                      <Text style={styles.dueDateText}>
                        {formatDueDate(task.dueDate)}
                      </Text>
                    </View>

                    {/* Assignee Avatar Stack */}
                    <View style={styles.avatarStack}>
                      {task.assigneeIds && task.assigneeIds.length > 0 ? (
                        task.assigneeIds.slice(0, 3).map((userId, idx) => (
                          <View 
                            key={userId} 
                            style={[
                              styles.smallAvatar, 
                              { marginLeft: idx > 0 ? -8 : 0 }
                            ]}
                          >
                            <Text style={styles.smallAvatarText}>
                              {getMemberUserInitials(userId)}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <View style={styles.smallAvatarEmpty}>
                          <Text style={styles.smallAvatarText}>-</Text>
                        </View>
                      )}
                      {task.assigneeIds && task.assigneeIds.length > 3 ? (
                        <View style={[styles.smallAvatar, { marginLeft: -8, backgroundColor: "#334155" }]}>
                          <Text style={styles.smallAvatarText}>+{task.assigneeIds.length - 3}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Floating Action Button */}
        {activeOrg && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push("/create-task")}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

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
  mainView: {
    flex: 1,
  },
  viewHeader: {
    paddingTop: 18,
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
  filterContainer: {
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E24",
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterTabActive: {
    borderColor: "#27272A",
    backgroundColor: "#18181B",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#71717A",
  },
  filterTextActive: {
    color: "#FAFAFA",
    fontWeight: "600",
  },
  tasksScroll: {
    flex: 1,
  },
  tasksContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 90,
  },
  taskCard: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27272A",
    backgroundColor: "#09090B",
    gap: 8,
  },
  taskCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FAFAFA",
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: "700",
  },
  taskDesc: {
    fontSize: 12,
    color: "#A1A1AA",
    lineHeight: 16,
  },
  taskCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  taskInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#E4E4E7",
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#27272A",
    marginHorizontal: 2,
  },
  dueDateText: {
    fontSize: 11,
    color: "#A1A1AA",
    marginLeft: 2,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#09090B",
  },
  smallAvatarEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#27272A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#09090B",
  },
  smallAvatarText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#A1A1AA",
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FAFAFA",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#71717A",
    textAlign: "center",
    lineHeight: 18,
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
