import { View, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Pressable } from "react-native";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../packages/backend/convex/_generated/api";
import { authClient } from "../../lib/auth-client";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { 
  Check, 
  ChevronDown, 
  Calendar, 
  AlertCircle 
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/ui/header";

export default function TasksTab() {
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

  const getPriorityClasses = (priority: string) => {
    const num = parseInt(priority, 10);
    if (isNaN(num)) {
      switch (priority) {
        case "Low":
          return { bg: "bg-slate-500/10 border border-slate-500/20", text: "text-slate-400" };
        case "Normal":
          return { bg: "bg-blue-500/10 border border-blue-500/20", text: "text-blue-400" };
        case "High":
          return { bg: "bg-yellow-500/10 border border-yellow-500/20", text: "text-yellow-500" };
        case "Urgent":
          return { bg: "bg-orange-500/10 border border-orange-500/20", text: "text-orange-500" };
        case "Critical":
          return { bg: "bg-red-500/10 border border-red-500/20", text: "text-red-400" };
        default:
          return { bg: "bg-slate-500/10 border border-slate-500/20", text: "text-slate-400" };
      }
    }
    if (num <= 3) return { bg: "bg-sky-500/10 border border-sky-500/20", text: "text-sky-400" };
    if (num <= 7) return { bg: "bg-yellow-500/10 border border-yellow-500/20", text: "text-yellow-500" };
    return { bg: "bg-red-500/10 border border-red-500/20", text: "text-red-400" };
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500";
      case "In Progress":
        return "bg-blue-500";
      case "Under Review":
        return "bg-purple-500";
      case "Completed":
        return "bg-emerald-500";
      case "Cancelled":
        return "bg-slate-500";
      default:
        return "bg-slate-400";
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

  // Borderless Switcher header
  const titleNode = activeOrg ? (
    <TouchableOpacity 
      className="flex-row items-center max-w-[80%] py-1 px-2 rounded-md border border-border bg-card"
      onPress={() => setOrgModalVisible(true)}
    >
      <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
        {activeOrg.name}
      </Text>
      <ChevronDown size={14} className="ml-1.5 text-muted-foreground" />
    </TouchableOpacity>
  ) : (
    <Text className="text-base font-bold text-primary">Ground Control</Text>
  );

  return (
    <View className="flex-1 bg-background">
      <Header title={titleNode} />

      <View className="flex-1">
        {/* Header Title */}
        <View className="pt-[18px] px-5 pb-3">
          <Text className="text-xl font-bold text-foreground tracking-tight">Tasks</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Manage and collaborate on tasks inside your team
          </Text>
        </View>

        {/* Filter Row */}
        <View className="h-11 border-b border-border">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, alignItems: "center", gap: 8 }}
          >
            {["All", "Pending", "In Progress", "Under Review", "Completed", "Cancelled"].map((status) => (
              <TouchableOpacity
                key={status}
                className={`px-3 py-1.5 rounded-md border ${
                  statusFilter === status 
                    ? "border-border bg-card" 
                    : "border-transparent"
                }`}
                onPress={() => setStatusFilter(status)}
              >
                <Text 
                  className={`text-xs ${
                    statusFilter === status 
                      ? "text-foreground font-semibold" 
                      : "text-muted-foreground font-medium"
                  }`}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tasks List */}
        {!activeOrg ? (
          <View className="flex-1 justify-center items-center p-8 gap-3">
            <AlertCircle size={40} className="text-destructive" />
            <Text className="text-sm font-semibold text-foreground mt-2">No Active Organization</Text>
            <Text className="text-xs text-muted-foreground text-center leading-5">
              Please switch to or create an organization to view tasks.
            </Text>
          </View>
        ) : tasks === undefined ? (
          <View className="flex-1 justify-center items-center p-8 gap-3">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-xs text-muted-foreground mt-1">Loading tasks...</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View className="flex-1 justify-center items-center p-8 gap-3">
            <AlertCircle size={40} className="text-muted-foreground" />
            <Text className="text-sm font-semibold text-foreground mt-2">No Tasks Found</Text>
            <Text className="text-xs text-muted-foreground text-center leading-5">
              {statusFilter === "All"
                ? "Get started by creating a new task."
                : `No tasks found with status "${statusFilter}".`}
            </Text>
          </View>
        ) : (
          <ScrollView 
            className="flex-1"
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          >
            {filteredTasks.map((task) => {
              const priorityClasses = getPriorityClasses(task.priority);
              return (
                <TouchableOpacity
                  key={task._id}
                  className="p-3.5 rounded-lg border border-border bg-card gap-2"
                  onPress={() => {
                    router.push({
                      pathname: "/task-details",
                      params: { taskId: task._id },
                    });
                  }}
                >
                  <View className="flex-row justify-between items-center gap-2">
                    <Text className="text-sm font-semibold text-foreground flex-1" numberOfLines={1}>
                      {task.title}
                    </Text>
                    <Badge className={`px-1.5 py-0.5 rounded-md ${priorityClasses.bg}`}>
                      <Text className={`text-[9px] font-bold ${priorityClasses.text}`}>
                        Lvl {task.priority}
                      </Text>
                    </Badge>
                  </View>

                  {task.description ? (
                    <Text className="text-xs text-muted-foreground leading-4" numberOfLines={2}>
                      {task.description}
                    </Text>
                  ) : null}

                  <View className="flex-row justify-between items-center mt-1">
                    <View className="flex-row items-center gap-1.5">
                      <View className={`w-1.5 h-1.5 rounded-full ${getStatusColorClass(task.status)}`} />
                      <Text className="text-[11px] font-medium text-foreground">{task.status}</Text>
                      
                      <View className="w-1 h-1 rounded-full bg-border mx-1" />
                      
                      <Calendar size={12} className="text-muted-foreground" />
                      <Text className="text-[11px] text-muted-foreground ml-0.5">
                        {formatDueDate(task.dueDate)}
                      </Text>
                    </View>

                    {/* Assignee Avatar Stack */}
                    <View className="flex-row items-center">
                      {task.assigneeIds && task.assigneeIds.length > 0 ? (
                        task.assigneeIds.slice(0, 3).map((userId, idx) => (
                          <View 
                            key={userId} 
                            className="w-5.5 h-5.5 rounded-full bg-primary justify-center items-center border-2 border-card"
                            style={{ marginLeft: idx > 0 ? -8 : 0 }}
                          >
                            <Text className="text-[8px] font-bold text-primary-foreground">
                              {getMemberUserInitials(userId)}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <View className="w-5.5 h-5.5 rounded-full bg-border justify-center items-center border-2 border-card">
                          <Text className="text-[8px] font-bold text-muted-foreground">-</Text>
                        </View>
                      )}
                      {task.assigneeIds && task.assigneeIds.length > 3 ? (
                        <View className="w-5.5 h-5.5 rounded-full bg-slate-700 justify-center items-center border-2 border-card -ml-2">
                          <Text className="text-[8px] font-bold text-white">+{task.assigneeIds.length - 3}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
          className="flex-1 bg-black/75 justify-center items-center p-6"
          onPress={() => setOrgModalVisible(false)}
        >
          <Card className="w-full max-h-[80%] p-5 gap-4 bg-background border-border shadow-2xl">
            <View className="gap-1">
              <Text className="text-base font-bold text-foreground">Switch Workspace</Text>
              <Text className="text-xs text-muted-foreground">
                Select another workspace to view its tasks
              </Text>
            </View>

            <ScrollView className="max-h-[250px]">
              {(organizations || []).map((org: any) => {
                const isSelected = activeOrg?.id === org.id;
                const isSwitching = switchingOrgId === org.id;

                return (
                  <TouchableOpacity
                    key={org.id}
                    className={`flex-row justify-between items-center py-3 px-3 rounded-lg border mb-1.5 ${
                      isSelected ? "bg-card border-border" : "border-transparent"
                    }`}
                    onPress={() => !isSelected && handleSwitchOrg(org.id)}
                    disabled={isSwitching || isSelected}
                  >
                    <View className="gap-0.5 flex-1">
                      <Text className="text-xs font-semibold text-foreground">{org.name}</Text>
                      <Text className="text-[11px] text-muted-foreground">{org.slug}</Text>
                    </View>

                    {isSwitching ? (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    ) : isSelected ? (
                      <Check size={18} className="text-primary" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Button
              variant="outline"
              className="h-10 mt-1 border-border bg-card"
              onPress={() => setOrgModalVisible(false)}
            >
              Close
            </Button>
          </Card>
        </Pressable>
      </Modal>
    </View>
  );
}
