import { Tabs, useRouter } from "expo-router";
import { Home, ListTodo, ClipboardCheck, MessageSquare, Plus } from "lucide-react-native";
import { Platform, Pressable, View } from "react-native";

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#71717A",
        tabBarStyle: {
          backgroundColor: "#09090B",
          borderTopColor: "#1E1E24",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <ListTodo size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarButton: ({ ref, ...props }) => (
            <Pressable
              {...props}
              onPress={() => router.push("/create-task")}
              className="flex-1 justify-center items-center"
            >
              <View className="w-12 h-12 rounded-full bg-primary justify-center items-center shadow-lg -mt-5 border border-border">
                <Plus size={24} className="text-primary-foreground font-bold" />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: "Approvals",
          tabBarIcon: ({ color }) => <ClipboardCheck size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color }) => <MessageSquare size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
