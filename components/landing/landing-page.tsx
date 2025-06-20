"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Brain, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Play, 
  CheckCircle,
  Zap,
  Shield,
  Star,
  ArrowRight,
  GraduationCap,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import DemoSection from "./demo-section"
import TestimonialsSection from "./testimonials-section"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">WordWise</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/role-setup">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/role-setup">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              🎓 For High School Students & Educators
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Write Better Essays with
              <span className="text-blue-600"> AI-Powered </span>
              Writing Support
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              WordWise helps high school students improve their academic writing with real-time grammar checking, vocabulary enhancement, and AI tutoring - while giving educators powerful tools to monitor progress and verify original work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/role-setup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Writing Better Essays
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Watch Demo
                <Play className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features for Students */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <BookOpen className="mr-2 h-4 w-4" />
              For Students
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Master Academic Writing Skills
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get the support you need to write compelling essays and improve your writing skills with every assignment.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <Badge variant="secondary">Real-time</Badge>
                </div>
                <CardTitle className="text-xl">Grammar & Spelling</CardTitle>
                <CardDescription>
                  Catch errors immediately and choose the right words for your essays
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    Real-time error detection as you type
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    Explanations with each correction
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    Learn proper grammar rules
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    Avoid making the same mistakes
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-200 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Zap className="h-8 w-8 text-purple-600" />
                  <Badge variant="secondary">AI-Powered</Badge>
                </div>
                <CardTitle className="text-xl">Vocabulary Enhancement</CardTitle>
                <CardDescription>
                  Use more sophisticated words and write with clarity and precision
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    Sophisticated word suggestions
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    Clarity and conciseness improvements
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    Academic writing style guidance
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    Context-appropriate vocabulary
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-orange-200 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <MessageSquare className="h-8 w-8 text-orange-600" />
                  <Badge variant="secondary">Tutor Chat</Badge>
                </div>
                <CardTitle className="text-xl">AI Essay Tutor</CardTitle>
                <CardDescription>
                  Get personalized guidance to develop your ideas and arguments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                    Chat about your essay ideas
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                    Develop arguments and structure
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                    AI guides without writing for you
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                    Build critical thinking skills
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features for Educators */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Users className="mr-2 h-4 w-4" />
              For Educators
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Monitor Progress & Ensure Academic Integrity
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful tools to track student progress, verify original work, and understand the writing process.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <Badge variant="secondary">Analytics</Badge>
                </div>
                <CardTitle className="text-xl">Readability Analysis</CardTitle>
                <CardDescription>
                  Ensure essays meet grade-level and assignment requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    Grade-level appropriateness scoring
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    Assignment requirement alignment
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    Writing complexity metrics
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    Vocabulary level assessment
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-200 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Play className="h-8 w-8 text-green-600" />
                  <Badge variant="secondary">Verification</Badge>
                </div>
                <CardTitle className="text-xl">Keystroke Recording</CardTitle>
                <CardDescription>
                  Replay student writing sessions to verify original work
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Complete writing process replay
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Verify original work authenticity
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Understand writing patterns
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    See AI interaction history
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-200 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Brain className="h-8 w-8 text-purple-600" />
                  <Badge variant="secondary">Insights</Badge>
                </div>
                <CardTitle className="text-xl">Progress Monitoring</CardTitle>
                <CardDescription>
                  Track student development and writing improvement over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    Writing skill progression tracking
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    Thought process development
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    Improvement over time analysis
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    Individual student insights
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <DemoSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why WordWise Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for high school academic writing with features that support both learning and teaching.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Academic Integrity</h3>
              <p className="text-gray-600 text-sm">
                AI guides learning without doing the work for students. Keystroke recording ensures original work.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real Learning</h3>
              <p className="text-gray-600 text-sm">
                Students learn grammar rules and writing skills through explanations, not just corrections.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Data-Driven Insights</h3>
              <p className="text-gray-600 text-sm">
                Educators get detailed analytics on student progress and writing development.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Grade Improvement</h3>
              <p className="text-gray-600 text-sm">
                Students see measurable improvement in essay quality and writing confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Writing?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of students and educators who are already improving their academic writing with WordWise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/role-setup">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-gray-900">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-6 w-6" />
                <span className="text-xl font-bold">WordWise</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered writing assistant designed specifically for high school academic writing.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Students</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Grammar Checking</li>
                <li>Vocabulary Enhancement</li>
                <li>AI Essay Tutor</li>
                <li>Writing Analytics</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Educators</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Progress Monitoring</li>
                <li>Keystroke Recording</li>
                <li>Readability Analysis</li>
                <li>Academic Integrity</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Help Center</li>
                <li>Documentation</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 mt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 WordWise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 