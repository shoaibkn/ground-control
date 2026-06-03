import { useState } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../packages/backend/convex/_generated/api";
import { authClient } from "../lib/auth-client";
import { 
  Calendar, 
  Check, 
  Paperclip, 
  Plus, 
  Send, 
  Trash2, 
  UserPlus,
  AlertCircle
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/ui/header";

export default function TaskDetails() {
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

  if (!activeOrg || task === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center p-8">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-xs text-muted-foreground mt-2">Loading task details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (task === null) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Header title="Task Details" />
        <View className="flex-1 justify-center items-center p-8 gap-3">
          <AlertCircle size={40} className="text-destructive" />
          <Text className="text-sm font-semibold text-foreground mt-2">Task Not Found</Text>
          <Text className="text-xs text-muted-foreground text-center leading-5">
            This task may have been deleted or you do not have permission to view it.
          </Text>
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
    const member = activeOrg?.members?.find((m: any) => m.userId === userId);
    return getInitials(member?.user?.name);
  };

  const priorityStyle = getPriorityClasses(task.priority);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header title="Task Details" />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        {/* Title and details */}
        <Card className="p-4 gap-3 bg-card border-border">
          <View className="gap-1.5">
            <Text className="text-lg font-bold text-foreground">{task.title}</Text>
            <Badge className={`px-2 py-0.5 rounded-md self-start ${priorityStyle.bg}`}>
              <Text className={`text-[10px] font-bold ${priorityStyle.text}`}>
                Priority: {task.priority}
              </Text>
            </Badge>
          </View>

          {task.description ? (
            <Text className="text-xs text-muted-foreground leading-5">{task.description}</Text>
          ) : (
            <Text className="text-xs text-muted-foreground italic">No description provided.</Text>
          )}

          {/* Grid fields */}
          <View className="border-t border-border pt-3 gap-2.5">
            {/* Status Field */}
            <View className="flex-row items-center">
              <Text className="w-[100px] text-xs text-muted-foreground font-medium">Status</Text>
              <View className="flex-row items-center gap-1.5 flex-1">
                {canUpdateStatus ? (
                  <TouchableOpacity
                    className="flex-row items-center gap-1.5 border border-border bg-background py-1 px-2 rounded-md"
                    onPress={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  >
                    <View className={`w-1.5 h-1.5 rounded-full ${getStatusColorClass(task.status)}`} />
                    <Text className="text-xs font-semibold text-foreground">{task.status}</Text>
                    <Text className="text-[9px] text-muted-foreground ml-1">▼</Text>
                  </TouchableOpacity>
                ) : (
                  <View className="flex-row items-center gap-1.5">
                    <View className={`w-1.5 h-1.5 rounded-full ${getStatusColorClass(task.status)}`} />
                    <Text className="text-xs font-semibold text-foreground">{task.status}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Status selection dropdown */}
            {statusDropdownOpen && (
              <View className="bg-background border border-border rounded-lg p-1 gap-0.5">
                {["Pending", "In Progress", "Under Review", "Completed", "Cancelled"].map((st) => (
                  <TouchableOpacity
                    key={st}
                    className="flex-row items-center py-2 px-2.5 rounded-md gap-2 active:bg-accent"
                    onPress={() => handleStatusChange(st)}
                  >
                    <View className={`w-1.5 h-1.5 rounded-full ${getStatusColorClass(st)}`} />
                    <Text className="text-xs text-foreground flex-1">{st}</Text>
                    {task.status === st && <Check size={12} className="text-primary" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Due Date Field */}
            <View className="flex-row items-center">
              <Text className="w-[100px] text-xs text-muted-foreground font-medium">Due Date</Text>
              <View className="flex-row items-center gap-1.5 flex-1">
                <Calendar size={13} className="text-muted-foreground" />
                <Text className="text-xs text-foreground">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                </Text>
              </View>
            </View>

            {/* Assigner Field */}
            <View className="flex-row items-center">
              <Text className="w-[100px] text-xs text-muted-foreground font-medium">Assigner</Text>
              <View className="flex-row items-center gap-1.5 flex-1">
                <View className="w-5 h-5 rounded-full bg-primary justify-center items-center">
                  <Text className="text-[8px] font-bold text-primary-foreground">
                    {getInitials(getMemberDetails(task.creatorId)?.name)}
                  </Text>
                </View>
                <Text className="text-xs text-foreground">
                  {getMemberDetails(task.creatorId)?.name || "Unknown User"}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Members Section */}
        <Card className="p-4 gap-3 bg-card border-border">
          <Text className="text-sm font-bold text-foreground">Members & Collaboration</Text>

          {/* Assignees */}
          <View className="gap-2 border-b border-border pb-2.5 mb-0.5">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs font-semibold text-muted-foreground">Assignees</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {task.assigneeIds && task.assigneeIds.length > 0 ? (
                task.assigneeIds.map((userId) => {
                  const m = getMemberDetails(userId);
                  return (
                    <View key={userId} className="flex-row items-center gap-1.5 bg-background border border-border rounded-md py-1 px-2">
                      <View className="w-5 h-5 rounded-full bg-primary justify-center items-center">
                        <Text className="text-[8px] font-bold text-primary-foreground">{getInitials(m?.name)}</Text>
                      </View>
                      <Text className="text-[11px] font-medium text-foreground" numberOfLines={1}>{m?.name}</Text>
                    </View>
                  );
                })
              ) : (
                <Text className="text-xs text-muted-foreground italic">Unassigned</Text>
              )}
            </View>
          </View>

          {/* Collaborators */}
          <View className="gap-2 border-b border-border pb-2.5 mb-0.5">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs font-semibold text-muted-foreground">Collaborators</Text>
              {canManageCollaborators && (
                <TouchableOpacity
                  onPress={() => {
                    setMemberModalType("collaborators");
                    setMemberModalOpen(true);
                  }}
                >
                  <UserPlus size={14} className="text-primary" />
                </TouchableOpacity>
              )}
            </View>
            <View className="flex-row flex-wrap gap-2">
              {task.collaboratorIds && task.collaboratorIds.length > 0 ? (
                task.collaboratorIds.map((userId) => {
                  const m = getMemberDetails(userId);
                  return (
                    <View key={userId} className="flex-row items-center gap-1.5 bg-background border border-border rounded-md py-1 px-2">
                      <View className="w-5 h-5 rounded-full bg-primary justify-center items-center">
                        <Text className="text-[8px] font-bold text-primary-foreground">{getInitials(m?.name)}</Text>
                      </View>
                      <Text className="text-[11px] font-medium text-foreground" numberOfLines={1}>{m?.name}</Text>
                    </View>
                  );
                })
              ) : (
                <Text className="text-xs text-muted-foreground italic">No collaborators</Text>
              )}
            </View>
          </View>

          {/* Subscribers */}
          <View className="gap-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs font-semibold text-muted-foreground">Subscribers</Text>
              {canManageSubscribers && (
                <TouchableOpacity
                  onPress={() => {
                    setMemberModalType("subscribers");
                    setMemberModalOpen(true);
                  }}
                >
                  <UserPlus size={14} className="text-primary" />
                </TouchableOpacity>
              )}
            </View>
            <View className="flex-row flex-wrap gap-2">
              {task.subscriberIds && task.subscriberIds.length > 0 ? (
                task.subscriberIds.map((userId) => {
                  const m = getMemberDetails(userId);
                  return (
                    <View key={userId} className="flex-row items-center gap-1.5 bg-background border border-border rounded-md py-1 px-2">
                      <View className="w-5 h-5 rounded-full bg-primary justify-center items-center">
                        <Text className="text-[8px] font-bold text-primary-foreground">{getInitials(m?.name)}</Text>
                      </View>
                      <Text className="text-[11px] font-medium text-foreground" numberOfLines={1}>{m?.name}</Text>
                    </View>
                  );
                })
              ) : (
                <Text className="text-xs text-muted-foreground italic">No subscribers</Text>
              )}
            </View>
          </View>
        </Card>

        {/* Checklist / Subtasks */}
        <Card className="p-4 gap-3 bg-card border-border">
          <Text className="text-sm font-bold text-foreground">Checklist</Text>
          
          <View className="gap-2.5">
            {(subtasks || []).map((sub) => (
              <TouchableOpacity
                key={sub._id}
                className="flex-row items-center gap-2.5 py-1"
                onPress={() => handleToggleSubtask(sub._id, sub.isCompleted)}
                disabled={!canManageSubtasks}
              >
                <View className={`w-4 h-4 rounded border justify-center items-center ${
                  sub.isCompleted ? "bg-primary border-primary" : "border-border bg-background"
                }`}>
                  {sub.isCompleted && <Check size={10} className="text-primary-foreground font-bold" />}
                </View>
                <Text className={`text-xs ${
                  sub.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                }`}>
                  {sub.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {canManageSubtasks && (
            <View className="flex-row gap-2 mt-1.5">
              <Input
                className="flex-1 h-9 px-2.5 text-xs bg-background"
                placeholder="Add checklist item..."
                value={newSubtaskTitle}
                onChangeText={setNewSubtaskTitle}
                editable={!submittingSubtask}
              />
              <TouchableOpacity
                className="w-9 h-9 rounded-md bg-primary justify-center items-center active:opacity-90"
                onPress={handleAddSubtask}
                disabled={submittingSubtask || !newSubtaskTitle.trim()}
              >
                {submittingSubtask ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Plus size={16} className="text-primary-foreground font-bold" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Documents / Attachments */}
        <Card className="p-4 gap-3 bg-card border-border">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-bold text-foreground">Documents</Text>
            {canAddAttachments && (
              <TouchableOpacity onPress={handleMockUpload} disabled={uploadingFile}>
                {uploadingFile ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Paperclip size={16} className="text-primary" />
                )}
              </TouchableOpacity>
            )}
          </View>

          <View className="gap-2">
            {attachments && attachments.length > 0 ? (
              attachments.map((file) => (
                <View key={file._id} className="flex-row justify-between items-center p-2.5 rounded-md border border-border bg-background">
                  <View className="flex-row items-center gap-2.5 flex-1">
                    <Paperclip size={14} className="text-muted-foreground" />
                    <View>
                      <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>{file.fileName}</Text>
                      <Text className="text-[10px] text-muted-foreground mt-0.5">{formatSize(file.fileSize)}</Text>
                    </View>
                  </View>
                  {(isAdminOrOwner || file.uploaderId === currentUserId) && (
                    <TouchableOpacity onPress={() => handleDeleteAttachment(file._id)}>
                      <Trash2 size={14} className="text-destructive" />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <Text className="text-xs text-muted-foreground italic">No documents uploaded yet.</Text>
            )}
          </View>
        </Card>

        {/* Comments section */}
        <Card className="p-4 gap-3 bg-card border-border">
          <Text className="text-sm font-bold text-foreground">Comments</Text>

          <View className="gap-3">
            {comments && comments.length > 0 ? (
              comments.map((comm) => {
                const u = getMemberUserInitials(comm.userId);
                const name = getMemberDetails(comm.userId)?.name || "Unknown Member";
                return (
                  <View key={comm._id} className="bg-background border border-border rounded-md p-2.5 gap-1.5">
                    <View className="flex-row items-center gap-2">
                      <View className="w-5.5 h-5.5 rounded-full bg-primary justify-center items-center">
                        <Text className="text-[8px] font-bold text-primary-foreground">{u}</Text>
                      </View>
                      <Text className="text-xs font-semibold text-foreground">{name}</Text>
                    </View>
                    <Text className="text-xs text-muted-foreground leading-4 pl-0.5">{comm.content}</Text>
                  </View>
                );
              })
            ) : (
              <Text className="text-xs text-muted-foreground italic">No comments yet.</Text>
            )}
          </View>

          {canAddComments && (
            <View className="flex-row gap-2 mt-1.5 items-end">
              <TextInput
                className="flex-1 bg-background border border-border rounded-md min-h-[36px] max-h-[80px] px-2.5 py-2 text-xs text-foreground"
                placeholder="Write a comment..."
                placeholderTextColor="#71717A"
                value={newCommentContent}
                onChangeText={setNewCommentContent}
                editable={!submittingComment}
                multiline
              />
              <TouchableOpacity
                className="w-9 h-9 rounded-md bg-primary justify-center items-center active:opacity-90"
                onPress={handleAddComment}
                disabled={submittingComment || !newCommentContent.trim()}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={14} className="text-primary-foreground" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Member Management Popup Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={memberModalOpen}
        onRequestClose={() => setMemberModalOpen(false)}
      >
        <Pressable 
          className="flex-1 bg-black/75 justify-center items-center p-6"
          onPress={() => setMemberModalOpen(false)}
        >
          <Card className="w-full max-h-[80%] p-5 gap-4 bg-background border-border shadow-2xl">
            <View className="gap-1">
              <Text className="text-base font-bold text-foreground">
                Manage {memberModalType === "collaborators" ? "Collaborators" : "Subscribers"}
              </Text>
              <Text className="text-xs text-muted-foreground">
                Add or remove team members to this role
              </Text>
            </View>

            <ScrollView className="max-h-[250px]">
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
                    className={`flex-row justify-between items-center py-2.5 px-3 rounded-lg border mb-1.5 ${
                      isChecked ? "bg-card border-border" : "border-transparent"
                    }`}
                    onPress={() => handleToggleMember(member.userId)}
                  >
                    <View className="gap-0.5 flex-1">
                      <Text className="text-xs font-semibold text-foreground">{member.user?.name}</Text>
                      <Text className="text-[10px] text-muted-foreground">{member.user?.email}</Text>
                    </View>

                    {isChecked && <Check size={16} className="text-primary" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Button
              variant="outline"
              className="h-10 mt-1 border-border bg-card"
              onPress={() => setMemberModalOpen(false)}
            >
              Done
            </Button>
          </Card>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
