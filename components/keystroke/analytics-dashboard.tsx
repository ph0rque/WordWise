'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Activity, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  PieChart,
  Timer,
  Edit3,
  Focus,
  Zap
} from 'lucide-react';
import { SessionAnalytics } from '@/lib/keystroke/analytics';

interface AnalyticsDashboardProps {
  userId: string;
  documentId?: string;
  sessionIds?: string[];
  className?: string;
}

interface SessionSummary {
  totalSessions: number;
  totalTimeOnTask: number;
  averageWPM: number;
  averageFocusScore: number;
  averageProductivityScore: number;
  averageEngagementScore: number;
  sessionTypeDistribution: Record<string, number>;
  improvementTrend: 'improving' | 'stable' | 'declining';
}

export default function AnalyticsDashboard({ 
  userId, 
  documentId, 
  sessionIds,
  className = '' 
}: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<SessionAnalytics[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionAnalytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [userId, documentId, sessionIds]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ userId });
      if (documentId) params.append('documentId', documentId);
      if (sessionIds?.length) params.append('sessionIds', sessionIds.join(','));

      const response = await fetch(`/api/keystroke/analytics?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load analytics');
      }

      setAnalytics(data.analytics || []);
      setSummary(data.summary);
      if (data.analytics?.length > 0) {
        setSelectedSession(data.analytics[0]);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSessionTypeColor = (type: string): string => {
    switch (type) {
      case 'focused':
        return 'bg-green-100 text-green-800';
      case 'editing':
        return 'bg-blue-100 text-blue-800';
      case 'exploratory':
        return 'bg-yellow-100 text-yellow-800';
      case 'distracted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Error loading analytics</p>
              <p className="text-sm mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadAnalytics}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Available</h3>
            <p className="text-gray-600">
              Start writing to generate analytics data about your writing sessions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Total Time on Task
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(summary.totalTimeOnTask)}</div>
              <p className="text-xs text-gray-600 mt-1">
                Across {summary.totalSessions} sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Average WPM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.averageWPM}</div>
              <p className="text-xs text-gray-600 mt-1">Words per minute</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Focus className="h-4 w-4" />
                Focus Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(summary.averageFocusScore)}`}>
                {summary.averageFocusScore}
              </div>
              <p className="text-xs text-gray-600 mt-1">Average focus level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getTrendIcon(summary.improvementTrend)}
                <span className="text-2xl font-bold capitalize">
                  {summary.improvementTrend}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Progress trend</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Writing Sessions
                </CardTitle>
                <CardDescription>
                  Click on a session to view detailed analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.map((session, index) => (
                  <div
                    key={session.sessionId}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSession?.sessionId === session.sessionId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Session {index + 1}</span>
                      <Badge className={getSessionTypeColor(session.sessionType)}>
                        {session.sessionType}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">{formatTime(session.timeOnTask)}</span>
                        <br />
                        Time on task
                      </div>
                      <div>
                        <span className="font-medium">{session.wordsPerMinute} WPM</span>
                        <br />
                        Writing speed
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Session Details */}
            {selectedSession && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Details</CardTitle>
                  <CardDescription>
                    Detailed metrics for the selected session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quality Scores */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <Badge variant={getScoreBadgeVariant(selectedSession.focusScore)}>
                        {selectedSession.focusScore}
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">Focus</p>
                    </div>
                    <div className="text-center">
                      <Badge variant={getScoreBadgeVariant(selectedSession.productivityScore)}>
                        {selectedSession.productivityScore}
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">Productivity</p>
                    </div>
                    <div className="text-center">
                      <Badge variant={getScoreBadgeVariant(selectedSession.engagementScore)}>
                        {selectedSession.engagementScore}
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">Engagement</p>
                    </div>
                  </div>

                  {/* Time Metrics */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Duration</span>
                      <span className="font-medium">{formatDuration(selectedSession.totalDuration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Writing Time</span>
                      <span className="font-medium">{formatDuration(selectedSession.activeWritingTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Keystrokes</span>
                      <span className="font-medium">{selectedSession.totalKeystrokes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Productive Keystrokes</span>
                      <span className="font-medium">{selectedSession.productiveKeystrokes.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Pause Analysis */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Pause Analysis</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{selectedSession.shortPauses}</div>
                        <div className="text-gray-600">Short pauses</div>
                        <div className="text-xs text-gray-500">&lt; 2s</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{selectedSession.mediumPauses}</div>
                        <div className="text-gray-600">Medium pauses</div>
                        <div className="text-xs text-gray-500">2-10s</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{selectedSession.longPauses}</div>
                        <div className="text-gray-600">Long pauses</div>
                        <div className="text-xs text-gray-500">&gt; 10s</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Writing Bursts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Writing Bursts
                </CardTitle>
                <CardDescription>
                  Periods of sustained writing activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSession?.burstsOfActivity.length ? (
                  <div className="space-y-3">
                    {selectedSession.burstsOfActivity.map((burst, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Burst {index + 1}</span>
                          <Badge variant="outline">{burst.averageWPM.toFixed(1)} WPM</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">{formatDuration(burst.duration)}</span>
                            <br />
                            Duration
                          </div>
                          <div>
                            <span className="font-medium">{burst.keystrokes}</span>
                            <br />
                            Keystrokes
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">
                    No significant writing bursts detected
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Revision Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Revision Patterns
                </CardTitle>
                <CardDescription>
                  Editing and revision activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSession && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Editing Ratio</span>
                      <Badge variant="outline">
                        {(selectedSession.editingRatio * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    
                    {selectedSession.revisionPatterns.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Recent Revisions</h4>
                        {selectedSession.revisionPatterns.slice(0, 5).map((pattern, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">{pattern.type}</span>
                            <span className="font-medium">{pattern.length} characters</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm">No revision patterns detected</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Session Type Distribution
                </CardTitle>
                <CardDescription>
                  How your writing sessions are categorized
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(summary.sessionTypeDistribution).map(([type, count]) => (
                    <div key={type} className="text-center">
                      <div className="text-2xl font-bold">{count}</div>
                      <Badge className={getSessionTypeColor(type)}>
                        {type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Average Productivity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(summary?.averageProductivityScore || 0)}`}>
                  {summary?.averageProductivityScore || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">Out of 100</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Average Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(summary?.averageEngagementScore || 0)}`}>
                  {summary?.averageEngagementScore || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">Out of 100</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Writing Speed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.averageWPM || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">Words per minute</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 