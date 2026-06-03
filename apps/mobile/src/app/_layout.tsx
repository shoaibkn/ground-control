import "../../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "../lib/auth-client";
import { ActivityIndicator, View } from "react-native";
import { PortalHost } from "@rn-primitives/portal";

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL || "https://posh-hummingbird-102.convex.cloud"
);

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isPending) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      // Redirect to the sign-in page if not logged in
      router.replace("/(auth)/sign-in");
    } else if (session && inAuthGroup) {
      // Redirect to the home page if logged in and trying to access auth screens
      router.replace("/");
    }
  }, [session, isPending, segments, router]);

  if (isPending) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
        <PortalHost />
      </AuthGuard>
    </ConvexBetterAuthProvider>
  );
}
