"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { 
  GraduationCap, 
  Shield, 
  BookOpen, 
  BarChart3, 
  Eye,
  CheckCircle2 
} from "lucide-react"
import type { UserRole } from "@/lib/types"

interface RoleOption {
  value: UserRole
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
  recommended?: boolean
}

const roleOptions: RoleOption[] = [
  {
    value: "student",
    title: "Student",
    description: "I'm a high school student working on essays and assignments",
    icon: <GraduationCap className="h-6 w-6" />,
    features: [
      "AI-powered writing assistance",
      "Grammar and style checking",
      "Academic readability analysis",
      "Essay tutor chat support",
      "Personal document library",
      "Writing progress tracking"
    ],
    recommended: true
  },
  {
    value: "admin",
    title: "Teacher/Administrator",
    description: "I'm an educator or administrator who needs to manage students",
    icon: <Shield className="h-6 w-6" />,
    features: [
      "All student features included",
      "View all student documents",
      "Access keystroke recordings",
      "Student progress analytics",
      "User management capabilities",
      "Export and reporting tools"
    ]
  }
]

interface RoleSelectorProps {
  selectedRole?: UserRole
  onRoleChange: (role: UserRole) => void
  onConfirm?: () => void
  showConfirmButton?: boolean
  className?: string
}

export function RoleSelector({ 
  selectedRole = "student", 
  onRoleChange, 
  onConfirm,
  showConfirmButton = false,
  className = "" 
}: RoleSelectorProps) {
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null)

  const handleRoleSelect = (role: UserRole) => {
    onRoleChange(role)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">Choose Your Role</h2>
        <p className="text-gray-600">
          Select the option that best describes you to get the most relevant features
        </p>
      </div>

      <div className="space-y-4">
        {roleOptions.map((option) => (
          <div key={option.value} className="relative">
            <Label 
              htmlFor={option.value}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredRole(option.value)}
              onMouseLeave={() => setHoveredRole(null)}
            >
              <Card 
                className={`transition-all duration-200 hover:shadow-md ${
                  selectedRole === option.value 
                    ? 'ring-2 ring-emerald-500 border-emerald-200 bg-emerald-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${
                  hoveredRole === option.value ? 'scale-[1.02]' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value={option.value}
                          name="role"
                          id={option.value}
                          checked={selectedRole === option.value}
                          onChange={() => handleRoleSelect(option.value)}
                          className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                        />
                        <div className={`p-2 rounded-lg ${
                          selectedRole === option.value 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {option.icon}
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {option.title}
                          {option.recommended && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                              Recommended
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {option.description}
                        </CardDescription>
                      </div>
                    </div>
                    {selectedRole === option.value && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      What you'll get:
                    </h4>
                    <div className="grid gap-1">
                      {option.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </div>

      {/* Role-specific additional information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {selectedRole === "student" ? (
              <BookOpen className="h-5 w-5 text-blue-600" />
            ) : (
              <BarChart3 className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-900">
              {selectedRole === "student" 
                ? "Perfect for Academic Writing" 
                : "Comprehensive Teacher Tools"
              }
            </h4>
            <p className="text-sm text-blue-700">
              {selectedRole === "student" 
                ? "Get AI-powered assistance for essays, research papers, and assignments. Your writing progress is tracked and your work is always yours—we help you improve while maintaining academic integrity."
                : "Access comprehensive tools to monitor student progress, review writing sessions, and ensure academic integrity. Help students develop better writing skills with detailed analytics and insights."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Privacy notice for keystroke recording */}
      {selectedRole === "student" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Eye className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-900">
                Writing Process Recording
              </h4>
              <p className="text-sm text-amber-700">
                To maintain academic integrity, your writing process (keystrokes and timing) will be recorded. 
                This helps teachers verify original work and understand your writing patterns to provide better support.
                <span className="block mt-1 font-medium">
                  All recordings are encrypted and only accessible to authorized educators.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {showConfirmButton && onConfirm && (
        <Button 
          onClick={onConfirm}
          className="w-full"
          size="lg"
        >
          Continue as {roleOptions.find(r => r.value === selectedRole)?.title}
        </Button>
      )}
    </div>
  )
}

// Compact version for use in smaller spaces
interface CompactRoleSelectorProps {
  selectedRole: UserRole
  onRoleChange: (role: UserRole) => void
  className?: string
}

export function CompactRoleSelector({ 
  selectedRole, 
  onRoleChange, 
  className = "" 
}: CompactRoleSelectorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium text-gray-700">
        I am a:
      </Label>
      <div className="flex space-x-6">
        {roleOptions.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <input
              type="radio"
              value={option.value}
              name="compact-role"
              id={`compact-${option.value}`}
              checked={selectedRole === option.value}
              onChange={() => onRoleChange(option.value)}
              className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
            />
            <Label 
              htmlFor={`compact-${option.value}`}
              className="text-sm cursor-pointer flex items-center space-x-1"
            >
              <div className="text-gray-600">
                {option.icon}
              </div>
              <span>{option.title}</span>
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}

// Export role options for use in other components
export { roleOptions }
export type { RoleOption } 