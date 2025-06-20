"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Shield, Info, Eye } from "lucide-react"
import { ConsentSettings } from "@/components/keystroke/consent-notice"

interface OnboardingConsentProps {
  onConsentChange: (consent: ConsentSettings | null) => void
  isConsented: boolean
}

export function OnboardingConsent({ onConsentChange, isConsented }: OnboardingConsentProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [consentSettings, setConsentSettings] = useState<ConsentSettings>({
    recordingEnabled: false,
    privacyLevel: 'anonymized',
    dataRetentionDays: 30,
    allowTeacherReview: true,
    allowPlaybackReview: false,
    consentTimestamp: new Date(),
    studentSignature: ''
  });

  const handleConsentChange = (checked: boolean) => {
    if (checked) {
      const finalConsent: ConsentSettings = {
        ...consentSettings,
        recordingEnabled: true,
        consentTimestamp: new Date(),
        studentSignature: 'onboarding-consent'
      };
      onConsentChange(finalConsent);
    } else {
      onConsentChange(null);
    }
  };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-slate-50">
      <div className="flex items-start space-x-3">
        <Shield className="h-5 w-5 text-blue-600 mt-1" />
        <div className="flex-1">
          <h4 className="font-medium text-gray-800">Keystroke Recording for Feedback</h4>
          <p className="text-sm text-gray-600 mt-1">
            To provide you with advanced writing feedback, WordWise records your keystroke patterns during writing sessions. This data helps teachers understand your writing process and provide better guidance.
          </p>
          <div className="flex items-center space-x-2 mt-3">
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="link" size="sm" className="p-0 h-auto text-blue-600">
                  <Info className="h-3 w-3 mr-1" />
                  Privacy Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Privacy Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Privacy Level: Anonymized</Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Your typing patterns are recorded without personal content. Teachers see timing and behavior, not what you wrote.
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Data Retention: 30 days</Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Recording data is automatically deleted after 30 days for privacy protection.
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Teacher Review: Enabled</Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Your teacher can view analytics to provide writing feedback and support.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2 mt-4 ml-8">
        <Checkbox
          id="keystroke-consent"
          checked={isConsented}
          onCheckedChange={handleConsentChange}
        />
        <Label htmlFor="keystroke-consent" className="text-sm font-medium leading-none cursor-pointer">
          I agree to keystroke recording with the privacy settings above.
        </Label>
      </div>
    </div>
  )
} 