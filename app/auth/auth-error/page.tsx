import { AlertCircle, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-red-600">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              There was an issue confirming your email address. This could be due to:
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>The confirmation link has expired</li>
                <li>The link has already been used</li>
                <li>Supabase configuration issues</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              Please try signing up again or contact support if the issue persists.
            </p>
          </div>

          <Link href="/">
            <Button className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
