"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Shield } from "lucide-react"

interface OnboardingConsentProps {
  onConsentChange: (isConsented: boolean) => void
  isConsented: boolean
}

export function OnboardingConsent({ onConsentChange, isConsented }: OnboardingConsentProps) {
  return (
    <div className="mt-6 p-4 border rounded-lg bg-slate-50">
      <div className="flex items-start space-x-3">
        <Shield className="h-5 w-5 text-blue-600 mt-1" />
        <div>
          <h4 className="font-medium text-gray-800">Keystroke Recording for Feedback</h4>
          <p className="text-sm text-gray-600 mt-1">
            To provide you with advanced writing feedback, WordWise records your keystroke patterns during writing sessions. This data is used for educational analysis and is only shared with your instructors.
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 mt-4 ml-8">
        <Checkbox
          id="keystroke-consent"
          checked={isConsented}
          onCheckedChange={(checked: boolean) => onConsentChange(checked)}
        />
        <Label htmlFor="keystroke-consent" className="text-sm font-medium leading-none cursor-pointer">
          I understand and agree to the recording of my keystroke data for educational analysis.
        </Label>
      </div>
    </div>
  )
} 