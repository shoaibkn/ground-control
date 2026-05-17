import { NextResponse } from "next/server"
import { fetchAuthMutation } from "@/lib/auth-server"
import { api } from "../../../../../../../packages/backend/convex/_generated/api"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { invitationId, organizationId } = body

    if (!invitationId) {
      return NextResponse.json({ error: "Missing invitationId" }, { status: 400 })
    }
    if (!organizationId) {
      return NextResponse.json({ error: "Missing organizationId" }, { status: 400 })
    }

    // Call our Convex secure delete mutation
    const result = await fetchAuthMutation(api.users.deleteInvitation, {
      invitationId,
      organizationId,
    })

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error("Error in deleteInvitation API Route:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
