"use client"

import { useState, useEffect } from "react"
import {
  Award,
  Star,
  Trophy,
  Crown,
  Medal,
  Target,
  Flame,
  Zap,
  Heart,
  BookOpen,
  PenTool,
  TrendingUp,
  Calendar,
  Users,
  Sparkles,
  Gift,
  Lock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AchievementSystemProps {
  userId: string
  currentStats?: {
    totalWords: number
    totalEssays: number
    currentStreak: number
    improvementScore: number
  }
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'writing' | 'improvement' | 'consistency' | 'creativity' | 'social'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  requirements: {
    type: string
    value: number
    description: string
  }
  points: number
  earnedAt?: Date
  progress?: number
}

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  earnedAt?: Date
  level: number
  maxLevel: number
}

// Achievement definitions
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_essay',
    title: 'First Steps',
    description: 'Complete your very first essay',
    icon: '🎯',
    category: 'writing',
    rarity: 'common',
    requirements: {
      type: 'essays_completed',
      value: 1,
      description: 'Complete 1 essay'
    },
    points: 50,
    earnedAt: new Date('2024-01-15')
  },
  {
    id: 'hundred_words',
    title: 'Century Writer',
    description: 'Write 100 words in a single session',
    icon: '📝',
    category: 'writing',
    rarity: 'common',
    requirements: {
      type: 'words_per_session',
      value: 100,
      description: 'Write 100 words in one session'
    },
    points: 25,
    earnedAt: new Date('2024-01-10')
  },
  {
    id: 'thousand_words',
    title: 'Word Warrior',
    description: 'Write 1,000 words total',
    icon: '⚔️',
    category: 'writing',
    rarity: 'rare',
    requirements: {
      type: 'total_words',
      value: 1000,
      description: 'Write 1,000 words total'
    },
    points: 100,
    earnedAt: new Date('2024-01-20')
  },
  {
    id: 'ten_thousand_words',
    title: 'Novelist',
    description: 'Write 10,000 words total',
    icon: '📚',
    category: 'writing',
    rarity: 'epic',
    requirements: {
      type: 'total_words',
      value: 10000,
      description: 'Write 10,000 words total'
    },
    points: 500,
    earnedAt: new Date('2024-02-01')
  },
  {
    id: 'week_streak',
    title: 'Consistent Writer',
    description: 'Write for 7 days in a row',
    icon: '🔥',
    category: 'consistency',
    rarity: 'rare',
    requirements: {
      type: 'writing_streak',
      value: 7,
      description: 'Maintain 7-day writing streak'
    },
    points: 200,
    earnedAt: new Date('2024-01-28')
  },
  {
    id: 'month_streak',
    title: 'Dedication Master',
    description: 'Write for 30 days in a row',
    icon: '👑',
    category: 'consistency',
    rarity: 'legendary',
    requirements: {
      type: 'writing_streak',
      value: 30,
      description: 'Maintain 30-day writing streak'
    },
    points: 1000,
    progress: 23 // Currently at 23/30
  },
  {
    id: 'grammar_improvement',
    title: 'Grammar Guru',
    description: 'Improve grammar score by 20 points',
    icon: '📖',
    category: 'improvement',
    rarity: 'epic',
    requirements: {
      type: 'grammar_improvement',
      value: 20,
      description: 'Improve grammar score by 20 points'
    },
    points: 300,
    earnedAt: new Date('2024-02-03')
  },
  {
    id: 'five_templates',
    title: 'Template Explorer',
    description: 'Use 5 different essay templates',
    icon: '🎨',
    category: 'creativity',
    rarity: 'rare',
    requirements: {
      type: 'templates_used',
      value: 5,
      description: 'Use 5 different essay templates'
    },
    points: 150,
    progress: 3 // Currently used 3/5 templates
  },
  {
    id: 'perfect_score',
    title: 'Perfectionist',
    description: 'Achieve 100% grammar accuracy',
    icon: '💎',
    category: 'improvement',
    rarity: 'legendary',
    requirements: {
      type: 'grammar_accuracy',
      value: 100,
      description: 'Achieve 100% grammar accuracy'
    },
    points: 750
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Write before 8 AM',
    icon: '🌅',
    category: 'consistency',
    rarity: 'common',
    requirements: {
      type: 'early_writing',
      value: 1,
      description: 'Write before 8 AM'
    },
    points: 75
  }
]

// Badge system
const BADGES: Badge[] = [
  {
    id: 'writer',
    name: 'Writer',
    description: 'For completing essays',
    icon: '✍️',
    color: 'blue',
    earnedAt: new Date('2024-01-15'),
    level: 3,
    maxLevel: 5
  },
  {
    id: 'streak_keeper',
    name: 'Streak Keeper',
    description: 'For maintaining writing streaks',
    icon: '🔥',
    color: 'orange',
    earnedAt: new Date('2024-01-28'),
    level: 2,
    maxLevel: 5
  },
  {
    id: 'improvement',
    name: 'Self-Improver',
    description: 'For showing writing improvement',
    icon: '📈',
    color: 'green',
    earnedAt: new Date('2024-02-03'),
    level: 1,
    maxLevel: 3
  },
  {
    id: 'creative',
    name: 'Creative Mind',
    description: 'For creative writing approaches',
    icon: '🎨',
    color: 'purple',
    level: 0,
    maxLevel: 4
  }
]

