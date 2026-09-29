import { useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { authClient } from "../lib/auth-client";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, ChevronRight } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsScreen() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: activeMember } = authClient.useActiveMember();

  const isAdminOrOwner = activeMember?.role === "admin" || activeMember?.role === "owner";

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
    <View className="flex-1 bg-background">
      {/* Header bar */}
      <View className="pt-[54px] pb-[14px] px-5 flex-row items-center justify-between border-b border-border bg-background">
        <TouchableOpacity className="p-1" onPress={() => router.back()}>
          <ArrowLeft size={20} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-foreground">Settings</Text>
        <View className="w-5" />
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingTop: 18, paddingBottom: 40, gap: 20 }}
      >
        <View className="px-5 pb-3">
          <Text className="text-xl font-bold text-foreground tracking-tight">Account Profile</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Manage organization roles and settings
          </Text>
        </View>

        <Card className="p-6 mx-4 items-center bg-card border-border">
          <View className="w-[70px] h-[70px] rounded-full bg-primary justify-center items-center mb-4">
            <Text className="text-2xl font-extrabold text-primary-foreground">{getInitials(session?.user?.name)}</Text>
          </View>

          <Text className="text-lg font-bold text-foreground mb-1">{session?.user?.name || "Anonymous User"}</Text>
          <Text className="text-xs text-muted-foreground mb-4">{session?.user?.email || "No email provided"}</Text>

          <Badge variant="secondary" className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20">
            <Text className="text-[11px] font-semibold text-emerald-500">
              {activeMember?.role 
                ? activeMember.role.charAt(0).toUpperCase() + activeMember.role.slice(1)
                : "Member"}
            </Text>
          </Badge>
        </Card>

        {/* Org details */}
        {activeOrg && (
          <Card className="p-4 mx-4 gap-1 bg-card border-border">
            <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Active Workspace</Text>
            <Text className="text-sm font-semibold text-foreground">{activeOrg.name}</Text>
            <Text className="text-xs text-muted-foreground">Slug: {activeOrg.slug}</Text>
          </Card>
        )}

        {/* Organization Admin Settings */}
        {isAdminOrOwner && (
          <Card className="p-4 mx-4 bg-card border-border gap-3">
            <View>
              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Workspace Administration
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Configure organization-wide rules and notifications
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/reminder-settings" as any)}
              className="flex-row items-center justify-between p-3.5 rounded-xl bg-accent/40 border border-border"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center">
                  <Bell size={20} className="text-primary" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">Task Reminders</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5 leading-4">
                    Advance notices, overdue repeats, quiet hours & escalations
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} className="text-muted-foreground" />
            </TouchableOpacity>
          </Card>
        )}

        <Button
          variant="destructive"
          className="mx-4 mt-2 h-[46px]"
          onPress={handleSignOut}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-sm font-semibold text-destructive-foreground">Sign Out</Text>
          )}
        </Button>
      </ScrollView>
    </View>
  );
}
