import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../packages/backend/convex/_generated/api";
import { authClient } from "../lib/auth-client";
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  Moon,
  Shield,
  Check,
  Bell,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const NOTICE_OPTIONS = [
  { value: 1, label: "1h before" },
  { value: 4, label: "4h before" },
  { value: 12, label: "12h before" },
  { value: 24, label: "24h (1d)" },
  { value: 48, label: "48h (2d)" },
];

export default function ReminderSettingsScreen() {
  const router = useRouter();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: activeMember } = authClient.useActiveMember();

  const orgId = activeOrg?.id || "";
  const isOwnerOrAdmin =
    activeMember?.role === "owner" || activeMember?.role === "admin";

  const settings = useQuery(
    api.taskReminders.getOrganizationReminderSettings,
    orgId ? { organizationId: orgId } : "skip"
  );

  const updateSettings = useMutation(
    api.taskReminders.updateOrganizationReminderSettings
  );

  const [isSaving, setIsSaving] = useState(false);

  // Due Soon State
  const [dueSoonEnabled, setDueSoonEnabled] = useState(true);
  const [noticeHours, setNoticeHours] = useState<number[]>([24]);
  const [dueSoonAssignees, setDueSoonAssignees] = useState(true);
  const [dueSoonCreator, setDueSoonCreator] = useState(false);

  // Overdue State
  const [overdueEnabled, setOverdueEnabled] = useState(true);
  const [repeatIntervalHours, setRepeatIntervalHours] = useState(24);
  const [escalateToAdmins, setEscalateToAdmins] = useState(true);

  // Quiet Hours State
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);

  useEffect(() => {
    if (settings) {
      setDueSoonEnabled(settings.dueSoonEnabled);
      setNoticeHours(settings.dueSoonNoticeHours || [24]);
      setDueSoonAssignees(settings.dueSoonRecipients?.assignees ?? true);
      setDueSoonCreator(settings.dueSoonRecipients?.creator ?? false);

      setOverdueEnabled(settings.overdueEnabled);
      setRepeatIntervalHours(
        settings.overdueRepeatIntervalHours !== undefined
          ? settings.overdueRepeatIntervalHours
          : 24
      );
      setEscalateToAdmins(
        settings.overdueRecipients?.adminsOnEscalation ?? true
      );
      setQuietHoursEnabled(Boolean(settings.quietHoursEnabled));
    }
  }, [settings]);

  const toggleNotice = (h: number) => {
    if (!isOwnerOrAdmin) return;
    setNoticeHours((prev) => {
      if (prev.includes(h)) {
        if (prev.length === 1) {
          Alert.alert("Warning", "At least one notice window must remain active.");
          return prev;
        }
        return prev.filter((item) => item !== h);
      }
      return [...prev, h].sort((a, b) => a - b);
    });
  };

  const handleSave = async () => {
    if (!orgId || !isOwnerOrAdmin) return;
    setIsSaving(true);
    try {
      await updateSettings({
        organizationId: orgId,
        dueSoonEnabled,
        dueSoonNoticeHours: noticeHours,
        dueSoonRecipients: {
          assignees: dueSoonAssignees,
          creator: dueSoonCreator,
          collaborators: settings?.dueSoonRecipients?.collaborators ?? false,
        },
        dueSoonMinPriority: settings?.dueSoonMinPriority || "all",
        overdueEnabled,
        overdueGraceMinutes: settings?.overdueGraceMinutes || 0,
        overdueRepeatIntervalHours: repeatIntervalHours,
        overdueMaxRepetitions: settings?.overdueMaxRepetitions,
        overdueRecipients: {
          assignees: true,
          creator: true,
          adminsOnEscalation: escalateToAdmins,
        },
        overdueEscalationThresholdDays:
          settings?.overdueEscalationThresholdDays || 3,
        quietHoursEnabled,
        timezone: settings?.timezone || "UTC",
        quietHoursStart: settings?.quietHoursStart || "22:00",
        quietHoursEnd: settings?.quietHoursEnd || "08:00",
        customReminderMessage: settings?.customReminderMessage,
      });

      Alert.alert("Success", "Organization reminder policy updated.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update reminder settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header bar */}
      <View className="pt-[54px] pb-[14px] px-5 flex-row items-center justify-between border-b border-border bg-background">
        <TouchableOpacity className="p-1" onPress={() => router.back()}>
          <ArrowLeft size={20} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-foreground">
          Task Reminders
        </Text>
        <View className="w-5" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 18, paddingBottom: 40, gap: 16 }}
      >
        <View className="px-5">
          <Text className="text-xl font-bold text-foreground tracking-tight">
            Organization Policy
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Configure automated due-soon and overdue reminder rules
          </Text>
        </View>

        {!isOwnerOrAdmin && (
          <View className="mx-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Text className="text-xs text-amber-500 font-semibold">
              Read-Only: Only organization administrators can change reminder policies.
            </Text>
          </View>
        )}

        {/* Card 1: Due Soon Notices */}
        <Card className="p-4 mx-4 gap-3 bg-card border-border">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Clock size={18} className="text-cyan-500" />
              <Text className="text-sm font-bold text-foreground">
                Advance Notice Reminders
              </Text>
            </View>
            <Switch
              value={dueSoonEnabled}
              onValueChange={setDueSoonEnabled}
              disabled={!isOwnerOrAdmin}
            />
          </View>

          {dueSoonEnabled && (
            <View className="gap-3 pt-2 border-t border-border">
              <Text className="text-xs font-semibold text-muted-foreground">
                Notice Milestones:
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {NOTICE_OPTIONS.map((opt) => {
                  const isSelected = noticeHours.includes(opt.value);
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => toggleNotice(opt.value)}
                      disabled={!isOwnerOrAdmin}
                      className={`px-3 py-1.5 rounded-lg border ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-muted/40 border-border"
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          isSelected
                            ? "text-primary-foreground font-bold"
                            : "text-foreground"
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View className="flex-row items-center justify-between pt-2">
                <Text className="text-xs text-foreground font-medium">
                  Notify Task Creator
                </Text>
                <Switch
                  value={dueSoonCreator}
                  onValueChange={setDueSoonCreator}
                  disabled={!isOwnerOrAdmin}
                />
              </View>
            </View>
          )}
        </Card>

        {/* Card 2: Overdue Notices */}
        <Card className="p-4 mx-4 gap-3 bg-card border-border">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <AlertTriangle size={18} className="text-rose-500" />
              <Text className="text-sm font-bold text-foreground">
                Overdue Warning Cadence
              </Text>
            </View>
            <Switch
              value={overdueEnabled}
              onValueChange={setOverdueEnabled}
              disabled={!isOwnerOrAdmin}
            />
          </View>

          {overdueEnabled && (
            <View className="gap-3 pt-2 border-t border-border">
              <Text className="text-xs font-semibold text-muted-foreground">
                Repeat Frequency:
              </Text>
              <View className="flex-row gap-2">
                {[
                  { label: "Daily (24h)", val: 24 },
                  { label: "Every 12h", val: 12 },
                  { label: "Once Only", val: 0 },
                ].map((freq) => (
                  <TouchableOpacity
                    key={freq.val}
                    onPress={() => isOwnerOrAdmin && setRepeatIntervalHours(freq.val)}
                    disabled={!isOwnerOrAdmin}
                    className={`flex-1 py-2 items-center rounded-lg border ${
                      repeatIntervalHours === freq.val
                        ? "bg-primary border-primary"
                        : "bg-muted/40 border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        repeatIntervalHours === freq.val
                          ? "text-primary-foreground font-bold"
                          : "text-foreground"
                      }`}
                    >
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="flex-row items-center justify-between pt-2">
                <View className="flex-1 pr-2">
                  <Text className="text-xs text-foreground font-medium">
                    Escalate to Admins
                  </Text>
                  <Text className="text-[10px] text-muted-foreground">
                    Alert organization leadership if &gt; 3 days overdue
                  </Text>
                </View>
                <Switch
                  value={escalateToAdmins}
                  onValueChange={setEscalateToAdmins}
                  disabled={!isOwnerOrAdmin}
                />
              </View>
            </View>
          )}
        </Card>

        {/* Card 3: Quiet Hours */}
        <Card className="p-4 mx-4 gap-3 bg-card border-border">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Moon size={18} className="text-violet-500" />
              <View>
                <Text className="text-sm font-bold text-foreground">
                  Quiet Hours (Night Window)
                </Text>
                <Text className="text-[10px] text-muted-foreground">
                  Suppress Push/SMS between 22:00 - 08:00
                </Text>
              </View>
            </View>
            <Switch
              value={quietHoursEnabled}
              onValueChange={setQuietHoursEnabled}
              disabled={!isOwnerOrAdmin}
            />
          </View>
        </Card>

        {/* Save Button */}
        {isOwnerOrAdmin && (
          <Button
            className="mx-4 mt-2 h-[48px]"
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-sm font-bold text-primary-foreground">
                Save Reminder Policy
              </Text>
            )}
          </Button>
        )}
      </ScrollView>
    </View>
  );
}
