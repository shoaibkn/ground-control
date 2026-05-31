import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../packages/backend/convex/_generated/api";
import { authClient } from "../lib/auth-client";
import { 
  ArrowLeft, 
  Calendar, 
  Check, 
  MessageSquare, 
  Paperclip, 
  Plus, 
  Send, 
  Sparkles, 
  Trash2, 
  UserPlus, 
  Users 
} from "lucide-react-native";

export default function TaskDetails() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams();

  // Queries
  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: activeMember } = authClient.useActiveMember();

  const task = useQuery(api.tasks.getTask, taskId ? { taskId: taskId as any } : "skip");
  const subtasks = useQuery(api.tasks.getSubtasks, taskId ? { taskId: taskId as any } : "skip");
  const comments = useQuery(api.taskComments.getComments, taskId ? { taskId: taskId as any } : "skip");
  const attachments = useQuery(api.taskAttachments.getAttachments, taskId ? { taskId: taskId as any } : "skip");

  // Mutations
  const updateStatus = useMutation(api.tasks.updateTaskStatus);
  const updateCollabs = useMutation(api.tasks.updateCollaborators);
  const updateSubs = useMutation(api.tasks.updateSubscribers);
  const createSubtask = useMutation(api.tasks.createSubtask);
  const toggleSubtask = useMutation(api.tasks.toggleSubtask);
  const createComment = useMutation(api.taskComments.addComment);
  const registerAttachment = useMutation(api.taskAttachments.registerAttachment);
  const deleteAttachment = useMutation(api.taskAttachments.deleteAttachment);

  // States
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newCommentContent, setNewCommentContent] = useState("");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberModalType, setMemberModalType] = useState<"collaborators" | "subscribers">("collaborators");
  
  const [submittingSubtask, setSubmittingSubtask] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  if (!task || !activeOrg) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading task details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permissions & Roles
  const currentUserId = session?.user?.id;
  const currentUserMember = activeOrg?.members?.find(
    (m: any) => m.userId === currentUserId
  );
  
  const isAdminOrOwner =
    activeMember?.role === "admin" ||
    activeMember?.role === "owner" ||
    currentUserMember?.role === "admin" ||
    currentUserMember?.role === "owner";
    
  const isCreator = task.creatorId === currentUserId;
  const isAssignee = currentUserId ? (task.assigneeIds?.includes(currentUserId) || false) : false;
  const isCollaborator = currentUserId ? (task.collaboratorIds?.includes(currentUserId) || false) : false;
  const isSubscriber = currentUserId ? (task.subscriberIds?.includes(currentUserId) || false) : false;

  const canUpdateStatus = isAdminOrOwner || isCreator || isAssignee || isCollaborator;
  const canManageSubtasks = isAdminOrOwner || isCreator || isAssignee || isCollaborator;
  const canManageCollaborators = isAdminOrOwner || isCreator || isAssignee;
  const canManageSubscribers = isAdminOrOwner || isCreator || isAssignee;
  const canAddComments = isAdminOrOwner || isCreator || isAssignee || isCollaborator || isSubscriber;
  const canAddAttachments = isAdminOrOwner || isCreator || isAssignee || isCollaborator || isSubscriber;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({
        taskId: task._id,
        status: newStatus,
      });
      setStatusDropdownOpen(false);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || submittingSubtask) return;
    setSubmittingSubtask(true);
    try {
      await createSubtask({
        taskId: task._id,
        title: newSubtaskTitle.trim(),
      });
      setNewSubtaskTitle("");
    } catch (err) {
      console.error("Failed to add subtask", err);
    } finally {
      setSubmittingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtaskId: any, isCompleted: boolean) => {
    if (!canManageSubtasks) return;
    try {
      await toggleSubtask({
        subtaskId,
        isCompleted: !isCompleted,
      });
    } catch (err) {
      console.error("Failed to toggle subtask", err);
    }
  };

  const handleAddComment = async () => {
    if (!newCommentContent.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      await createComment({
        taskId: task._id,
        content: newCommentContent.trim(),
      });
      setNewCommentContent("");
    } catch (err) {
      console.error("Failed to add comment", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleMockUpload = async () => {
    if (uploadingFile) return;
    setUploadingFile(true);
    // Simulate minor delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    try {
      const randomNames = ["wireframe_sketch.png", "prd_requirements.pdf", "ground_control_design.fig"];
      const fileName = randomNames[Math.floor(Math.random() * randomNames.length)];
      await registerAttachment({
        taskId: task._id,
        fileName,
        fileSize: Math.floor(Math.random() * 5000000) + 100000,
        mimeType: fileName.endsWith(".pdf") ? "application/pdf" : "image/png",
        r2Key: `mock-r2-key-${Date.now()}-${fileName}`,
      });
    } catch (err) {
      console.error("Failed to upload attachment", err);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: any) => {
    try {
      await deleteAttachment({ attachmentId });
    } catch (err) {
      console.error("Failed to delete attachment", err);
    }
  };

  const handleToggleMember = async (memberUserId: string) => {
    if (memberModalType === "collaborators") {
      const currentList = task.collaboratorIds || [];
      const newList = currentList.includes(memberUserId)
        ? currentList.filter((id) => id !== memberUserId)
        : [...currentList, memberUserId];
      await updateCollabs({
        taskId: task._id,
        collaboratorIds: newList,
      });
    } else {
      const currentList = task.subscriberIds || [];
      const newList = currentList.includes(memberUserId)
        ? currentList.filter((id) => id !== memberUserId)
        : [...currentList, memberUserId];
      await updateSubs({
        taskId: task._id,
        subscriberIds: newList,
      });
    }
  };

  const getMemberDetails = (userId: string) => {
    return activeOrg.members?.find((m: any) => m.userId === userId)?.user;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

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
    <SafeAreaView style={styles.safeArea}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={16} color="#FAFAFA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Task Details
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Title and details */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityStyle(task.priority).bg }]}>
              <Text style={[styles.priorityText, { color: getPriorityStyle(task.priority).text }]}>
                Priority: {task.priority}
              </Text>
            </View>
          </View>

          {task.description ? (
            <Text style={styles.taskDesc}>{task.description}</Text>
          ) : (
            <Text style={styles.taskDescItalic}>No description provided.</Text>
          )}

          {/* Grid fields */}
          <View style={styles.grid}>
            {/* Status Field */}
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Status</Text>
              <View style={styles.gridValue}>
                {canUpdateStatus ? (
                  <TouchableOpacity
                    style={styles.statusDropdown}
                    onPress={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  >
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]} />
                    <Text style={styles.statusText}>{task.status}</Text>
                    <ChevronDown size={12} color="#94A3B8" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.statusViewBadge}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]} />
                    <Text style={styles.statusText}>{task.status}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Status selection dropdown */}
            {statusDropdownOpen && (
              <View style={styles.dropdownBox}>
                {["Pending", "In Progress", "Under Review", "Completed", "Cancelled"].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={styles.dropdownItem}
                    onPress={() => handleStatusChange(st)}
                  >
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(st) }]} />
                    <Text style={styles.dropdownItemText}>{st}</Text>
                    {task.status === st && <Check size={12} color="#3B82F6" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Due Date Field */}
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Due Date</Text>
              <View style={styles.gridValue}>
                <Calendar size={13} color="#94A3B8" />
                <Text style={styles.gridText}>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                </Text>
              </View>
            </View>

            {/* Assigner Field */}
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>Assigner</Text>
              <View style={styles.gridValue}>
                <View style={styles.smallAvatar}>
                  <Text style={styles.smallAvatarText}>
                    {getInitials(getMemberDetails(task.creatorId)?.name)}
                  </Text>
                </View>
                <Text style={styles.gridText}>
                  {getMemberDetails(task.creatorId)?.name || "Unknown User"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Members Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Members & Collaboration</Text>

          {/* Assignees */}
          <View style={styles.memberListGroup}>
            <View style={styles.memberListHeader}>
              <Text style={styles.memberListLabel}>Assignees</Text>
            </View>
            <View style={styles.avatarList}>
              {task.assigneeIds && task.assigneeIds.length > 0 ? (
                task.assigneeIds.map((userId) => {
                  const m = getMemberDetails(userId);
                  return (
                    <View key={userId} style={styles.memberItem}>
                      <View style={styles.smallAvatar}>
                        <Text style={styles.smallAvatarText}>{getInitials(m?.name)}</Text>
                      </View>
                      <Text style={styles.memberNameText} numberOfLines={1}>{m?.name}</Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.taskDescItalic}>Unassigned</Text>
              )}
            </View>
          </View>

          {/* Collaborators */}
          <View style={styles.memberListGroup}>
            <View style={styles.memberListHeader}>
              <Text style={styles.memberListLabel}>Collaborators</Text>
              {canManageCollaborators && (
                <TouchableOpacity
                  onPress={() => {
                    setMemberModalType("collaborators");
                    setMemberModalOpen(true);
                  }}
                >
                  <UserPlus size={14} color="#3B82F6" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.avatarList}>
              {task.collaboratorIds && task.collaboratorIds.length > 0 ? (
                task.collaboratorIds.map((userId) => {
                  const m = getMemberDetails(userId);
                  return (
                    <View key={userId} style={styles.memberItem}>
                      <View style={styles.smallAvatar}>
                        <Text style={styles.smallAvatarText}>{getInitials(m?.name)}</Text>
                      </View>
                      <Text style={styles.memberNameText} numberOfLines={1}>{m?.name}</Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.taskDescItalic}>No collaborators</Text>
              )}
            </View>
          </View>

          {/* Subscribers */}
          <View style={styles.memberListGroup}>
            <View style={styles.memberListHeader}>
              <Text style={styles.memberListLabel}>Subscribers</Text>
              {canManageSubscribers && (
                <TouchableOpacity
                  onPress={() => {
                    setMemberModalType("subscribers");
                    setMemberModalOpen(true);
                  }}
                >
                  <UserPlus size={14} color="#3B82F6" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.avatarList}>
              {task.subscriberIds && task.subscriberIds.length > 0 ? (
                task.subscriberIds.map((userId) => {
                  const m = getMemberDetails(userId);
                  return (
                    <View key={userId} style={styles.memberItem}>
                      <View style={styles.smallAvatar}>
                        <Text style={styles.smallAvatarText}>{getInitials(m?.name)}</Text>
                      </View>
                      <Text style={styles.memberNameText} numberOfLines={1}>{m?.name}</Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.taskDescItalic}>No subscribers</Text>
              )}
            </View>
          </View>
        </View>

        {/* Checklist / Subtasks */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Checklist</Text>
          
          <View style={styles.checklistItems}>
            {(subtasks || []).map((sub) => (
              <TouchableOpacity
                key={sub._id}
                style={styles.subtaskRow}
                onPress={() => handleToggleSubtask(sub._id, sub.isCompleted)}
                disabled={!canManageSubtasks}
              >
                <View style={[styles.subtaskCheckbox, sub.isCompleted && styles.checkboxSelected]}>
                  {sub.isCompleted && <Check size={10} color="#FFFFFF" />}
                </View>
                <Text style={[styles.subtaskText, sub.isCompleted && styles.subtaskTextCompleted]}>
                  {sub.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {canManageSubtasks && (
            <View style={styles.addSubtaskRow}>
              <TextInput
                style={styles.subtaskInput}
                placeholder="Add checklist item..."
                placeholderTextColor="#71717A"
                value={newSubtaskTitle}
                onChangeText={setNewSubtaskTitle}
                editable={!submittingSubtask}
              />
              <TouchableOpacity
                style={styles.addSubtaskBtn}
                onPress={handleAddSubtask}
                disabled={submittingSubtask || !newSubtaskTitle.trim()}
              >
                {submittingSubtask ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Plus size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Documents / Attachments */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Documents</Text>
            {canAddAttachments && (
              <TouchableOpacity onPress={handleMockUpload} disabled={uploadingFile}>
                {uploadingFile ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Paperclip size={16} color="#3B82F6" />
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.attachmentsBox}>
            {attachments && attachments.length > 0 ? (
              attachments.map((file) => (
                <View key={file._id} style={styles.attachmentItem}>
                  <View style={styles.attachmentInfo}>
                    <Paperclip size={14} color="#A1A1AA" />
                    <View>
                      <Text style={styles.attachmentName} numberOfLines={1}>{file.fileName}</Text>
                      <Text style={styles.attachmentSize}>{formatSize(file.fileSize)}</Text>
                    </View>
                  </View>
                  {(isAdminOrOwner || file.uploaderId === currentUserId) && (
                    <TouchableOpacity onPress={() => handleDeleteAttachment(file._id)}>
                      <Trash2 size={14} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.taskDescItalic}>No documents uploaded yet.</Text>
            )}
          </View>
        </View>

        {/* Comments section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Comments</Text>

          <View style={styles.commentsBox}>
            {comments && comments.length > 0 ? (
              comments.map((comm) => {
                const u = getMemberUserInitials(comm.userId);
                const name = getMemberDetails(comm.userId)?.name || "Unknown Member";
                return (
                  <View key={comm._id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <View style={styles.smallAvatar}>
                        <Text style={styles.smallAvatarText}>{u}</Text>
                      </View>
                      <Text style={styles.commentUser}>{name}</Text>
                    </View>
                    <Text style={styles.commentContent}>{comm.content}</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.taskDescItalic}>No comments yet.</Text>
            )}
          </View>

          {canAddComments && (
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="#71717A"
                value={newCommentContent}
                onChangeText={setNewCommentContent}
                editable={!submittingComment}
                multiline
              />
              <TouchableOpacity
                style={styles.commentSendBtn}
                onPress={handleAddComment}
                disabled={submittingComment || !newCommentContent.trim()}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={14} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Member Management Popup Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={memberModalOpen}
        onRequestClose={() => setMemberModalOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setMemberModalOpen(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Manage {memberModalType === "collaborators" ? "Collaborators" : "Subscribers"}
              </Text>
              <Text style={styles.modalSubtitle}>
                Add or remove team members to this role
              </Text>
            </View>

            <ScrollView style={styles.modalOrgList}>
              {(activeOrg.members || []).map((member: any) => {
                const currentList = memberModalType === "collaborators"
                  ? (task.collaboratorIds || [])
                  : (task.subscriberIds || []);
                const isChecked = currentList.includes(member.userId);
                
                // Exclude active assignees from list
                if (task.assigneeIds?.includes(member.userId)) return null;

                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.modalOrgItem,
                      isChecked && styles.modalOrgItemActive
                    ]}
                    onPress={() => handleToggleMember(member.userId)}
                  >
                    <View style={styles.modalOrgInfo}>
                      <Text style={styles.modalOrgName}>{member.user?.name}</Text>
                      <Text style={styles.modalOrgSlug}>{member.user?.email}</Text>
                    </View>

                    {isChecked && <Check size={16} color="#3B82F6" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setMemberModalOpen(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// Helpers
const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const getMemberUserInitials = (userId: string) => {
  return "U"; // fallback initials handler
};

const ChevronDown = ({ size, color, style }: any) => {
  return (
    <View style={style}>
      <Text style={{ color, fontSize: size, fontWeight: "bold" }}>▼</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#09090B",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    fontSize: 13,
    color: "#A1A1AA",
    marginTop: 8,
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
    fontSize: 14,
    fontWeight: "700",
    color: "#FAFAFA",
    maxWidth: "70%",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#09090B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FAFAFA",
    letterSpacing: -0.2,
  },
  titleRow: {
    gap: 6,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FAFAFA",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
  },
  taskDesc: {
    fontSize: 13,
    color: "#A1A1AA",
    lineHeight: 18,
  },
  taskDescItalic: {
    fontSize: 12,
    color: "#71717A",
    fontStyle: "italic",
  },
  grid: {
    borderTopWidth: 1,
    borderTopColor: "#1E1E24",
    paddingTop: 12,
    gap: 10,
  },
  gridRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  gridLabel: {
    width: 100,
    fontSize: 12,
    color: "#71717A",
    fontWeight: "500",
  },
  gridValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  gridText: {
    fontSize: 12,
    color: "#E4E4E7",
  },
  statusDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#27272A",
    backgroundColor: "#18181B",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusViewBadge: {
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
    fontSize: 12,
    fontWeight: "600",
    color: "#E4E4E7",
  },
  dropdownBox: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 8,
    padding: 4,
    gap: 2,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 8,
  },
  dropdownItemText: {
    fontSize: 12,
    color: "#FAFAFA",
    flex: 1,
  },
  memberListGroup: {
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E24",
    paddingBottom: 10,
    marginBottom: 2,
  },
  memberListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberListLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717A",
  },
  avatarList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  memberNameText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#FAFAFA",
    maxWidth: 80,
  },
  smallAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  smallAvatarText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  checklistItems: {
    gap: 10,
  },
  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  subtaskCheckbox: {
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
  subtaskText: {
    fontSize: 13,
    color: "#E4E4E7",
  },
  subtaskTextCompleted: {
    textDecorationLine: "line-through",
    color: "#71717A",
  },
  addSubtaskRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  subtaskInput: {
    flex: 1,
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 6,
    height: 36,
    paddingHorizontal: 10,
    fontSize: 12,
    color: "#FAFAFA",
  },
  addSubtaskBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentsBox: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#27272A",
    backgroundColor: "#18181B",
  },
  attachmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FAFAFA",
    maxWidth: 220,
  },
  attachmentSize: {
    fontSize: 10,
    color: "#71717A",
    marginTop: 1,
  },
  commentsBox: {
    gap: 12,
  },
  commentItem: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    gap: 6,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E4E4E7",
  },
  commentContent: {
    fontSize: 12,
    color: "#A1A1AA",
    lineHeight: 16,
    paddingLeft: 2,
  },
  commentInputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    alignItems: "flex-end",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 6,
    minHeight: 36,
    maxHeight: 80,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 12,
    color: "#FAFAFA",
    textAlignVertical: "top",
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
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
    paddingVertical: 10,
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