export function AchievementSystem({ userId, currentStats }: AchievementSystemProps) {
  const [achievements] = useState<Achievement[]>(ACHIEVEMENTS)
  const [badges] = useState<Badge[]>(BADGES)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showCelebration, setShowCelebration] = useState(false)

  const earnedAchievements = achievements.filter(a => a.earnedAt)
  const inProgressAchievements = achievements.filter(a => !a.earnedAt && a.progress !== undefined)
  const lockedAchievements = achievements.filter(a => !a.earnedAt && a.progress === undefined)

  const totalPoints = earnedAchievements.reduce((sum, achievement) => sum + achievement.points, 0)
  const earnedBadges = badges.filter(b => b.earnedAt)

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory)

  const getRarityColor = (rarity: Achievement['rarity']) => {
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
      case 'creativity': return Sparkles
      case 'social': return Users
      default: return Star
    }
  }

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500'
      case 'green': return 'bg-green-500'
      case 'orange': return 'bg-orange-500'
      case 'purple': return 'bg-purple-500'
      case 'red': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-purple-600" />
            <span>Achievements & Rewards</span>
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Celebrate your writing milestones and earn rewards!
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {totalPoints.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Points
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {earnedAchievements.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Achievements
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {earnedBadges.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Badges Earned
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {inProgressAchievements.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                In Progress
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="achievements" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            {['writing', 'improvement', 'consistency', 'creativity'].map(category => {
              const IconComponent = getCategoryIcon(category as Achievement['category'])
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  <IconComponent className="h-3 w-3 mr-1" />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              )
            })}
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map(achievement => {
              const isEarned = !!achievement.earnedAt
              const isInProgress = !isEarned && achievement.progress !== undefined
              const isLocked = !isEarned && achievement.progress === undefined
              const CategoryIcon = getCategoryIcon(achievement.category)

              return (
                <Card 
                  key={achievement.id}
                  className={`transition-all hover:scale-105 ${
                    isEarned 
                      ? 'border-green-300 bg-green-50 dark:bg-green-950/20' 
                      : isInProgress
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/20'
                        : 'opacity-60 border-dashed'
                  }`}
                >
                  <CardContent className="p-4 text-center space-y-3">
                    <div className="relative">
                      <div className="text-4xl mb-2">
                        {isLocked ? '🔒' : achievement.icon}
                      </div>
                      {isEarned && (
                        <div className="absolute -top-1 -right-1">
                          <div className="bg-green-500 text-white rounded-full p-1">
                            <Award className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-sm">{achievement.title}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {achievement.description}
                      </p>
                    </div>

                    {/* Progress for in-progress achievements */}
                    {isInProgress && achievement.progress && (
                      <div className="space-y-2">
                        <Progress 
                          value={(achievement.progress / achievement.requirements.value) * 100} 
                          className="h-2"
                        />
                        <div className="text-xs text-blue-600">
                          {achievement.progress} / {achievement.requirements.value}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Badge className={getRarityColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <CategoryIcon className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {achievement.points} pts
                        </span>
                      </div>
                    </div>
                    
                    {isEarned && achievement.earnedAt && (
                      <div className="text-xs text-green-600">
                        Earned {achievement.earnedAt.toLocaleDateString()}
                      </div>
                    )}
                    
                    {isLocked && (
                      <div className="text-xs text-gray-400">
                        {achievement.requirements.description}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {badges.map(badge => {
              const isEarned = !!badge.earnedAt
              
              return (
                <Card 
                  key={badge.id}
                  className={`text-center ${
                    isEarned 
                      ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/20' 
                      : 'opacity-60 border-dashed'
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="relative inline-block">
                      <div className={`w-16 h-16 rounded-full ${getBadgeColor(badge.color)} flex items-center justify-center text-2xl text-white mx-auto`}>
                        {badge.icon}
                      </div>
                      {isEarned && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {badge.level}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-sm">{badge.name}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {badge.description}
                      </p>
                    </div>
                    
                    {isEarned ? (
                      <div className="space-y-2">
                        <div className="text-xs text-blue-600">
                          Level {badge.level} of {badge.maxLevel}
                        </div>
                        <Progress 
                          value={(badge.level / badge.maxLevel) * 100} 
                          className="h-2"
                        />
                        <div className="text-xs text-green-600">
                          Earned {badge.earnedAt?.toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
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

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span>Recent Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {earnedAchievements
                  .sort((a, b) => (b.earnedAt?.getTime() || 0) - (a.earnedAt?.getTime() || 0))
                  .slice(0, 5)
                  .map(achievement => (
                    <div key={achievement.id} className="flex items-center space-x-3 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="text-lg">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{achievement.title}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {achievement.earnedAt?.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        +{achievement.points}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Next Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span>Almost There!</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {inProgressAchievements.map(achievement => (
                  <div key={achievement.id} className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-lg">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{achievement.title}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {achievement.requirements.description}
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={(achievement.progress! / achievement.requirements.value) * 100} 
                      className="h-2"
                    />
                    <div className="text-xs text-blue-600 mt-1">
                      {achievement.progress} / {achievement.requirements.value}
                    </div>
                  </div>
                ))}
                
                {inProgressAchievements.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    <Lock className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Complete more writing to unlock achievements!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 