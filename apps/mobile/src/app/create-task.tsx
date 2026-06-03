import { useState } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../../../packages/backend/convex/_generated/api";
import { authClient } from "../lib/auth-client";
import { Check, Sparkles } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/ui/header";

export default function CreateTask() {
  const router = useRouter();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const createTask = useMutation(api.tasks.createTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("5");
  const [dueDateStr, setDueDateStr] = useState(""); // YYYY-MM-DD
  const [activeTab, setActiveTab] = useState<"assignees" | "collaborators" | "subscribers">("assignees");
  
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activeOrg) return null;

  const handleToggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) => {
      const isChecked = prev.includes(userId);
      if (isChecked) {
        return prev.filter((id) => id !== userId);
      } else {
        // Enforce exclusivity: remove from collab/subs
        setSelectedCollaborators((c) => c.filter((id) => id !== userId));
        setSelectedSubscribers((s) => s.filter((id) => id !== userId));
        return [...prev, userId];
      }
    });
  };

  const handleToggleCollaborator = (userId: string) => {
    setSelectedCollaborators((prev) => {
      const isChecked = prev.includes(userId);
      if (isChecked) {
        return prev.filter((id) => id !== userId);
      } else {
        // Enforce exclusivity: remove from assignees/subs
        setSelectedAssignees((a) => a.filter((id) => id !== userId));
        setSelectedSubscribers((s) => s.filter((id) => id !== userId));
        return [...prev, userId];
      }
    });
  };

  const handleToggleSubscriber = (userId: string) => {
    setSelectedSubscribers((prev) => {
      const isChecked = prev.includes(userId);
      if (isChecked) {
        return prev.filter((id) => id !== userId);
      } else {
        // Enforce exclusivity: remove from assignees/collabs
        setSelectedAssignees((a) => a.filter((id) => id !== userId));
        setSelectedCollaborators((c) => c.filter((id) => id !== userId));
        return [...prev, userId];
      }
    });
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Please provide a task title.");
      return;
    }

    setLoading(true);
    setError(null);

    let parsedDueDate: number | undefined;
    if (dueDateStr.trim()) {
      const match = dueDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) {
        setError("Due Date must be in YYYY-MM-DD format.");
        setLoading(false);
        return;
      }
      const [_, year, month, day] = match.map(Number);
      // month is 0-indexed in JS Dates
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) {
        setError("Invalid date provided.");
        setLoading(false);
        return;
      }
      parsedDueDate = date.getTime();
    }

    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: parsedDueDate,
        organizationId: activeOrg.id,
        assigneeIds: selectedAssignees,
        collaboratorIds: selectedCollaborators,
        subscriberIds: selectedSubscribers,
      });

      router.replace("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create task.");
    } finally {
      setLoading(false);
    }
  };

  const setRelativeDueDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDueDateStr(`${yyyy}-${mm}-${dd}`);
  };

  const getMemberList = () => {
    switch (activeTab) {
      case "assignees":
        return {
          list: selectedAssignees,
          toggle: handleToggleAssignee,
        };
      case "collaborators":
        return {
          list: selectedCollaborators,
          toggle: handleToggleCollaborator,
        };
      case "subscribers":
        return {
          list: selectedSubscribers,
          toggle: handleToggleSubscriber,
        };
    }
  };

  const { list: activeList, toggle: toggleMember } = getMemberList();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Header title="New Task" />

        <ScrollView 
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {error && (
            <View className="bg-destructive/15 border border-destructive/30 rounded-lg p-3 mb-5">
              <Text className="text-destructive text-center text-xs font-semibold">{error}</Text>
            </View>
          )}

          <View className="gap-5">
            {/* Title input */}
            <View className="gap-2">
              <Label>Title</Label>
              <Input
                placeholder="Task title"
                value={title}
                onChangeText={setTitle}
                editable={!loading}
              />
            </View>

            {/* Description input */}
            <View className="gap-2">
              <Label>Description</Label>
              <Input
                className="h-20 py-2.5"
                placeholder="Task description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>

            {/* Priority selection */}
            <View className="gap-2">
              <Label>Priority (Level {priority})</Label>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
              >
                {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((val) => (
                  <TouchableOpacity
                    key={val}
                    className={`w-9.5 h-9.5 rounded-md border justify-center items-center ${
                      priority === val 
                        ? "border-primary bg-primary" 
                        : "border-border bg-card"
                    }`}
                    onPress={() => setPriority(val)}
                  >
                    <Text 
                      className={`text-xs font-semibold ${
                        priority === val ? "text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Due Date selector */}
            <View className="gap-2">
              <Label>Due Date (YYYY-MM-DD)</Label>
              <Input
                placeholder="e.g. 2026-06-15"
                value={dueDateStr}
                onChangeText={setDueDateStr}
                editable={!loading}
              />
              <View className="flex-row gap-2 mt-1">
                <TouchableOpacity
                  className="px-2.5 py-1 rounded-md border border-border bg-card"
                  onPress={() => setRelativeDueDate(0)}
                >
                  <Text className="text-[11px] text-muted-foreground">Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-2.5 py-1 rounded-md border border-border bg-card"
                  onPress={() => setRelativeDueDate(1)}
                >
                  <Text className="text-[11px] text-muted-foreground">Tomorrow</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-2.5 py-1 rounded-md border border-border bg-card"
                  onPress={() => setRelativeDueDate(7)}
                >
                  <Text className="text-[11px] text-muted-foreground">In 1 Week</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Members selector */}
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Label>Members & Roles</Label>
                <Sparkles size={14} className="text-primary" />
              </View>

              {/* Tabs */}
              <View className="flex-row bg-card border border-border rounded-lg p-0.5">
                {(["assignees", "collaborators", "subscribers"] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    className={`flex-1 py-1.5 rounded-md justify-center items-center ${
                      activeTab === tab ? "bg-accent" : "bg-transparent"
                    }`}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text 
                      className={`text-xs font-semibold ${
                        activeTab === tab ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Members Scroll List */}
              <View className="bg-card border border-border rounded-lg max-h-[200px] p-1.5 gap-1">
                <ScrollView nestedScrollEnabled>
                  {(activeOrg.members || []).map((member: any) => {
                    const isChecked = activeList.includes(member.userId);
                    const initials = member.user?.name
                      ? member.user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                      : "U";

                    return (
                      <TouchableOpacity
                        key={member.id}
                        className={`flex-row justify-between items-center p-2 rounded-md border ${
                          isChecked ? "bg-primary/5 border-primary/20" : "border-transparent"
                        } mb-1`}
                        onPress={() => toggleMember(member.userId)}
                        disabled={loading}
                      >
                        <View className="flex-row items-center gap-2.5">
                          <View className="w-7 h-7 rounded-full bg-accent justify-center items-center">
                            <Text className="text-[10px] font-bold text-foreground">{initials}</Text>
                          </View>
                          <View>
                            <Text className="text-xs font-semibold text-foreground">{member.user?.name}</Text>
                            <Text className="text-[10px] text-muted-foreground mt-0.5">{member.user?.email}</Text>
                          </View>
                        </View>

                        <View 
                          className={`w-4 h-4 rounded border justify-center items-center ${
                            isChecked ? "bg-primary border-primary" : "border-border bg-background"
                          }`}
                        >
                          {isChecked && <Check size={10} className="text-primary-foreground font-bold" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* Create action button */}
            <Button
              className="mt-3 h-11 shadow bg-primary"
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-sm font-bold text-primary-foreground">Create Task</Text>
              )}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
