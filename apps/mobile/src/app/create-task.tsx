import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
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
import { ArrowLeft, Check, Sparkles } from "lucide-react-native";

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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={16} color="#FAFAFA" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Task</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
        >
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            {/* Title input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Task title"
                placeholderTextColor="#71717A"
                value={title}
                onChangeText={setTitle}
                editable={!loading}
              />
            </View>

            {/* Description input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Task description (optional)"
                placeholderTextColor="#71717A"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>

            {/* Priority selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Priority (Level {priority})</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.priorityScroll}
              >
                {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.priorityButton,
                      priority === val && styles.priorityButtonActive
                    ]}
                    onPress={() => setPriority(val)}
                  >
                    <Text 
                      style={[
                        styles.priorityBtnText,
                        priority === val && styles.priorityBtnTextActive
                      ]}
                    >
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Due Date selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2026-06-15"
                placeholderTextColor="#71717A"
                value={dueDateStr}
                onChangeText={setDueDateStr}
                editable={!loading}
              />
              <View style={styles.dateHelperRow}>
                <TouchableOpacity
                  style={styles.dateHelper}
                  onPress={() => setRelativeDueDate(0)}
                >
                  <Text style={styles.dateHelperText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateHelper}
                  onPress={() => setRelativeDueDate(1)}
                >
                  <Text style={styles.dateHelperText}>Tomorrow</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateHelper}
                  onPress={() => setRelativeDueDate(7)}
                >
                  <Text style={styles.dateHelperText}>In 1 Week</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Members selector */}
            <View style={styles.inputGroup}>
              <View style={styles.membersHeader}>
                <Text style={styles.label}>Members & Roles</Text>
                <Sparkles size={14} color="#3B82F6" />
              </View>

              {/* Tabs */}
              <View style={styles.tabsContainer}>
                {(["assignees", "collaborators", "subscribers"] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tabButton,
                      activeTab === tab && styles.tabButtonActive
                    ]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text 
                      style={[
                        styles.tabText,
                        activeTab === tab && styles.tabTextActive
                      ]}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Members Scroll List */}
              <View style={styles.membersBox}>
                {(activeOrg.members || []).map((member: any) => {
                  const isChecked = activeList.includes(member.userId);
                  const initials = member.user?.name
                    ? member.user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                    : "U";

                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.memberRow,
                        isChecked && styles.memberRowSelected
                      ]}
                      onPress={() => toggleMember(member.userId)}
                      disabled={loading}
                    >
                      <View style={styles.memberInfo}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>{initials}</Text>
                        </View>
                        <View>
                          <Text style={styles.memberName}>{member.user?.name}</Text>
                          <Text style={styles.memberEmail}>{member.user?.email}</Text>
                        </View>
                      </View>

                      <View 
                        style={[
                          styles.checkbox,
                          isChecked && styles.checkboxSelected
                        ]}
                      >
                        {isChecked && <Check size={10} color="#FFFFFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Create action button */}
            <TouchableOpacity
              style={[styles.createButton, loading && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Create Task</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#09090B",
  },
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E24",
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#27272A",
    backgroundColor: "#18181B",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FAFAFA",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: "#F87171",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E4E4E7",
  },
  input: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#FAFAFA",
  },
  textArea: {
    height: 80,
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: "top",
  },
  priorityScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  priorityButton: {
    width: 38,
    height: 38,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#27272A",
    backgroundColor: "#18181B",
    justifyContent: "center",
    alignItems: "center",
  },
  priorityButtonActive: {
    borderColor: "#2563EB",
    backgroundColor: "#2563EB",
  },
  priorityBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A1A1AA",
  },
  priorityBtnTextActive: {
    color: "#FFFFFF",
  },
  dateHelperRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  dateHelper: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#27272A",
    backgroundColor: "#18181B",
  },
  dateHelperText: {
    fontSize: 11,
    color: "#A1A1AA",
  },
  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 8,
    padding: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#27272A",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#71717A",
  },
  tabTextActive: {
    color: "#FAFAFA",
    fontWeight: "600",
  },
  membersBox: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    padding: 6,
    gap: 4,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  memberRowSelected: {
    backgroundColor: "rgba(37, 99, 235, 0.05)",
    borderColor: "rgba(37, 99, 235, 0.2)",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#27272A",
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FAFAFA",
  },
  memberName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FAFAFA",
  },
  memberEmail: {
    fontSize: 11,
    color: "#71717A",
    marginTop: 1,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#27272A",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  createButton: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
