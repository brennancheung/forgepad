'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Users, Camera, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId) router.push('/dashboard')
  }, [isLoaded, userId, router])

  // Show nothing while checking auth status or if user is logged in
  if (!isLoaded || userId) return null

  // Otherwise show the landing page
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold mb-6">Welcome to Photovenio</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          The all-in-one platform for organizing and managing photoshoot events with ease
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Photovenio?</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Contact Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Import and organize your models, photographers, and crew members in one place
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CalendarDays className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Event Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create photoshoot events, send invitations, and track RSVPs effortlessly
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Real-time Check-ins</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manage attendee check-ins and track participation during your events
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Camera className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Instagram Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Import contacts directly from Instagram and build your network faster
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your photoshoots?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join photographers and event organizers who trust Photovenio
          </p>
          <Button size="lg" asChild>
            <Link href="/sign-up">Start Free Trial</Link>
          </Button>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          <div className="flex justify-center">
            <div className="max-w-sm">
              <Image
                src="/testimonial-mikey.jpg"
                alt="Event testimonial"
                width={400}
                height={300}
                className="rounded-lg shadow-lg w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}