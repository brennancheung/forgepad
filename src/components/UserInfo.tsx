'use client'

import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function UserInfo() {
  const user = useQuery(api.users.getCurrentUser)

  // Loading state
  if (user === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </CardContent>
      </Card>
    )
  }

  // No user found (should not happen if authenticated)
  if (user === null) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>User Not Found</AlertTitle>
        <AlertDescription>
          Could not load user data from Convex. Please try signing out and back in.
        </AlertDescription>
      </Alert>
    )
  }

  // Success - display user info
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current User (from Convex)</CardTitle>
        <CardDescription>This data is loaded from your Convex database</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-semibold text-muted-foreground">Convex ID:</dt>
            <dd className="font-mono">{user._id}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Clerk ID:</dt>
            <dd className="font-mono">{user.clerkId}</dd>
          </div>
          <div>
            <dt className="font-semibold text-muted-foreground">Email:</dt>
            <dd>{user.email}</dd>
          </div>
          {user.name && (
            <div>
              <dt className="font-semibold text-muted-foreground">Name:</dt>
              <dd>{user.name}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  )
}
