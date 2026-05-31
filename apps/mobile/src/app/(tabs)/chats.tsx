import { StyleSheet, Text, View, ScrollView } from "react-native";
import { MessageSquare } from "lucide-react-native";

export default function ChatsTab() {
  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ground Control</Text>
      </View>

      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentHeader}>
          <Text style={styles.title}>Chats</Text>
          <Text style={styles.subtitle}>Collaborate and chat with your workspace team members</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MessageSquare size={40} color="#3B82F6" />
          </View>
          <Text style={styles.cardTitle}>Team Chats</Text>
          <Text style={styles.cardDescription}>
            Real-time direct messages and group channels will be shown here. No active conversations yet.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090B",
  },
  header: {
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E24",
    backgroundColor: "#09090B",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3B82F6",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  contentHeader: {
    gap: 4,
    paddingVertical: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FAFAFA",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: "#A1A1AA",
  },
  card: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  cardDescription: {
    fontSize: 12,
    color: "#71717A",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
