'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Filter, 
  Search, 
  Eye, 
  Calendar, 
  Clock, 
  User, 
  FileText,
  BarChart3,
  Shield,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlaybackViewer } from '@/components/keystroke/playback-viewer';

interface KeystrokeRecording {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentId: string;
  documentTitle: string;
  sessionId: string;
  title: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  privacyLevel: 'full' | 'anonymized' | 'metadata_only';
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
  lastAccessedAt?: string;
  consentGiven: boolean;
}

interface KeystrokeViewerProps {
  className?: string;
}

export function KeystrokeViewer({ className = '' }: KeystrokeViewerProps) {
  const [recordings, setRecordings] = useState<KeystrokeRecording[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<KeystrokeRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [privacyFilter, setPrivacyFilter] = useState<string>('all');
  const [selectedRecording, setSelectedRecording] = useState<KeystrokeRecording | null>(null);
  const [showPlayback, setShowPlayback] = useState(false);

  // Load recordings on mount
  useEffect(() => {
    loadRecordings();
  }, []);

  // Filter recordings when search term or filters change
  useEffect(() => {
    filterRecordings();
  }, [recordings, searchTerm, statusFilter, privacyFilter]);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 Loading keystroke recordings...');
      
      const response = await fetch('/api/keystroke/recordings?includeUserInfo=true');
      console.log('📡 Response status:', response.status);
      console.log('✅ Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', errorText);
        
        // Try to parse as JSON for better error info
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ Parsed error:', errorData);
          throw new Error(`API Error: ${errorData.error || errorText}`);
        } catch (parseError) {
          throw new Error(`Failed to load recordings: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('📊 API response data:', data);
      console.log('📋 Number of recordings:', data.recordings?.length || 0);
      
      // Transform API response to match component interface
      const transformedRecordings = (data.recordings || []).map((recording: any) => ({
        id: recording.id,
        userId: recording.user_id,
        userName: recording.userName,
        userEmail: recording.userEmail,
        documentId: recording.document_id,
        documentTitle: recording.documentTitle,
        sessionId: recording.session_id,
        title: recording.title,
        status: recording.status,
        privacyLevel: recording.privacy_level, // Transform snake_case to camelCase
        startTime: recording.start_time,
        endTime: recording.end_time,
        durationMs: recording.duration_ms,
        totalKeystrokes: recording.total_keystrokes,
        totalCharacters: recording.total_characters,
        averageWpm: recording.average_wpm,
        pauseCount: recording.pause_count,
        backspaceCount: recording.backspace_count,
        deleteCount: recording.delete_count,
        createdAt: recording.created_at,
        lastAccessedAt: recording.last_accessed_at,
        consentGiven: recording.consent_given
      }));
      
      console.log('🔄 Transformed recordings:', transformedRecordings);
      setRecordings(transformedRecordings);
    } catch (error) {
      console.error('💥 Error loading recordings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load keystroke recordings. ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const filterRecordings = () => {
    let filtered = recordings;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(recording => 
        recording.userName.toLowerCase().includes(term) ||
        recording.userEmail.toLowerCase().includes(term) ||
        recording.documentTitle.toLowerCase().includes(term) ||
        recording.title.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(recording => recording.status === statusFilter);
    }

    // Apply privacy filter
    if (privacyFilter !== 'all') {
      filtered = filtered.filter(recording => recording.privacyLevel === privacyFilter);
    }

    setFilteredRecordings(filtered);
  };

  const handleViewRecording = (recording: KeystrokeRecording) => {
    setSelectedRecording(recording);
    setShowPlayback(true);
  };

  const handleExportRecording = async (recording: KeystrokeRecording) => {
    try {
      const response = await fetch(`/api/keystroke/recordings/${recording.id}/export`);
      if (!response.ok) {
        throw new Error('Failed to export recording');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keystroke-recording-${recording.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting recording:', error);
      setError('Failed to export recording. Please try again.');
    }
  };

  const handleDeleteRecording = async (recording: KeystrokeRecording) => {
    if (!confirm(`Are you sure you want to delete the recording "${recording.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/keystroke/recordings/${recording.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete recording');
      }

      // Remove from local state
      setRecordings(prev => prev.filter(r => r.id !== recording.id));
    } catch (error) {
      console.error('Error deleting recording:', error);
      setError('Failed to delete recording. Please try again.');
    }
  };

  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return 'N/A';
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      paused: 'secondary',
      completed: 'outline',
      archived: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPrivacyBadge = (privacyLevel: string) => {
    const colors = {
      full: 'bg-red-100 text-red-800',
      anonymized: 'bg-yellow-100 text-yellow-800',
      metadata_only: 'bg-green-100 text-green-800'
    };

    if (!privacyLevel) {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          <Shield className="w-3 h-3 mr-1" />
          UNKNOWN
        </Badge>
      );
    }

    return (
      <Badge className={colors[privacyLevel as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        <Shield className="w-3 h-3 mr-1" />
        {privacyLevel.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading keystroke recordings...
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Keystroke Recordings</h2>
          <p className="text-gray-600">View and manage student keystroke recordings</p>
        </div>
        <Button onClick={loadRecordings} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search students, documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            {/* Privacy Filter */}
            <select
              value={privacyFilter}
              onChange={(e) => setPrivacyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm"
            >
              <option value="all">All Privacy Levels</option>
              <option value="full">Full Data</option>
              <option value="anonymized">Anonymized</option>
              <option value="metadata_only">Metadata Only</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600">
              <BarChart3 className="w-4 h-4 mr-1" />
              {filteredRecordings.length} recordings
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recordings List */}
      <Card>
        <CardHeader>
          <CardTitle>Recordings</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecordings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {recordings.length === 0 ? 'No keystroke recordings found.' : 'No recordings match your filters.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecordings.map((recording) => (
                <div
                  key={recording.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Student Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{recording.userName}</p>
                          <p className="text-sm text-gray-600">{recording.userEmail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Document Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium truncate">{recording.documentTitle}</p>
                          <p className="text-sm text-gray-600 truncate">{recording.title}</p>
                        </div>
                      </div>
                    </div>

                    {/* Session Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{formatDuration(recording.durationMs)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="w-4 h-4 text-gray-500" />
                          <span>{recording.totalKeystrokes} keys</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(recording.status)}
                        {getPrivacyBadge(recording.privacyLevel)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewRecording(recording)}
                        disabled={recording.privacyLevel === 'metadata_only'}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportRecording(recording)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteRecording(recording)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Created:</span> {new Date(recording.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">WPM:</span> {recording.averageWpm || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Characters:</span> {recording.totalCharacters}
                    </div>
                    <div>
                      <span className="font-medium">Revisions:</span> {recording.backspaceCount + recording.deleteCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Playback Dialog */}
      <Dialog open={showPlayback} onOpenChange={setShowPlayback}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Keystroke Recording Playback - {selectedRecording?.title}
            </DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    </div>
  );
} 