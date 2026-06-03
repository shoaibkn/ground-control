import * as React from "react";
import { View, TouchableOpacity, Modal, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { 
  ArrowLeft, 
  Building, 
  Sun, 
  Moon, 
  Monitor, 
  Settings, 
  LogOut, 
  Check, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react-native";
import { Text } from "./text";
import { Card } from "./card";
import { authClient } from "@/lib/auth-client";
import { Uniwind, useUniwind } from "uniwind";

interface HeaderProps {
  title: string | React.ReactNode;
}

export function Header({ title }: HeaderProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: organizations } = authClient.useListOrganizations();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { theme } = useUniwind();
  
  const canGoBack = router.canGoBack();
  
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [orgSectionOpen, setOrgSectionOpen] = React.useState(false);
  const [switchingOrgId, setSwitchingOrgId] = React.useState<string | null>(null);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleSwitchOrg = async (orgId: string) => {
    setSwitchingOrgId(orgId);
    try {
      await authClient.organization.setActive({ organizationId: orgId });
      setOrgSectionOpen(false);
      setMenuVisible(false);
    } catch (err) {
      console.error("Failed to switch organization", err);
    } finally {
      setSwitchingOrgId(null);
    }
  };

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await authClient.signOut();
      setMenuVisible(false);
      router.replace("/(auth)/sign-in");
    } catch (e) {
      console.error("Sign out failed", e);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    Uniwind.setTheme(newTheme);
  };

  return (
    <View className="pt-[54px] pb-3 px-5 flex-row items-center justify-between bg-background">
      <View className="flex-row items-center gap-3 flex-1">
        {canGoBack && (
          <TouchableOpacity 
            className="p-1 rounded-md active:bg-accent border border-transparent"
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} className="text-foreground" />
          </TouchableOpacity>
        )}
        {typeof title === "string" ? (
          <Text className="text-base font-bold text-foreground" numberOfLines={1}>
            {title}
          </Text>
        ) : (
          title
        )}
      </View>

      <TouchableOpacity
        className="w-8 h-8 rounded-full bg-primary justify-center items-center ml-4"
        onPress={() => setMenuVisible(true)}
      >
        <Text className="text-[11px] font-extrabold text-primary-foreground">
          {getInitials(session?.user?.name)}
        </Text>
      </TouchableOpacity>

      {/* User Avatar Menu Modal Dropdown */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable 
          className="flex-1 bg-black/60 justify-center items-center p-6"
          onPress={() => setMenuVisible(false)}
        >
          <Pressable className="w-full max-w-[340px]" onPress={(e) => e.stopPropagation()}>
            <Card className="p-5 gap-4 bg-background border-border shadow-2xl">
              
              {/* User Identity Header */}
              <View className="flex-row items-center gap-3 border-b border-border pb-3.5">
                <View className="w-9 h-9 rounded-full bg-primary justify-center items-center">
                  <Text className="text-xs font-bold text-primary-foreground">
                    {getInitials(session?.user?.name)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                    {session?.user?.name || "User Profile"}
                  </Text>
                  <Text className="text-[10px] text-muted-foreground mt-0.5" numberOfLines={1}>
                    {session?.user?.email || "No email"}
                  </Text>
                </View>
              </View>

              {/* Theme Settings Selector */}
              <View className="gap-2">
                <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Theme Settings
                </Text>
                <View className="flex-row bg-muted/30 border border-border rounded-lg p-0.5">
                  {[
                    { id: "light", label: "Light", icon: Sun },
                    { id: "dark", label: "Dark", icon: Moon },
                    { id: "system", label: "System", icon: Monitor },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = theme === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        className={`flex-1 flex-row gap-1 py-1.5 rounded-md justify-center items-center ${
                          isSelected ? "bg-card border border-border/40 shadow-sm" : "border border-transparent bg-transparent"
                        }`}
                        onPress={() => handleThemeChange(item.id as any)}
                      >
                        <Icon size={12} className={isSelected ? "text-foreground" : "text-muted-foreground"} />
                        <Text className={`text-[10px] font-semibold ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Organization Workspace Selector */}
              <View className="gap-2">
                <TouchableOpacity 
                  className="flex-row justify-between items-center py-1"
                  onPress={() => setOrgSectionOpen(!orgSectionOpen)}
                >
                  <View className="flex-row items-center gap-1.5">
                    <Building size={14} className="text-muted-foreground" />
                    <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Workspaces
                    </Text>
                  </View>
                  {orgSectionOpen ? (
                    <ChevronUp size={14} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={14} className="text-muted-foreground" />
                  )}
                </TouchableOpacity>

                {orgSectionOpen ? (
                  <View className="max-h-[140px] border border-border/50 rounded-lg p-1.5 bg-muted/10">
                    <ScrollView nestedScrollEnabled>
                      {(organizations || []).map((org) => {
                        const isSelected = activeOrg?.id === org.id;
                        const isSwitching = switchingOrgId === org.id;

                        return (
                          <TouchableOpacity
                            key={org.id}
                            className={`flex-row justify-between items-center py-2 px-2.5 rounded-md mb-1 border ${
                              isSelected ? "bg-card border-border" : "border-transparent bg-transparent"
                            }`}
                            onPress={() => !isSelected && handleSwitchOrg(org.id)}
                            disabled={isSwitching || isSelected}
                          >
                            <View className="flex-1 pr-2">
                              <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>{org.name}</Text>
                              <Text className="text-[9px] text-muted-foreground" numberOfLines={1}>{org.slug}</Text>
                            </View>

                            {isSwitching ? (
                              <ActivityIndicator size="small" color="#3B82F6" />
                            ) : isSelected ? (
                              <Check size={14} className="text-primary" />
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : (
                  <TouchableOpacity
                    className="flex-row justify-between items-center py-2 px-3 border border-border/50 rounded-lg bg-muted/20"
                    onPress={() => setOrgSectionOpen(true)}
                  >
                    <Text className="text-xs font-semibold text-foreground">
                      {activeOrg?.name || "Select Workspace"}
                    </Text>
                    <Check size={12} className="text-primary" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Navigation Action Links */}
              <View className="border-t border-border pt-2 gap-1.5">
                <TouchableOpacity
                  className="flex-row items-center gap-2.5 py-2 px-1 rounded-md active:bg-accent"
                  onPress={() => {
                    setMenuVisible(false);
                    router.push("/settings");
                  }}
                >
                  <Settings size={15} className="text-muted-foreground" />
                  <Text className="text-xs font-semibold text-foreground">Account Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center gap-2.5 py-2 px-1 rounded-md active:bg-accent"
                  onPress={handleSignOut}
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <>
                      <LogOut size={15} className="text-destructive" />
                      <Text className="text-xs font-semibold text-destructive">Sign Out</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                className="mt-2 h-10 border border-border rounded-lg justify-center items-center bg-card active:bg-accent"
                onPress={() => setMenuVisible(false)}
              >
                <Text className="text-xs font-semibold text-foreground">Close</Text>
              </TouchableOpacity>

            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
