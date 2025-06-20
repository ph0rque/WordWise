"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  MessageSquare, 
  CheckCircle, 
  Zap,
  BarChart3
} from "lucide-react"

interface DemoSectionProps {
  className?: string
}

export default function DemoSection({ className }: DemoSectionProps) {
  const [activeDemo, setActiveDemo] = useState<string>("grammar")
  const [isPlaying, setIsPlaying] = useState(false)

  const demos = {
    grammar: {
      title: "Real-time Grammar & Spelling",
      description: "Watch how WordWise catches errors as you type and provides explanations",
      icon: <CheckCircle className="h-5 w-5" />,
      badge: "Grammar",
      content: (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600 mb-2">Student typing:</div>
            <div className="font-mono text-sm bg-gray-50 p-3 rounded">
              <span className="text-gray-800">The student's essay are </span>
              <span className="bg-red-100 text-red-800 px-1 rounded">well-written</span>
              <span className="text-gray-800"> and </span>
              <span className="bg-yellow-100 text-yellow-800 px-1 rounded">thier</span>
              <span className="text-gray-800"> arguments is compelling.</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <div className="font-medium text-red-800">Subject-Verb Agreement</div>
              <div className="text-red-700">
                "essay" is singular, so use "is" instead of "are"
              </div>
              <div className="text-xs text-red-600 mt-1">
                Suggestion: The student's essay <strong>is</strong> well-written
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
              <div className="font-medium text-yellow-800">Spelling Error</div>
              <div className="text-yellow-700">
                "thier" should be "their"
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                Suggestion: and <strong>their</strong> arguments
              </div>
            </div>
          </div>
        </div>
      )
    },
    vocabulary: {
      title: "Vocabulary Enhancement",
      description: "See how WordWise suggests more sophisticated academic vocabulary",
      icon: <Zap className="h-5 w-5" />,
      badge: "Enhancement",
      content: (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600 mb-2">Original text:</div>
            <div className="font-mono text-sm bg-gray-50 p-3 rounded">
              <span className="text-gray-800">The book is </span>
              <span className="bg-blue-100 text-blue-800 px-1 rounded">good</span>
              <span className="text-gray-800"> and </span>
              <span className="bg-blue-100 text-blue-800 px-1 rounded">shows</span>
              <span className="text-gray-800"> important ideas about society.</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <div className="font-medium text-blue-800">Vocabulary Enhancement</div>
              <div className="text-blue-700">
                Consider using more specific academic vocabulary
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Suggestions: "compelling" instead of "good", "illustrates" instead of "shows"
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
              <div className="font-medium text-purple-800">Academic Style</div>
              <div className="text-purple-700">
                Enhanced version for academic writing
              </div>
              <div className="text-xs text-purple-600 mt-1 font-mono">
                The book is <strong>compelling</strong> and <strong>illustrates</strong> significant concepts about society.
              </div>
            </div>
          </div>
        </div>
      )
    },
    tutor: {
      title: "AI Essay Tutor Chat",
      description: "Experience how the AI tutor helps develop ideas without writing content",
      icon: <MessageSquare className="h-5 w-5" />,
      badge: "AI Tutor",
      content: (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm font-medium">S</span>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">Student:</div>
                <div className="text-sm">I need to write about climate change but I'm not sure how to structure my argument.</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-orange-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">AI Tutor:</div>
                <div className="text-sm space-y-2">
                  <p>Great topic! Let's think about this step by step. What specific aspect of climate change interests you most?</p>
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <p className="font-medium">Consider exploring:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>Causes and effects</li>
                      <li>Solutions and policies</li>
                      <li>Economic impacts</li>
                      <li>Social justice aspects</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm font-medium">S</span>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">Student:</div>
                <div className="text-sm">I want to focus on renewable energy solutions.</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-orange-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">AI Tutor:</div>
                <div className="text-sm">
                  <p>Excellent choice! Now, what's your main argument about renewable energy? Are you advocating for a specific approach, or comparing different solutions?</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            <div className="font-medium text-green-800">Note: The AI tutor never writes content for students</div>
            <div className="text-green-700 text-xs mt-1">
              Instead, it asks guiding questions to help students develop their own ideas and arguments.
            </div>
          </div>
        </div>
      )
    },
    analytics: {
      title: "Progress Monitoring",
      description: "See how educators track student writing development over time",
      icon: <BarChart3 className="h-5 w-5" />,
      badge: "Analytics",
      content: (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600 mb-3">Student Writing Progress</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">8.5</div>
                <div className="text-xs text-gray-500">Grade Level</div>
                <div className="text-xs text-green-600">↑ from 7.2</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">92%</div>
                <div className="text-xs text-gray-500">Grammar Accuracy</div>
                <div className="text-xs text-green-600">↑ from 78%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">156</div>
                <div className="text-xs text-gray-500">Avg. Sentence Length</div>
                <div className="text-xs text-green-600">↑ from 142</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">47</div>
                <div className="text-xs text-gray-500">AI Interactions</div>
                <div className="text-xs text-gray-500">This assignment</div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="font-medium text-blue-800">Recent Improvements</div>
            <ul className="text-blue-700 text-xs mt-1 space-y-1">
              <li>• Increased use of transition words</li>
              <li>• More complex sentence structures</li>
              <li>• Better paragraph organization</li>
              <li>• Academic vocabulary expansion</li>
            </ul>
          </div>
        </div>
      )
    }
  }

  return (
    <section className={`py-20 bg-gradient-to-br from-gray-50 to-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <Play className="mr-2 h-4 w-4" />
            Interactive Demo
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            See WordWise in Action
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience how WordWise helps students write better essays with real-time feedback and AI guidance.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              {Object.entries(demos).map(([key, demo]) => (
                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                  {demo.icon}
                  <span className="hidden sm:inline">{demo.badge}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(demos).map(([key, demo]) => (
              <TabsContent key={key} value={key}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {demo.icon}
                        {demo.title}
                      </CardTitle>
                      <Badge variant="secondary">{demo.badge}</Badge>
                    </div>
                    <p className="text-gray-600">{demo.description}</p>
                  </CardHeader>
                  <CardContent>
                    {demo.content}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  )
} 