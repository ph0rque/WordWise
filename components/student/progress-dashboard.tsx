"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  Target,
  Award,
  Calendar,
  Clock,
  BookOpen,
  PenTool,
  Star,
  Flame,
  Trophy,
  CheckCircle2,
  BarChart3,
  LineChart,
  Users,
  Zap,
  FileText,
  Heart,
  Brain,
  Lightbulb,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProgressDashboardProps {
  userId: string
  onSetGoal?: (goal: WritingGoal) => void
  onCelebrate?: (achievement: Achievement) => void
}

interface WritingGoal {
  id: string
  type: 'daily_words' | 'weekly_essays' | 'monthly_skills' | 'streak_days'
  target: number
  current: number
  deadline?: Date
  title: string
  description: string
  reward?: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earnedAt?: Date
  category: 'writing' | 'improvement' | 'consistency' | 'creativity'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface WritingStats {
  totalWords: number
  totalEssays: number
  totalTime: number // in minutes
  averageWordsPerSession: number
  currentStreak: number
  longestStreak: number
  wordsThisWeek: number
  essaysThisMonth: number
  improvementScore: number
}

// Sample data - in real app, this would come from the backend
const SAMPLE_STATS: WritingStats = {
  totalWords: 15847,
  totalEssays: 23,
  totalTime: 1247, // ~20 hours
  averageWordsPerSession: 387,
  currentStreak: 7,
  longestStreak: 12,
  wordsThisWeek: 2341,
  essaysThisMonth: 4,
  improvementScore: 85
}

const SAMPLE_GOALS: WritingGoal[] = [
  {
    id: '1',
    type: 'daily_words',
    target: 300,
    current: 247,
    title: 'Daily Writing Goal',
    description: 'Write 300 words every day',
    reward: 'Writing Streak Badge'
  },
  {
    id: '2',
    type: 'weekly_essays',
    target: 2,
    current: 1,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    title: 'Weekly Essays',
    description: 'Complete 2 essays this week',
    reward: 'Essay Master Badge'
  },
  {
    id: '3',
    type: 'streak_days',
    target: 14,
    current: 7,
    title: 'Two-Week Streak',
    description: 'Write for 14 days in a row',
    reward: 'Consistency Champion'
  }
]

const ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    title: 'First Steps',
    description: 'Completed your first essay',
    icon: '🎯',
    earnedAt: new Date('2024-01-15'),
    category: 'writing',
    rarity: 'common'
  },
  {
    id: '2',
    title: 'Word Warrior',
    description: 'Wrote 10,000 words total',
    icon: '⚔️',
    earnedAt: new Date('2024-01-28'),
    category: 'writing',
    rarity: 'rare'
  },
  {
    id: '3',
    title: 'Streak Master',
    description: 'Maintained a 7-day writing streak',
    icon: '🔥',
    earnedAt: new Date('2024-02-05'),
    category: 'consistency',
    rarity: 'epic'
  },
  {
    id: '4',
    title: 'Grammar Guru',
    description: 'Improved grammar score by 20 points',
    icon: '📚',
    category: 'improvement',
    rarity: 'rare'
  },
  {
    id: '5',
    title: 'Creative Genius',
    description: 'Used 5 different essay templates',
    icon: '💡',
    category: 'creativity',
    rarity: 'epic'
  }
]

// Weekly writing data for chart
const WEEKLY_DATA = [
  { day: 'Mon', words: 320, time: 45 },
  { day: 'Tue', words: 289, time: 38 },
  { day: 'Wed', words: 412, time: 52 },
  { day: 'Thu', words: 356, time: 47 },
  { day: 'Fri', words: 445, time: 58 },
  { day: 'Sat', words: 298, time: 35 },
  { day: 'Sun', words: 221, time: 28 }
]

