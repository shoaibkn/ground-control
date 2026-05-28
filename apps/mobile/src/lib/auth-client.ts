import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_CONVEX_SITE_URL || "https://posh-hummingbird-102.convex.site",
  plugins: [
    expoClient({
      scheme: "mobile",
      storage: SecureStore,
    }),
    convexClient(),
    organizationClient(),
  ],
  user: {
    fields: {
      status: {
        type: "string",
        required: false,
      },
    },
  },
});
