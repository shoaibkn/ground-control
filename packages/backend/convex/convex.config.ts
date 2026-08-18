import betterAuth from "./betterAuth/convex.config"
import resend from "@convex-dev/resend/convex.config"
import expoPushNotifications from "@convex-dev/expo-push-notifications/convex.config"
import { defineApp } from "convex/server"

const app = defineApp()
app.use(betterAuth)
app.use(resend)
app.use(expoPushNotifications)

export default app
