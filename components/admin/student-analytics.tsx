"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  FileText, 
  Target,
  Award,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"
import type { UserWithRole } from "@/lib/types"

interface AdminStats {
  totalStudents: number
  totalDocuments: number
  averageGrammarScore: number
  activeThisWeek: number
}

interface StudentProgress {
  id: string
  email: string
  documentsCount: number
  grammarScore: number
  writingStreak: number
  lastActivity: string
  improvementRate: number
  totalWords: number
}

interface StudentAnalyticsProps {
  students: UserWithRole[]
  stats: AdminStats
  onStudentSelect: (student: UserWithRole) => void
}

export function StudentAnalytics({ students, stats, onStudentSelect }: StudentAnalyticsProps) {
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<'grammar' | 'documents' | 'activity'>('grammar')

  useEffect(() => {
    loadStudentProgress()
  }, [students])

  const loadStudentProgress = async () => {
    setLoading(true)
    try {
      // Simulate loading student progress data
      // In a real implementation, this would fetch from the database
      const mockProgress: StudentProgress[] = students.map((student, index) => ({
        id: student.id,
        email: student.email,
        documentsCount: Math.floor(Math.random() * 15) + 1,
        grammarScore: Math.floor(Math.random() * 30) + 70, // 70-100%
        writingStreak: Math.floor(Math.random() * 14), // 0-14 days
        lastActivity: student.last_sign_in_at || student.created_at || new Date().toISOString(),
        improvementRate: Math.floor(Math.random() * 40) - 20, // -20 to +20%
        totalWords: Math.floor(Math.random() * 5000) + 500
      }))
      
      setStudentProgress(mockProgress)
    } catch (error) {
      console.error('Error loading student progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTopPerformers = () => {
    return studentProgress
      .sort((a, b) => b.grammarScore - a.grammarScore)
      .slice(0, 5)
  }

  const getMostActive = () => {
    return studentProgress
      .sort((a, b) => b.documentsCount - a.documentsCount)
      .slice(0, 5)
  }

  const getNeedsAttention = () => {
    return studentProgress
      .filter(student => 
        student.grammarScore < 75 || 
        student.documentsCount < 2 ||
        new Date(student.lastActivity) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      )
      .slice(0, 5)
  }

  const getGradeDistribution = () => {
    const excellent = studentProgress.filter(s => s.grammarScore >= 90).length
    const good = studentProgress.filter(s => s.grammarScore >= 80 && s.grammarScore < 90).length
    const fair = studentProgress.filter(s => s.grammarScore >= 70 && s.grammarScore < 80).length
    const poor = studentProgress.filter(s => s.grammarScore < 70).length
    
    return { excellent, good, fair, poor }
  }

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getImprovementBadge = (rate: number) => {
    if (rate > 10) return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>
    if (rate > 0) return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Improving</Badge>
    if (rate > -10) return <Badge variant="secondary">Stable</Badge>
    return <Badge className="bg-red-100 text-red-800 border-red-200">Needs Help</Badge>
  }

  const gradeDistribution = getGradeDistribution()
  const topPerformers = getTopPerformers()
  const mostActive = getMostActive()
  const needsAttention = getNeedsAttention()

  return (
    <div className="space-y-6">
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Writing Quality Distribution</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Excellent (90-100%)</span>
                <Badge className="bg-green-100 text-green-800">{gradeDistribution.excellent}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Good (80-89%)</span>
                <Badge className="bg-blue-100 text-blue-800">{gradeDistribution.good}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fair (70-79%)</span>
                <Badge className="bg-yellow-100 text-yellow-800">{gradeDistribution.fair}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Needs Work (&lt;70%)</span>
                <Badge className="bg-red-100 text-red-800">{gradeDistribution.poor}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Metrics</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold">{Math.round(stats.activeThisWeek / stats.totalStudents * 100)}%</div>
                <p className="text-xs text-muted-foreground">Weekly active rate</p>
              </div>
              <div>
                <div className="text-lg font-semibold">{Math.round(stats.totalDocuments / stats.totalStudents)}</div>
                <p className="text-xs text-muted-foreground">Avg documents per student</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Students improving</span>
                <span className="text-lg font-semibold text-green-600">
                  {studentProgress.filter(s => s.improvementRate > 0).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Need attention</span>
                <span className="text-lg font-semibold text-red-600">
                  {needsAttention.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Performance Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span>Top Performers</span>
            </CardTitle>
            <CardDescription>Students with highest grammar scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((student, index) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-32">{student.email}</p>
                      <p className="text-xs text-gray-500">{student.documentsCount} documents</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{student.grammarScore}%</p>
                    <p className="text-xs text-gray-500">grammar score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Active */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span>Most Active</span>
            </CardTitle>
            <CardDescription>Students with most documents created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostActive.map((student, index) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-32">{student.email}</p>
                      <p className="text-xs text-gray-500">{formatLastActivity(student.lastActivity)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">{student.documentsCount}</p>
                    <p className="text-xs text-gray-500">documents</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Needs Attention</span>
            </CardTitle>
            <CardDescription>Students who may need additional support</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {needsAttention.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="text-sm font-medium truncate max-w-32">{student.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-red-600">{student.grammarScore}% grammar</p>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs text-gray-500">{formatLastActivity(student.lastActivity)}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const fullStudent = students.find(s => s.id === student.id)
                      if (fullStudent) onStudentSelect(fullStudent)
                    }}
                  >
                    Help
                  </Button>
                </div>
              ))}
              {needsAttention.length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">All students are doing well!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Student Progress</CardTitle>
          <CardDescription>
            Comprehensive view of all student writing metrics and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Student</th>
                  <th className="text-left p-2 font-medium">Grammar Score</th>
                  <th className="text-left p-2 font-medium">Documents</th>
                  <th className="text-left p-2 font-medium">Total Words</th>
                  <th className="text-left p-2 font-medium">Writing Streak</th>
                  <th className="text-left p-2 font-medium">Improvement</th>
                  <th className="text-left p-2 font-medium">Last Active</th>
                  <th className="text-left p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentProgress.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="font-medium text-sm truncate max-w-40">{student.email}</div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${
                          student.grammarScore >= 90 ? 'text-green-600' :
                          student.grammarScore >= 80 ? 'text-blue-600' :
                          student.grammarScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {student.grammarScore}%
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <span className="font-medium">{student.documentsCount}</span>
                    </td>
                    <td className="p-2">
                      <span className="text-gray-600">{student.totalWords.toLocaleString()}</span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{student.writingStreak} days</span>
                      </div>
                    </td>
                    <td className="p-2">
                      {getImprovementBadge(student.improvementRate)}
                    </td>
                    <td className="p-2 text-sm text-gray-600">
                      {formatLastActivity(student.lastActivity)}
                    </td>
                    <td className="p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const fullStudent = students.find(s => s.id === student.id)
                          if (fullStudent) onStudentSelect(fullStudent)
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 