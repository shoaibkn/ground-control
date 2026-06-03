import { useState } from "react";
import {
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { authClient } from "../../lib/auth-client";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message || "Failed to create an account.");
      } else {
        router.replace("/");
      }
    } catch (e) {
      const err = e as Error;
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <Text className="text-3xl font-extrabold text-primary mb-2 tracking-wide">Ground Control</Text>
          <Text className="text-xl font-bold text-foreground mb-1">Create account</Text>
          <Text className="text-xs text-muted-foreground text-center">Get started by creating your account</Text>
        </View>

        {error && (
          <View className="bg-destructive/15 border border-destructive/30 rounded-xl p-3 mb-5">
            <Text className="text-destructive text-center text-xs font-semibold">{error}</Text>
          </View>
        )}

        <View className="gap-5">
          <View className="gap-2">
            <Label>Full Name</Label>
            <Input
              placeholder="John Doe"
              autoCapitalize="words"
              autoCorrect={false}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="gap-2">
            <Label>Email Address</Label>
            <Input
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="gap-2">
            <Label>Password</Label>
            <Input
              placeholder="Choose a strong password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Button
            className="mt-2 h-11 bg-primary shadow"
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-sm font-bold text-primary-foreground">Sign Up</Text>
            )}
          </Button>
        </View>

        <View className="flex-row justify-center items-center mt-8">
          <Text className="text-xs text-muted-foreground">Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text className="text-xs font-bold text-primary">Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
