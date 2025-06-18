"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Loader2, 
  Users, 
  GraduationCap, 
  BarChart3, 
  Settings,
  LogOut,
  AlertCircle,
  Plus,
  Search,
  Keyboard
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { getCurrentUserRole, requireAdmin } from "@/lib/auth/roles"
import { StudentAnalytics } from "@/components/admin/student-analytics"
import { KeystrokeViewer } from "@/components/admin/keystroke-viewer"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { UserWithRole } from "@/lib/types"
import { ROLE_PERMISSIONS } from "@/lib/types"

interface AdminStats {
  totalStudents: number
  totalDocuments: number
  averageGrammarScore: number
  activeThisWeek: number
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [adminUser, setAdminUser] = useState<any>(null)
  const [students, setStudents] = useState<UserWithRole[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    totalDocuments: 0,
    averageGrammarScore: 0,
    activeThisWeek: 0
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<UserWithRole | null>(null)
  const [refreshFlag, setRefreshFlag] = useState(0)
  const router = useRouter()

  useEffect(() => {
    initializeAdminDashboard()
  }, [refreshFlag])

  const initializeAdminDashboard = async () => {
    try {
      setLoading(true)
      setError("")

      // Get current admin user info
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/?redirectTo=/admin')
        return
      }

      // Check if user is admin
      const userRole = await getCurrentUserRole()
      if (userRole !== 'admin') {
        setError('Access denied. Admin privileges required.')
        setTimeout(() => router.push('/'), 3000)
        return
      }

      setAdminUser({
        id: session.user.id,
        email: session.user.email,
        role: 'admin'
      })

      // Load students and stats
      await Promise.all([
        loadStudents(),
        loadAdminStats()
      ])

    } catch (err) {
      console.error('Error initializing admin dashboard:', err)
      setError('Failed to load admin dashboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    try {
      // TODO: Replace with proper API call to fetch students
      // For now, using mock data since we can't query auth.users directly from client
      const mockStudents: UserWithRole[] = [
        {
          id: 'mock-student-1',
          email: 'student1@example.com',
          role: 'student',
          permissions: ROLE_PERMISSIONS.student,
          created_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
        },
        {
          id: 'mock-student-2', 
          email: 'student2@example.com',
          role: 'student',
          permissions: ROLE_PERMISSIONS.student,
          created_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        }
      ]

      setStudents(mockStudents)
    } catch (err) {
      console.error('Error loading students:', err)
      throw new Error('Failed to load students')
    }
  }

  const loadAdminStats = async () => {
    try {
      const supabase = getSupabaseClient()

      // Get document counts and basic stats
      const { data: documentsData, error: docsError } = await supabase
        .from('documents')
        .select('id, user_id, created_at')

      if (docsError) {
        console.error('Error loading documents:', docsError)
        // Don't throw, just use default stats
      }

      // Calculate stats
      const totalDocuments = documentsData?.length || 0
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const activeThisWeek = students.filter(student => 
        student.last_sign_in_at && 
        new Date(student.last_sign_in_at) > oneWeekAgo
      ).length

      setStats({
        totalStudents: students.length,
        totalDocuments,
        averageGrammarScore: 85, // Placeholder - will be calculated from real data later
        activeThisWeek
      })
    } catch (err) {
      console.error('Error loading admin stats:', err)
      // Use default stats if there's an error
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleStudentSelect = (student: UserWithRole) => {
    setSelectedStudent(student)
    // Navigate to individual student page
    router.push(`/admin/students/${student.id}`)
  }

  const filteredStudents = students.filter(student =>
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const getStudentStatus = (student: UserWithRole) => {
    if (!student.email_confirmed_at) return 'pending'
    if (!student.last_sign_in_at) return 'inactive'
    
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    return new Date(student.last_sign_in_at) > oneWeekAgo ? 'active' : 'inactive'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
            <p className="text-gray-600">Loading admin dashboard...</p>
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
              <div className="p-2 bg-emerald-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">WordWise Admin</h1>
                <p className="text-gray-600">Student Management Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{adminUser?.email}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Active learners on the platform
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                Essays and assignments created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active This Week</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeThisWeek}</div>
              <p className="text-xs text-muted-foreground">
                Students active in past 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Grammar Score</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageGrammarScore}%</div>
              <p className="text-xs text-muted-foreground">
                Platform-wide writing quality
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students">Student Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics Overview</TabsTrigger>
            <TabsTrigger value="keystrokes">Keystroke Recordings</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            {/* Student Search and Filters */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Student Management</CardTitle>
                    <CardDescription>
                      View and manage all student accounts
                    </CardDescription>
                  </div>
                  <Button size="sm" className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Student</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search students by email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    {filteredStudents.length} of {students.length} students
                  </div>
                </div>

                {/* Students Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Active
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <GraduationCap className="h-4 w-4 text-emerald-600" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.email}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {student.id.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(getStudentStatus(student))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(student.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(student.last_sign_in_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStudentSelect(student)}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {filteredStudents.length === 0 && (
                    <div className="text-center py-8">
                      <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm ? 'No students found matching your search.' : 'No students registered yet.'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <StudentAnalytics 
              students={students}
              stats={stats}
              onStudentSelect={handleStudentSelect}
            />
          </TabsContent>

          <TabsContent value="keystrokes" className="space-y-6">
            <KeystrokeViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 