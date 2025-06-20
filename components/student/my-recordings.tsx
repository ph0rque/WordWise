'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Eye, 
  Clock, 
  FileText, 
  BarChart3, 
  Calendar,
  TrendingUp,
  Timer,
  Type,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlaybackViewer } from '@/components/keystroke/playback-viewer';

interface StudentRecording {
  id: string;
  documentTitle: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  totalKeystrokes: number;
  totalCharacters: number;
  averageWpm?: number;
  pauseCount: number;
  backspaceCount: number;
  deleteCount: number;
  createdAt: string;
  status: 'active' | 'paused' | 'completed';
  analytics?: {
    focusScore: number;
    productivityScore: number;
    timeOnTask: number;
    editingRatio: number;
  };
}

interface MyRecordingsProps {
  className?: string;
  documentId?: string;
  documentTitle?: string;
}

export function MyRecordings({ className = '', documentId, documentTitle }: MyRecordingsProps) {
  const [recordings, setRecordings] = useState<StudentRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedRecording, setSelectedRecording] = useState<StudentRecording | null>(null);
  const [showPlayback, setShowPlayback] = useState(false);

  useEffect(() => {
    loadMyRecordings();
  }, [documentId]);

  // Add a refresh function that can be called externally
  useEffect(() => {
    const handleRecordingComplete = () => {
      console.log('🔄 Recording completed, refreshing recordings list...');
      // Wait a bit for the database to be updated
      setTimeout(() => {
        loadMyRecordings();
      }, 1000);
    };

    // Listen for custom events when recordings are completed
    window.addEventListener('keystroke-recording-completed', handleRecordingComplete);
    
    return () => {
      window.removeEventListener('keystroke-recording-completed', handleRecordingComplete);
    };
  }, []);

  const loadMyRecordings = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query URL with document filter if provided
      let url = '/api/keystroke/recordings?self=true';
      if (documentId) {
        url += `&documentId=${encodeURIComponent(documentId)}`;
      }

      console.log('🔍 Fetching recordings from:', url, 'for documentId:', documentId);

      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated - this is expected for new users
          setRecordings([]);
          return;
        }
        throw new Error('Failed to load recordings');
      }

      const data = await response.json();
      
      // The API should already filter by documentId server-side, but we'll keep this as fallback
      let filteredRecordings = data.recordings || [];
      console.log('📊 API Response:', {
        totalRecordings: filteredRecordings.length,
        documentId,
        recordings: filteredRecordings.map((r: StudentRecording) => ({
          id: r.id,
          documentTitle: r.documentTitle,
          sessionId: r.sessionId,
          status: r.status
        }))
      });
      
      setRecordings(filteredRecordings);
    } catch (error) {
      console.error('Error loading recordings:', error);
      setError('Failed to load your recordings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecording = (recording: StudentRecording) => {
    setSelectedRecording(recording);
    setShowPlayback(true);
  };

  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return 'N/A';
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateOverallStats = () => {
    const completedRecordings = recordings.filter(r => r.status === 'completed');
    if (completedRecordings.length === 0) return null;

    const totalDuration = completedRecordings.reduce((sum, r) => sum + (r.durationMs || 0), 0);
    const totalKeystrokes = completedRecordings.reduce((sum, r) => sum + r.totalKeystrokes, 0);
    const avgWpm = completedRecordings.reduce((sum, r) => sum + (r.averageWpm || 0), 0) / completedRecordings.length;
    const totalSessions = completedRecordings.length;

    return {
      totalDuration,
      totalKeystrokes,
      avgWpm: Math.round(avgWpm),
      totalSessions,
      avgSessionLength: totalDuration / totalSessions
    };
  };

  const overallStats = calculateOverallStats();

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading your recordings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-8">
          <Alert>
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Stats */}
      {overallStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average WPM</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.avgWpm}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Writing Time</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(overallStats.totalDuration)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Keystrokes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalKeystrokes.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recordings List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Writing Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {recordings.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {documentTitle ? 'No sessions for this document yet' : 'No writing sessions yet'}
              </p>
              <p className="text-sm text-gray-400">
                {documentTitle 
                  ? 'Start typing in this document to create your first keystroke recording session'
                  : 'Start writing an essay to see your keystroke recordings here'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recordings.map((recording) => (
                <Card key={recording.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-lg">{recording.documentTitle}</h3>
                          <Badge className={getStatusColor(recording.status)}>
                            {recording.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(recording.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(recording.durationMs)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Type className="h-3 w-3" />
                            <span>{recording.totalKeystrokes} keystrokes</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{recording.averageWpm || 0} WPM</span>
                          </div>
                        </div>

                        {recording.analytics && (
                          <div className="mt-3 flex items-center space-x-4 text-xs">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Focus: {recording.analytics.focusScore}%
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                              Productivity: {recording.analytics.productivityScore}%
                            </span>
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              Time on Task: {Math.round(recording.analytics.timeOnTask)}min
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {recording.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewRecording(recording)}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Playback Dialog */}
      <Dialog open={showPlayback} onOpenChange={setShowPlayback}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Writing Session Playback - {selectedRecording?.documentTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            {selectedRecording && (
              <PlaybackViewer
                recordingId={selectedRecording.id}
                onRecordingLoad={(recording) => {
                  console.log('Recording loaded:', recording);
                }}
                onPlaybackComplete={(analytics) => {
                  console.log('Playback completed:', analytics);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 