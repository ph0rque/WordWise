'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Eye, EyeOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { KeystrokePlaybackEngine, PlaybackRecording, PlaybackState, PlaybackAnalytics } from '@/lib/keystroke/playback';
import { PlaybackControls } from './playback-controls';

interface PlaybackViewerProps {
  recordingId?: string;
  className?: string;
  onRecordingLoad?: (recording: PlaybackRecording) => void;
  onPlaybackComplete?: (analytics: PlaybackAnalytics) => void;
}

export function PlaybackViewer({
  recordingId,
  className = '',
  onRecordingLoad,
  onPlaybackComplete
}: PlaybackViewerProps) {
  const [playbackEngine, setPlaybackEngine] = useState<KeystrokePlaybackEngine | null>(null);
  const [recording, setRecording] = useState<PlaybackRecording | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [analytics, setAnalytics] = useState<PlaybackAnalytics | null>(null);

  // Playback settings
  const [showCursor, setShowCursor] = useState(true);
  const [highlightChanges, setHighlightChanges] = useState(true);
  const [preserveTiming, setPreserveTiming] = useState(true);

  // Content display
  const [currentContent, setCurrentContent] = useState('');
  const [isContentVisible, setIsContentVisible] = useState(true);

  // DOM refs
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recordingId) {
      loadRecording(recordingId);
    }

    return () => {
      if (playbackEngine) {
        playbackEngine.destroy();
      }
    };
  }, [recordingId]);

  const loadRecording = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create new playback engine
      const engine = new KeystrokePlaybackEngine({
        showCursor,
        highlightChanges,
        preserveTimingAccuracy: preserveTiming,
        autoPlay: false
      });

      // Set up event listeners
      engine.on('recordingLoaded', (loadedRecording: PlaybackRecording) => {
        setRecording(loadedRecording);
        onRecordingLoad?.(loadedRecording);
      });

      engine.on('eventProcessed', () => {
        // Update content display when events are processed
        if (contentRef.current) {
          setCurrentContent(contentRef.current.value);
        }
      });

      engine.on('complete', (state: PlaybackState) => {
        const finalAnalytics = engine.getAnalytics();
        setAnalytics(finalAnalytics);
        onPlaybackComplete?.(finalAnalytics);
      });

      // Set target element
      if (contentRef.current) {
        engine.setTargetElement(contentRef.current);
      }

      // Load the recording
      await engine.loadRecording(id);
      
      setPlaybackEngine(engine);

    } catch (err) {
      console.error('Error loading recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recording');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateChange = (state: PlaybackState) => {
    setPlaybackState(state);
  };

  const handleAnalyticsUpdate = (newAnalytics: PlaybackAnalytics) => {
    setAnalytics(newAnalytics);
  };

  const handleSettingsChange = (setting: string, value: boolean) => {
    switch (setting) {
      case 'showCursor':
        setShowCursor(value);
        break;
      case 'highlightChanges':
        setHighlightChanges(value);
        break;
      case 'preserveTiming':
        setPreserveTiming(value);
        break;
    }

    // Update engine config if it exists
    if (playbackEngine) {
      // Note: In a full implementation, you'd want to update the engine's config
      // For now, settings will apply when a new recording is loaded
    }
  };

  const exportSession = () => {
    if (!recording || !analytics) return;

    const exportData = {
      recording: {
        id: recording.id,
        title: recording.title,
        duration: recording.durationMs,
        totalKeystrokes: recording.totalKeystrokes,
        totalCharacters: recording.totalCharacters,
        averageWpm: recording.averageWpm
      },
      playbackAnalytics: analytics,
      finalContent: currentContent,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keystroke-playback-${recording.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading keystroke recording...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="p-8">
          <div className="text-center text-red-600">
            <p className="font-medium">Error loading recording</p>
            <p className="text-sm mt-1">{error}</p>
            {recordingId && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => loadRecording(recordingId)}
              >
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recording) {
    return (
      <Card className={`bg-gray-50 ${className}`}>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No keystroke recording loaded</p>
            <p className="text-sm mt-1">Select a recording to begin playback</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} ref={viewerRef}>
      {/* Recording Info Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{recording.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span>Duration: {formatDuration(recording.durationMs)}</span>
                <span>•</span>
                <span>{recording.totalKeystrokes} keystrokes</span>
                <span>•</span>
                <span>{recording.totalCharacters} characters</span>
                {recording.averageWpm && (
                  <>
                    <span>•</span>
                    <span>{Math.round(recording.averageWpm)} WPM</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {recording.events.length} events
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={exportSession}
                disabled={!analytics}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Playback Controls */}
      <PlaybackControls
        playbackEngine={playbackEngine}
        onStateChange={handleStateChange}
        onAnalyticsUpdate={handleAnalyticsUpdate}
      />

      {/* Content Display */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Content Playback</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsContentVisible(!isContentVisible)}
              >
                {isContentVisible ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isContentVisible ? (
            <textarea
              ref={contentRef}
              className="w-full h-64 p-3 border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Content will appear here during playback..."
              readOnly
              value={currentContent}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-md">
              Content hidden - click eye icon to show
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Playback Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Show Cursor</label>
              <Switch
                checked={showCursor}
                onCheckedChange={(checked) => handleSettingsChange('showCursor', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Highlight Changes</label>
              <Switch
                checked={highlightChanges}
                onCheckedChange={(checked) => handleSettingsChange('highlightChanges', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Preserve Timing</label>
              <Switch
                checked={preserveTiming}
                onCheckedChange={(checked) => handleSettingsChange('preserveTiming', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Panel (if available) */}
      {analytics && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Playback Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(analytics.completionRate * 100)}%
                </div>
                <div className="text-sm text-gray-600">Completion</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.pauseCount}
                </div>
                <div className="text-sm text-gray-600">Pauses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.seekCount}
                </div>
                <div className="text-sm text-gray-600">Seeks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.speedChanges}
                </div>
                <div className="text-sm text-gray-600">Speed Changes</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total Play Time: {formatDuration(analytics.totalPlayTime)}</span>
                <span>Average Speed: {analytics.averageSpeed.toFixed(1)}x</span>
                <span>Session Started: {formatDate(analytics.sessionStartTime)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 