export function ProgressDashboard({ userId, onSetGoal, onCelebrate }: ProgressDashboardProps) {
  const [stats] = useState<WritingStats>(SAMPLE_STATS)
  const [goals] = useState<WritingGoal[]>(SAMPLE_GOALS)
  const [achievements] = useState<Achievement[]>(ACHIEVEMENTS)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('week')
  
  // Mobile responsiveness hook
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getAchievementColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'writing': return PenTool
      case 'improvement': return TrendingUp
      case 'consistency': return Flame
      case 'creativity': return Lightbulb
      default: return Star
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <span>Your Writing Progress</span>
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track your writing journey and celebrate your achievements!
          </p>
        </CardHeader>
      </Card>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Words */}
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalWords.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Total Words
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.currentStreak}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Day Streak 🔥
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Essays Completed */}
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalEssays}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Essays Done
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Writing Time */}
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {formatTime(stats.totalTime)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Time Writing
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="streaks">Streaks</TabsTrigger>
        </TabsList>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map(goal => {
              const progress = (goal.current / goal.target) * 100
              const isCompleted = progress >= 100
              
              return (
                <Card key={goal.id} className={`${isCompleted ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : ''}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className={`h-5 w-5 ${isCompleted ? 'text-green-600' : 'text-blue-600'}`} />
                        <span>{goal.title}</span>
                      </div>
                      {isCompleted && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Complete!
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {goal.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>{goal.current} / {goal.target}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    {goal.reward && (
                      <div className="flex items-center space-x-2 text-sm text-amber-600">
                        <Trophy className="h-4 w-4" />
                        <span>Reward: {goal.reward}</span>
                      </div>
                    )}
                    
                    {goal.deadline && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {goal.deadline.toLocaleDateString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(achievement => {
              const CategoryIcon = getCategoryIcon(achievement.category)
              const isEarned = !!achievement.earnedAt
              
              return (
                <Card 
                  key={achievement.id} 
                  className={`${isEarned ? '' : 'opacity-60 border-dashed'} transition-all hover:scale-105`}
                >
                  <CardContent className="p-4 text-center space-y-3">
                    <div className="text-4xl">{achievement.icon || '🏆'}</div>
                    
                    <div>
                      <h3 className="font-semibold text-sm">{achievement.title}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {achievement.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-2">
                      <Badge className={getAchievementColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                      <CategoryIcon className="h-3 w-3 text-gray-400" />
                    </div>
                    
                    {isEarned && achievement.earnedAt && (
                      <div className="text-xs text-green-600">
                        Earned {achievement.earnedAt.toLocaleDateString()}
                      </div>
                    )}
                    
                    {!isEarned && (
                      <div className="text-xs text-gray-400">
                        Not yet earned
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>This Week's Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {WEEKLY_DATA.map(day => (
                    <div key={day.day} className="flex items-center space-x-3">
                      <div className="w-8 text-xs font-medium text-gray-600">
                        {day.day}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>{day.words} words</span>
                          <span>{day.time}m</span>
                        </div>
                        <Progress value={(day.words / 500) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Improvement Score</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {stats.improvementScore}%
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <PenTool className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Avg Words/Session</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {stats.averageWordsPerSession}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Essays This Month</span>
                  </div>
                  <div className="text-lg font-bold text-purple-600">
                    {stats.essaysThisMonth}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Longest Streak</span>
                  </div>
                  <div className="text-lg font-bold text-orange-600">
                    {stats.longestStreak} days
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Streaks Tab */}
        <TabsContent value="streaks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Streak */}
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Flame className="h-6 w-6 text-orange-600" />
                  <span>Current Streak</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="text-6xl font-bold text-orange-600">
                  {stats.currentStreak}
                </div>
                <div className="text-lg text-orange-700 dark:text-orange-300">
                  Days in a Row! 🔥
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Keep it going! Just {14 - stats.currentStreak} more days to reach your goal.
                </div>
                <Progress value={(stats.currentStreak / 14) * 100} className="h-3" />
              </CardContent>
            </Card>

            {/* Streak Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>This Month</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Days of week headers */}
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="p-2 text-xs font-medium text-gray-400">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days - simplified representation */}
                  {Array.from({ length: 35 }, (_, i) => {
                    const dayNum = i - 6 // Adjust for month start
                    const hasActivity = dayNum > 0 && dayNum <= 28 && Math.random() > 0.3
                    const isToday = dayNum === 15
                    
                    return (
                      <div
                        key={i}
                        className={`p-2 text-xs rounded ${
                          dayNum <= 0 || dayNum > 28
                            ? 'text-gray-300'
                            : hasActivity
                              ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                              : isToday
                                ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                                : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        {dayNum > 0 && dayNum <= 28 ? dayNum : ''}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-200 dark:bg-green-800 rounded"></div>
                    <span>Writing Day</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded"></div>
                    <span>No Activity</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 