"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Loader2, 
  ArrowLeft, 
  User, 
  FileText, 
  Clock, 
  TrendingUp,
  Calendar,
  Target,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Download,
  Eye
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { getCurrentUserRole } from "@/lib/auth/roles"
import type { UserWithRole, Document } from "@/lib/types"

interface StudentDetail extends UserWithRole {
  documentsCount: number
  grammarScore: number
  writingStreak: number
  totalWords: number
  improvementRate: number
  joinedDaysAgo: number
}

interface StudentDocument {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  word_count: number
  grammar_score?: number
}

interface WritingSession {
  id: string
  document_id: string
  document_title: string
  start_time: string
  end_time: string
  duration_minutes: number
  keystrokes_count: number
  words_written: number
}

export default function StudentDetailPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [documents, setDocuments] = useState<StudentDocument[]>([])
  const [writingSessions, setWritingSessions] = useState<WritingSession[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  useEffect(() => {
    if (studentId) {
      initializeStudentDetail()
    }
  }, [studentId])

  const initializeStudentDetail = async () => {
    try {
      setLoading(true)
      setError("")

      if (!studentId) {
        setError('Student ID not found')
        return
      }

      // Check if user is admin
      const userRole = await getCurrentUserRole()
      if (userRole !== 'admin') {
        router.push('/')
        return
      }

      await Promise.all([
        loadStudentInfo(),
        loadStudentDocuments(),
        loadWritingSessions()
      ])

    } catch (err) {
      console.error('Error loading student details:', err)
      setError('Failed to load student information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadStudentInfo = async () => {
    try {
      // Use our API endpoint instead of direct Supabase query
      const response = await fetch(`/api/admin/students/${studentId}`)
      
      if (!response.ok) {
        throw new Error('Student not found')
      }

      const { student: studentData } = await response.json()

      if (!studentData) {
        throw new Error('Student not found')
      }

      // Calculate additional metrics
      const joinedDate = new Date(studentData.created_at)
      const today = new Date()
      const joinedDaysAgo = Math.floor((today.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24))

      // Mock additional analytics (in real implementation, these would come from analytics tables)
      const enhancedStudent: StudentDetail = {
        id: studentData.id,
        email: studentData.email,
        role: 'student',
        created_at: studentData.created_at,
        email_confirmed_at: studentData.email_confirmed_at,
        last_sign_in_at: studentData.last_sign_in_at,
        documentsCount: 0, // Will be updated after loading documents
        grammarScore: Math.floor(Math.random() * 30) + 70, // Mock data: 70-100%
        writingStreak: Math.floor(Math.random() * 14), // Mock data: 0-14 days
        totalWords: Math.floor(Math.random() * 10000) + 1000, // Mock data
        improvementRate: Math.floor(Math.random() * 40) - 20, // Mock data: -20 to +20%
        joinedDaysAgo,
        permissions: {
          canViewAllDocuments: false,
          canViewKeystrokeRecordings: false,
          canManageUsers: false,
          canAccessAnalytics: false,
          canExportData: false
        }
      }

      setStudent(enhancedStudent)
    } catch (err) {
      console.error('Error loading student info:', err)
      throw err
    }
  }

  const loadStudentDocuments = async () => {
    try {
      const supabase = getSupabaseClient()
      
      const { data: documentsData, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading documents:', error)
        // Don't throw - just continue with empty documents
        setDocuments([])
        return
      }

      const formattedDocuments: StudentDocument[] = documentsData?.map(doc => ({
        id: doc.id,
        title: doc.title || 'Untitled Document',
        content: doc.content || '',
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        word_count: doc.content ? doc.content.split(/\s+/).length : 0,
        grammar_score: Math.floor(Math.random() * 30) + 70 // Mock grammar score
      })) || []

      setDocuments(formattedDocuments)

      // Update student document count
      if (student) {
        setStudent(prev => prev ? { ...prev, documentsCount: formattedDocuments.length } : null)
      }
    } catch (err) {
      console.error('Error loading documents:', err)
      setDocuments([])
    }
  }

  const loadWritingSessions = async () => {
    try {
      // Mock writing sessions data (in real implementation, this would come from keystroke recordings)
      const mockSessions: WritingSession[] = documents.slice(0, 5).map((doc, index) => ({
        id: `session-${index}`,
        document_id: doc.id,
        document_title: doc.title,
        start_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 + Math.random() * 2 * 60 * 60 * 1000).toISOString(),
        duration_minutes: Math.floor(Math.random() * 120) + 15, // 15-135 minutes
        keystrokes_count: Math.floor(Math.random() * 5000) + 500,
        words_written: Math.floor(Math.random() * 500) + 100
      }))

      setWritingSessions(mockSessions)
    } catch (err) {
      console.error('Error loading writing sessions:', err)
      setWritingSessions([])
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = () => {
    if (!student) return null
    
    if (!student.email_confirmed_at) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Email Pending</Badge>
    }
    
    if (!student.last_sign_in_at) {
      return <Badge variant="secondary">Never Signed In</Badge>
    }
    
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    if (new Date(student.last_sign_in_at) > oneWeekAgo) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
    }
    
    return <Badge variant="secondary">Inactive</Badge>
  }

  const getImprovementBadge = (rate: number) => {
    if (rate > 10) return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent Progress</Badge>
    if (rate > 0) return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Improving</Badge>
    if (rate > -10) return <Badge variant="secondary">Stable</Badge>
    return <Badge className="bg-red-100 text-red-800 border-red-200">Needs Support</Badge>
  }

  const handleViewDocument = (documentId: string) => {
    // In a real implementation, this would open the document in a modal or new page
    console.log('View document:', documentId)
  }

  const handleViewWritingSession = (sessionId: string) => {
    // This would open the keystroke playback interface
    console.log('View writing session:', sessionId)
  }

  const handleDownloadReport = () => {
    // This would generate and download a student progress report
    console.log('Download student report for:', student?.email)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
            <p className="text-gray-600">Loading student details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Student Not Found</h2>
            <p className="text-gray-600 text-center mb-4">
              {error || "The requested student could not be found."}
            </p>
            <Button onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <User className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{student.email}</h1>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-600">Student Profile</p>
                    {getStatusBadge()}
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleDownloadReport}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Report</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Student Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grammar Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{student.grammarScore}%</div>
              <p className="text-xs text-muted-foreground">
                Overall writing quality
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{student.documentsCount}</div>
              <p className="text-xs text-muted-foreground">
                Essays and assignments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Writing Streak</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{student.writingStreak}</div>
              <p className="text-xs text-muted-foreground">
                Consecutive days active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Words</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{student.totalWords.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Words written to date
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
            <TabsTrigger value="sessions">Writing Sessions</TabsTrigger>
            <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{student.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Joined:</span>
                    <span className="font-medium">{formatDate(student.created_at)} ({student.joinedDaysAgo} days ago)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email Verified:</span>
                    <span className="font-medium">
                      {student.email_confirmed_at ? formatDate(student.email_confirmed_at) : 'Not verified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Sign In:</span>
                    <span className="font-medium">
                      {student.last_sign_in_at ? formatDate(student.last_sign_in_at) : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    {getStatusBadge()}
                  </div>
                </CardContent>
              </Card>

              {/* Progress Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Progress Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Improvement Rate:</span>
                    {getImprovementBadge(student.improvementRate)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Documents Created:</span>
                    <span className="font-medium">{student.documentsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Words/Document:</span>
                    <span className="font-medium">
                      {student.documentsCount > 0 ? Math.round(student.totalWords / student.documentsCount) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Writing Sessions:</span>
                    <span className="font-medium">{writingSessions.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest documents and writing sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <p className="text-sm text-gray-500">
                            {doc.word_count} words • {formatDate(doc.created_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(doc.id)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No documents created yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Documents</CardTitle>
                <CardDescription>Complete list of student's essays and assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <h3 className="font-medium">{doc.title}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">{doc.word_count} words</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">Created {formatDate(doc.created_at)}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">Updated {formatDate(doc.updated_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {doc.grammar_score && (
                          <Badge className={
                            doc.grammar_score >= 90 ? 'bg-green-100 text-green-800' :
                            doc.grammar_score >= 80 ? 'bg-blue-100 text-blue-800' :
                            doc.grammar_score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {doc.grammar_score}% grammar
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(doc.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Yet</h3>
                      <p className="text-gray-500">This student hasn't created any documents yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Writing Sessions</CardTitle>
                <CardDescription>Detailed keystroke recordings and writing analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {writingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <div>
                          <h3 className="font-medium">{session.document_title}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">{session.duration_minutes} minutes</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{session.words_written} words</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{session.keystrokes_count} keystrokes</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{formatDateTime(session.start_time)}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewWritingSession(session.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Playback
                      </Button>
                    </div>
                  ))}
                  {writingSessions.length === 0 && (
                    <div className="text-center py-12">
                      <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Writing Sessions</h3>
                      <p className="text-gray-500">No keystroke recordings available for this student.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>Detailed analytics and improvement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Writing Quality Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Grammar Score:</span>
                        <span className="font-medium">{student.grammarScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Improvement Rate:</span>
                        <span className={`font-medium ${
                          student.improvementRate > 0 ? 'text-green-600' : 
                          student.improvementRate < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {student.improvementRate > 0 ? '+' : ''}{student.improvementRate}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Writing Consistency:</span>
                        <span className="font-medium">{student.writingStreak} day streak</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Productivity Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Words:</span>
                        <span className="font-medium">{student.totalWords.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Documents Created:</span>
                        <span className="font-medium">{student.documentsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Words/Document:</span>
                        <span className="font-medium">
                          {student.documentsCount > 0 ? Math.round(student.totalWords / student.documentsCount) : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Analytics Note</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Detailed progress charts and writing analytics will be available in the full implementation. 
                        This includes grammar improvement over time, writing speed analytics, and vocabulary growth tracking.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 