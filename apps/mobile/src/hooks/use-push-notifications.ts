import { useEffect, useRef, useState } from "react"
import { Platform } from "react-native"
import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import Constants from "expo-constants"
import { useMutation } from "convex/react"
import { api } from "../../../../packages/backend/convex/_generated/api"
import { useRouter } from "expo-router"

// Configure notification presentation when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export function usePushNotifications(userId?: string | null) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const [notification, setNotification] = useState<Notifications.Notification | null>(null)
  const notificationListener = useRef<any>(null)
  const responseListener = useRef<any>(null)
  const router = useRouter()

  const registerTokenMutation = useMutation(api.notifications.registerPushToken)
  const unregisterTokenMutation = useMutation(api.notifications.unregisterPushToken)

  useEffect(() => {
    if (!userId) {
      return
    }

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token)
        registerTokenMutation({ pushToken: token }).catch((err) => {
          console.warn("[Push] Failed to register token with backend:", err)
        })
      }
    })

    // Listen for incoming notifications while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
      setNotification(notif)
    })

    // Listen for user interacting with / tapping notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data
      if (data?.link) {
        try {
          router.push(data.link as any)
        } catch (e) {
          console.warn("[Push] Could not navigate to link:", data.link, e)
        }
      }
    })

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove()
      }
      if (responseListener.current) {
        responseListener.current.remove()
      }
    }
  }, [userId])

  return {
    expoPushToken,
    notification,
    unregisterPushToken: () => unregisterTokenMutation({}),
  }
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default Ground Control Channel",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#000000",
    })
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") {
      console.warn("[Push] Permission not granted for push notifications")
      return null
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId

    try {
      const pushTokenResponse = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      )
      token = pushTokenResponse.data
    } catch (e) {
      console.warn("[Push] Error fetching Expo push token:", e)
    }
  } else {
    console.log("[Push] Must use physical device for Push Notifications")
  }

  return token
}
