"use client"

import { useState, useEffect } from "react"
import {
  Target,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  PenTool,
  Flame,
  Star,
  Zap,
  Heart,
  Save,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WritingGoalsTrackerProps {
  userId: string
  onGoalComplete?: (goal: WritingGoal) => void
}

interface WritingGoal {
  id: string
  title: string
  description: string
  type: 'word_count' | 'essay_count' | 'time_based' | 'streak' | 'skill_based'
  target: number
  current: number
  unit: string
  deadline?: Date
  priority: 'low' | 'medium' | 'high'
  category: 'daily' | 'weekly' | 'monthly' | 'long_term'
  reward?: string
  createdAt: Date
  completedAt?: Date
  isActive: boolean
}

const GOAL_TEMPLATES = [
  {
    title: 'Daily Word Count',
    description: 'Write a specific number of words each day',
    type: 'word_count' as const,
    target: 300,
    unit: 'words',
    category: 'daily' as const,
    icon: PenTool,
    color: 'blue'
  },
  {
    title: 'Weekly Essays',
    description: 'Complete essays each week',
    type: 'essay_count' as const,
    target: 2,
    unit: 'essays',
    category: 'weekly' as const,
    icon: BookOpen,
    color: 'green'
  },
  {
    title: 'Writing Streak',
    description: 'Write consistently for consecutive days',
    type: 'streak' as const,
    target: 7,
    unit: 'days',
    category: 'long_term' as const,
    icon: Flame,
    color: 'orange'
  },
  {
    title: 'Study Time',
    description: 'Spend time writing and editing',
    type: 'time_based' as const,
    target: 60,
    unit: 'minutes',
    category: 'daily' as const,
    icon: Clock,
    color: 'purple'
  },
  {
    title: 'Skill Improvement',
    description: 'Improve specific writing skills',
    type: 'skill_based' as const,
    target: 85,
    unit: '% score',
    category: 'monthly' as const,
    icon: TrendingUp,
    color: 'indigo'
  }
]

// Sample goals data
const SAMPLE_GOALS: WritingGoal[] = [
  {
    id: '1',
    title: 'Daily Writing Practice',
    description: 'Write 300 words every day to build consistency',
    type: 'word_count',
    target: 300,
    current: 247,
    unit: 'words',
    priority: 'high',
    category: 'daily',
    reward: 'Daily Writer Badge',
    createdAt: new Date('2024-02-01'),
    isActive: true
  },
  {
    id: '2',
    title: 'Weekly Essay Challenge',
    description: 'Complete 2 full essays each week',
    type: 'essay_count',
    target: 2,
    current: 1,
    unit: 'essays',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    category: 'weekly',
    reward: 'Essay Master Certificate',
    createdAt: new Date('2024-02-01'),
    isActive: true
  },
  {
    id: '3',
    title: 'Two-Week Streak',
    description: 'Write something every day for 14 days',
    type: 'streak',
    target: 14,
    current: 7,
    unit: 'days',
    priority: 'high',
    category: 'long_term',
    reward: 'Consistency Champion',
    createdAt: new Date('2024-01-25'),
    isActive: true
  },
  {
    id: '4',
    title: 'Grammar Improvement',
    description: 'Achieve 90% accuracy in grammar checks',
    type: 'skill_based',
    target: 90,
    current: 85,
    unit: '% accuracy',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    category: 'monthly',
    reward: 'Grammar Guru Badge',
    createdAt: new Date('2024-01-20'),
    completedAt: undefined,
    isActive: true
  }
]

export function WritingGoalsTracker({ userId, onGoalComplete }: WritingGoalsTrackerProps) {
  const [goals, setGoals] = useState<WritingGoal[]>(SAMPLE_GOALS)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<WritingGoal | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<typeof GOAL_TEMPLATES[0] | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active')

  // New goal form state
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'word_count' as WritingGoal['type'],
    target: 100,
    unit: 'words',
    deadline: '',
    priority: 'medium' as WritingGoal['priority'],
    category: 'daily' as WritingGoal['category'],
    reward: ''
  })

  const filteredGoals = goals.filter(goal => {
    switch (filter) {
      case 'active': return goal.isActive && !goal.completedAt
      case 'completed': return goal.completedAt
      default: return true
    }
  })

  const activeGoals = goals.filter(g => g.isActive && !g.completedAt)
  const completedGoals = goals.filter(g => g.completedAt)
  const totalProgress = activeGoals.reduce((sum, goal) => sum + (goal.current / goal.target), 0) / activeGoals.length * 100

  const handleCreateGoal = () => {
    const goal: WritingGoal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      type: newGoal.type,
      target: newGoal.target,
      current: 0,
      unit: newGoal.unit,
      deadline: newGoal.deadline ? new Date(newGoal.deadline) : undefined,
      priority: newGoal.priority,
      category: newGoal.category,
      reward: newGoal.reward || undefined,
      createdAt: new Date(),
      isActive: true
    }

    setGoals(prev => [...prev, goal])
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const handleUpdateProgress = (goalId: string, newProgress: number) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const updated = { ...goal, current: newProgress }
        if (newProgress >= goal.target && !goal.completedAt) {
          updated.completedAt = new Date()
          onGoalComplete?.(updated)
        }
        return updated
      }
      return goal
    }))
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId))
  }

  const handleTemplateSelect = (template: typeof GOAL_TEMPLATES[0]) => {
    setSelectedTemplate(template)
    setNewGoal({
      title: template.title,
      description: template.description,
      type: template.type,
      target: template.target,
      unit: template.unit,
      deadline: '',
      priority: 'medium',
      category: template.category,
      reward: ''
    })
  }

  const resetForm = () => {
    setNewGoal({
      title: '',
      description: '',
      type: 'word_count',
      target: 100,
      unit: 'words',
      deadline: '',
      priority: 'medium',
      category: 'daily',
      reward: ''
    })
    setSelectedTemplate(null)
  }

  const getPriorityColor = (priority: WritingGoal['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryColor = (category: WritingGoal['category']) => {
    switch (category) {
      case 'daily': return 'bg-blue-100 text-blue-800'
      case 'weekly': return 'bg-green-100 text-green-800'
      case 'monthly': return 'bg-purple-100 text-purple-800'
      case 'long_term': return 'bg-indigo-100 text-indigo-800'
    }
  }

  const getGoalIcon = (type: WritingGoal['type']) => {
    switch (type) {
      case 'word_count': return PenTool
      case 'essay_count': return BookOpen
      case 'time_based': return Clock
      case 'streak': return Flame
      case 'skill_based': return TrendingUp
      default: return Target
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-6 w-6 text-green-600" />
              <span>Writing Goals</span>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set goals, track progress, and celebrate achievements!
          </p>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {activeGoals.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Active Goals
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {completedGoals.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Completed Goals
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {Math.round(totalProgress)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average Progress
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active ({activeGoals.length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed ({completedGoals.length})
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({goals.length})
        </Button>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGoals.map(goal => {
          const progress = (goal.current / goal.target) * 100
          const isCompleted = !!goal.completedAt
          const isOverdue = goal.deadline && new Date() > goal.deadline && !isCompleted
          const GoalIcon = getGoalIcon(goal.type)

          return (
            <Card 
              key={goal.id} 
              className={`${
                isCompleted 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20' 
                  : isOverdue 
                    ? 'bg-red-50 border-red-200 dark:bg-red-950/20' 
                    : ''
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GoalIcon className={`h-5 w-5 ${
                      isCompleted ? 'text-green-600' : 
                      isOverdue ? 'text-red-600' : 'text-blue-600'
                    }`} />
                    <span className="text-sm">{goal.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isCompleted && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete!
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardTitle>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {goal.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{goal.current} / {goal.target} {goal.unit}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Progress Input */}
                {!isCompleted && (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder={`Add ${goal.unit}`}
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement
                          const value = parseInt(input.value)
                          if (value > 0) {
                            handleUpdateProgress(goal.id, Math.min(goal.current + value, goal.target))
                            input.value = ''
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement
                        const value = parseInt(input.value)
                        if (value > 0) {
                          handleUpdateProgress(goal.id, Math.min(goal.current + value, goal.target))
                          input.value = ''
                        }
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Goal Details */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getPriorityColor(goal.priority)}>
                    {goal.priority}
                  </Badge>
                  <Badge className={getCategoryColor(goal.category)}>
                    {goal.category}
                  </Badge>
                </div>

                {/* Reward */}
                {goal.reward && (
                  <div className="flex items-center space-x-2 text-sm text-amber-600">
                    <Award className="h-4 w-4" />
                    <span>Reward: {goal.reward}</span>
                  </div>
                )}

                {/* Deadline */}
                {goal.deadline && (
                  <div className={`flex items-center space-x-2 text-sm ${
                    isOverdue ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    <Calendar className="h-4 w-4" />
                    <span>
                      Due: {goal.deadline.toLocaleDateString()}
                      {isOverdue && ' (Overdue)'}
                    </span>
                  </div>
                )}

                {/* Completion Date */}
                {goal.completedAt && (
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Completed: {goal.completedAt.toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredGoals.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No goals found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {filter === 'active' 
                ? "You don't have any active goals. Create your first goal to get started!" 
                : filter === 'completed'
                  ? "No completed goals yet. Keep working on your active goals!"
                  : "No goals created yet. Start setting some writing goals!"}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Goal Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Writing Goal</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Goal Templates */}
            {!selectedTemplate && (
              <div>
                <h3 className="font-medium mb-3">Choose a template or create custom:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {GOAL_TEMPLATES.map((template, index) => {
                    const IconComponent = template.icon
                    return (
                      <Card 
                        key={index}
                        className="cursor-pointer hover:border-blue-300 transition-colors"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 bg-${template.color}-100 dark:bg-${template.color}-900/30 rounded`}>
                              <IconComponent className={`h-4 w-4 text-${template.color}-600`} />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{template.title}</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {template.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={() => setSelectedTemplate({} as any)}
                >
                  Create Custom Goal
                </Button>
              </div>
            )}

            {/* Goal Form */}
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Goal Details</h3>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Title</label>
                    <Input
                      value={newGoal.title}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Goal title"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Target</label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        value={newGoal.target}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                        className="flex-1"
                      />
                      <Input
                        value={newGoal.unit}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                        placeholder="words, essays, etc."
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your goal..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Priority</label>
                    <select
                      value={newGoal.priority}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value as WritingGoal['priority'] }))}
                      className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <select
                      value={newGoal.category}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value as WritingGoal['category'] }))}
                      className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="long_term">Long Term</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Deadline (Optional)</label>
                    <Input
                      type="date"
                      value={newGoal.deadline}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Reward (Optional)</label>
                  <Input
                    value={newGoal.reward}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, reward: e.target.value }))}
                    placeholder="What will you earn when you complete this goal?"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button onClick={handleCreateGoal} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Create Goal
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 