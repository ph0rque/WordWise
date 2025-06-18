'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { KeystrokePlaybackEngine, PlaybackState, PlaybackAnalytics } from '@/lib/keystroke/playback';

interface PlaybackControlsProps {
  playbackEngine: KeystrokePlaybackEngine | null;
  className?: string;
  onStateChange?: (state: PlaybackState) => void;
  onAnalyticsUpdate?: (analytics: PlaybackAnalytics) => void;
}

export function PlaybackControls({
  playbackEngine,
  className = '',
  onStateChange,
  onAnalyticsUpdate
}: PlaybackControlsProps) {
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    totalDuration: 0,
    playbackSpeed: 1.0,
    currentEventIndex: 0,
    progress: 0
  });

  const [analytics, setAnalytics] = useState<PlaybackAnalytics | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Speed options
  const speedOptions = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0];

  useEffect(() => {
    if (!playbackEngine) return;

    // Set up event listeners
    const handleStateUpdate = (newState: PlaybackState) => {
      setState(newState);
      onStateChange?.(newState);
    };

    const handleTimeUpdate = ({ currentTime, progress }: { currentTime: number; progress: number }) => {
      if (!isDragging) {
        setState(prev => ({
          ...prev,
          currentTime,
          progress
        }));
      }
    };

    const handlePlay = (newState: PlaybackState) => {
      setState(newState);
      onStateChange?.(newState);
    };

    const handlePause = (newState: PlaybackState) => {
      setState(newState);
      onStateChange?.(newState);
    };

    const handleStop = (newState: PlaybackState) => {
      setState(newState);
      onStateChange?.(newState);
    };

    const handleComplete = (newState: PlaybackState) => {
      setState(newState);
      onStateChange?.(newState);
      
      // Update analytics
      const currentAnalytics = playbackEngine.getAnalytics();
      setAnalytics(currentAnalytics);
      onAnalyticsUpdate?.(currentAnalytics);
    };

    const handleSpeedChange = (speed: number) => {
      setState(prev => ({ ...prev, playbackSpeed: speed }));
    };

    const handleSeek = ({ time, progress }: { time: number; progress: number }) => {
      setState(prev => ({
        ...prev,
        currentTime: time,
        progress
      }));
    };

    // Add event listeners
    playbackEngine.on('play', handlePlay);
    playbackEngine.on('pause', handlePause);
    playbackEngine.on('stop', handleStop);
    playbackEngine.on('complete', handleComplete);
    playbackEngine.on('timeUpdate', handleTimeUpdate);
    playbackEngine.on('speedChange', handleSpeedChange);
    playbackEngine.on('seek', handleSeek);

    // Initialize state
    const initialState = playbackEngine.getState();
    setState(initialState);

    return () => {
      // Clean up event listeners
      playbackEngine.off('play', handlePlay);
      playbackEngine.off('pause', handlePause);
      playbackEngine.off('stop', handleStop);
      playbackEngine.off('complete', handleComplete);
      playbackEngine.off('timeUpdate', handleTimeUpdate);
      playbackEngine.off('speedChange', handleSpeedChange);
      playbackEngine.off('seek', handleSeek);
    };
  }, [playbackEngine, isDragging, onStateChange, onAnalyticsUpdate]);

  const handlePlayPause = () => {
    if (!playbackEngine) return;

    if (state.isPlaying) {
      playbackEngine.pause();
    } else {
      playbackEngine.play();
    }
  };

  const handleStop = () => {
    if (!playbackEngine) return;
    playbackEngine.stop();
  };

  const handleSkipBackward = () => {
    if (!playbackEngine) return;
    playbackEngine.skipBackward();
  };

  const handleSkipForward = () => {
    if (!playbackEngine) return;
    playbackEngine.skipForward();
  };

  const handleSpeedChange = (speed: number) => {
    if (!playbackEngine) return;
    playbackEngine.setSpeed(speed);
  };

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!playbackEngine || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = progress * state.totalDuration;

    playbackEngine.seek(targetTime);
  };

  const handleTimelineDragStart = () => {
    setIsDragging(true);
  };

  const handleTimelineDragEnd = () => {
    setIsDragging(false);
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatSpeed = (speed: number): string => {
    return `${speed}x`;
  };

  if (!playbackEngine) {
    return (
      <Card className={`bg-gray-50 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            No recording loaded
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white shadow-sm ${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Timeline */}
        <div className="space-y-2">
          <div
            ref={timelineRef}
            className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
            onClick={handleTimelineClick}
            onMouseDown={handleTimelineDragStart}
            onMouseUp={handleTimelineDragEnd}
          >
            {/* Progress bar */}
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${state.progress * 100}%` }}
            />
            
            {/* Progress handle */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full shadow-md cursor-grab active:cursor-grabbing"
              style={{ left: `calc(${state.progress * 100}% - 8px)` }}
            />
          </div>

          {/* Time display */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(state.currentTime)}</span>
            <span>{formatTime(state.totalDuration)}</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSkipBackward}
            disabled={state.currentTime <= 0}
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant={state.isPlaying ? "default" : "outline"}
            size="sm"
            onClick={handlePlayPause}
            className="px-4"
          >
            {state.isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            disabled={!state.isPlaying && !state.isPaused}
          >
            <Square className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSkipForward}
            disabled={state.currentTime >= state.totalDuration}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Speed control and info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Speed:</span>
            <div className="flex space-x-1">
              {speedOptions.map((speed) => (
                <Button
                  key={speed}
                  variant={state.playbackSpeed === speed ? "default" : "outline"}
                  size="sm"
                  className="px-2 py-1 text-xs"
                  onClick={() => handleSpeedChange(speed)}
                >
                  {formatSpeed(speed)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              Event {state.currentEventIndex}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {Math.round(state.progress * 100)}%
            </Badge>
          </div>
        </div>

        {/* Analytics (if available) */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t">
            <div className="text-center">
              <div className="text-xs text-gray-500">Pauses</div>
              <div className="font-medium">{analytics.pauseCount}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Seeks</div>
              <div className="font-medium">{analytics.seekCount}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Speed Changes</div>
              <div className="font-medium">{analytics.speedChanges}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Completion</div>
              <div className="font-medium">{Math.round(analytics.completionRate * 100)}%</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 