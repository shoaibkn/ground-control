import { useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Pressable } from "react-native";
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
  TrendingUp, 
  Users 
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  return (
    <View className="flex-1 bg-background">
      {/* Header bar */}
      <View className="pt-[54px] pb-[14px] px-5 flex-row justify-between items-center border-b border-border bg-background">
        {activeOrg ? (
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
        )}

        <TouchableOpacity
          className="w-8 h-8 rounded-full bg-primary justify-center items-center border border-border"
          onPress={() => router.push("/settings")}
        >
          <Text className="text-[11px] font-extrabold text-primary-foreground">
            {getInitials(session?.user?.name)}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}
      >
        {/* Welcome Section */}
        <View className="gap-1 py-1.5">
          <Text className="text-2xl font-bold text-foreground tracking-tight">Hello, {session?.user?.name?.split(" ")[0] || "User"} 👋</Text>
          <Text className="text-xs text-muted-foreground">Welcome to Ground Control control center.</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-3">
          <Card className="flex-1 p-3 gap-1 bg-card border-border">
            <View className="w-[26px] h-[26px] rounded bg-blue-500/10 justify-center items-center mb-1">
              <ListTodo size={16} className="text-blue-500" />
            </View>
            <Text className="text-lg font-bold text-foreground">{totalTasks}</Text>
            <Text className="text-[10px] text-muted-foreground font-medium">Total Tasks</Text>
          </Card>

          <Card className="flex-1 p-3 gap-1 bg-card border-border">
            <View className="w-[26px] h-[26px] rounded bg-yellow-500/10 justify-center items-center mb-1">
              <TrendingUp size={16} className="text-yellow-500" />
            </View>
            <Text className="text-lg font-bold text-foreground">{pendingTasks}</Text>
            <Text className="text-[10px] text-muted-foreground font-medium">Active Tasks</Text>
          </Card>

          <Card className="flex-1 p-3 gap-1 bg-card border-border">
            <View className="w-[26px] h-[26px] rounded bg-emerald-500/10 justify-center items-center mb-1">
              <Check size={16} className="text-emerald-500" />
            </View>
            <Text className="text-lg font-bold text-foreground">{completedTasks}</Text>
            <Text className="text-[10px] text-muted-foreground font-medium">Completed</Text>
          </Card>
        </View>

        {/* Active Workspace Info */}
        {activeOrg && (
          <Card className="p-4 gap-3 bg-card border-border">
            <View className="flex-row justify-between items-center">
              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Workspace Overview</Text>
              <Users size={14} className="text-muted-foreground" />
            </View>
            <View className="gap-1.5">
              <Text className="text-sm font-semibold text-foreground">{activeOrg.name}</Text>
              <View className="flex-row items-center gap-2">
                <Badge variant="secondary" className="flex-row items-center gap-1.5 px-2 py-0.5 bg-primary/10 border border-primary/20">
                  <Shield size={10} className="text-primary mr-1" />
                  <Text className="text-[9px] font-semibold text-primary">
                    {activeMember?.role 
                      ? activeMember.role.charAt(0).toUpperCase() + activeMember.role.slice(1)
                      : "Member"}
                  </Text>
                </Badge>
                <Text className="text-xs text-muted-foreground">
                  {(activeOrg.members || []).length} members
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Recent Tasks */}
        <View className="gap-2.5">
          <Text className="text-sm font-bold text-foreground">Recent Tasks</Text>
          {!activeOrg ? (
            <Card className="p-5 items-center justify-center bg-card border-border">
              <Text className="text-xs text-muted-foreground italic">Select a workspace to view tasks.</Text>
            </Card>
          ) : tasks === undefined ? (
            <ActivityIndicator size="small" color="#3B82F6" className="my-5" />
          ) : recentTasks.length === 0 ? (
            <Card className="p-5 items-center justify-center bg-card border-border">
              <Text className="text-xs text-muted-foreground italic">No tasks created yet.</Text>
            </Card>
          ) : (
            <Card className="p-1 gap-0.5 bg-card border-border">
              {recentTasks.map((t) => (
                <TouchableOpacity
                  key={t._id}
                  className="flex-row justify-between items-center py-2.5 px-3 rounded-md active:bg-accent"
                  onPress={() => {
                    router.push({
                      pathname: "/task-details",
                      params: { taskId: t._id },
                    });
                  }}
                >
                  <View className="flex-row items-center gap-2 flex-1">
                    <View className={`w-1.5 h-1.5 rounded-full ${getStatusColorClass(t.status)}`} />
                    <Text className="text-xs text-foreground font-medium max-w-[85%]" numberOfLines={1}>
                      {t.title}
                    </Text>
                  </View>
                  <Calendar size={12} className="text-muted-foreground" />
                </TouchableOpacity>
              ))}
            </Card>
          )}
        </View>

        {/* Shortcuts */}
        <View className="gap-2.5">
          <Text className="text-sm font-bold text-foreground">Quick Access</Text>
          <View className="flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1 flex-row gap-2 h-10 border-border bg-card"
              onPress={() => router.push("/(tabs)/tasks")}
            >
              <ListTodo size={16} className="text-foreground" />
              <Text className="text-xs font-semibold text-foreground">View Tasks</Text>
            </Button>

            <Button 
              variant="outline" 
              className="flex-1 flex-row gap-2 h-10 border-border bg-card"
              onPress={() => router.push("/settings")}
            >
              <Users size={16} className="text-foreground" />
              <Text className="text-xs font-semibold text-foreground">Settings</Text>
            </Button>
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
