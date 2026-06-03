import { View, ScrollView } from "react-native";
import { ClipboardCheck } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/ui/header";

export default function ApprovalsTab() {
  return (
    <View className="flex-1 bg-background">
      <Header title="Ground Control" />

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 20, gap: 24 }}
      >
        <View className="gap-1 py-1.5">
          <Text className="text-2xl font-bold text-foreground tracking-tight">Approvals</Text>
          <Text className="text-xs text-muted-foreground">Track, review, and sign off on tasks and documents</Text>
        </View>

        <Card className="p-6 items-center justify-center gap-3 mt-4 bg-card border-border">
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
            <ClipboardCheck size={40} className="text-primary" />
          </View>
          <Text className="text-base font-semibold text-foreground">Approvals Board</Text>
          <Text className="text-xs text-muted-foreground text-center leading-5 px-3">
            Any tasks requiring your official sign-off or review will appear here. No approval requests pending.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}
