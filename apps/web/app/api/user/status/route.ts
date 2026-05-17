import { NextResponse } from "next/server"
import { fetchAuthMutation } from "@/lib/auth-server"
import { api } from "../../../../../../packages/backend/convex/_generated/api"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, status, organizationId } = body

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }
    if (!organizationId) {
      return NextResponse.json({ error: "Missing organizationId" }, { status: 400 })
    }

    // Call the Convex mutation. fetchAuthMutation automatically retrieves the token
    // from the Next.js request headers via React 19 / Next.js headers cache.
    const result = await fetchAuthMutation(api.users.updateUserStatus, {
      userId,
      status,
      organizationId,
    })

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error("Error in updateUserStatus API Route:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
