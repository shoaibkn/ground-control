"use client"
import { authClient } from "@/lib/auth-client"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function SubscriptionSettings() {
  const { data: activeMember, isPending } = authClient.useActiveMember()
  const canManageSubscription = activeMember?.role === "owner" || activeMember?.role === "admin"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {!isPending && !canManageSubscription && (
        <div className="md:col-span-2 lg:col-span-3 rounded-md bg-destructive/10 p-3 text-xs text-destructive font-medium border border-destructive/20 animate-in fade-in duration-200">
          Subscription plan management is restricted to organization owners and administrators.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Free</CardTitle>
          <CardDescription>Perfect for exploring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            $0
            <span className="text-sm font-normal text-muted-foreground">
              /mo
            </span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center">✓ 1 Member limit</li>
            <li className="flex items-center">✓ Basic support</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button className="w-full" variant="outline" disabled>
            Current Plan
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pro</CardTitle>
            <Badge>Popular</Badge>
          </div>
          <CardDescription>For growing teams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            $19
            <span className="text-sm font-normal text-muted-foreground">
              /mo
            </span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center">✓ Up to 10 Members</li>
            <li className="flex items-center">✓ Priority support</li>
            <li className="flex items-center">✓ Advanced analytics</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            disabled={isPending || !canManageSubscription}
          >
            Upgrade to Pro
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enterprise</CardTitle>
          <CardDescription>For large organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            $99
            <span className="text-sm font-normal text-muted-foreground">
              /mo
            </span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center">✓ Unlimited Members</li>
            <li className="flex items-center">✓ 24/7 dedicated support</li>
            <li className="flex items-center">✓ Custom integrations</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            variant="outline"
            disabled={isPending || !canManageSubscription}
          >
            Contact Sales
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
