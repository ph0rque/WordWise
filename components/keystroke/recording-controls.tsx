'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Settings, Shield, Clock, Database, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConsentNotice, ConsentSettings } from './consent-notice';
import { PrivacySettings } from './privacy-settings';
import { KeystrokeRecorder } from '@/lib/keystroke/recorder';

interface RecordingControlsProps {
  documentId: string;
  documentTitle: string;
  studentName: string;
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
  isEnabled?: boolean;
  className?: string;
}

interface RecordingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  keystrokeCount: number;
  wordsTyped: number;
  averageWPM: number;
  status: 'recording' | 'paused' | 'completed';
}

export function RecordingControls({
  documentId,
  documentTitle,
  studentName,
  textAreaRef,
  isEnabled = true,
  className = ''
}: RecordingControlsProps) {
  const [hasConsent, setHasConsent] = useState(false);
  const [consentSettings, setConsentSettings] = useState<ConsentSettings | null>(null);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [sessionStats, setSessionStats] = useState({
    keystrokeCount: 0,
    wordsTyped: 0,
    averageWPM: 0,
    sessionDuration: 0
  });
  const [consentDecisionMade, setConsentDecisionMade] = useState(false);

  const sessionStartTimeRef = useRef<Date | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const keystrokeRecorderRef = useRef<KeystrokeRecorder | null>(null);

  // Load existing consent on mount
  useEffect(() => {
    loadExistingConsent();
  }, []);

  // Cleanup keystroke recorder on unmount
  useEffect(() => {
    return () => {
      if (keystrokeRecorderRef.current && isRecording) {
        keystrokeRecorderRef.current.stopRecording();
      }
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [isRecording]);

  const loadExistingConsent = async () => {
    try {
      // Check localStorage first for consent decision
      const localConsentDecision = localStorage.getItem('keystroke-consent-decision');
      const localConsentDeclined = localStorage.getItem('keystroke-consent-declined');
      
      if (localConsentDeclined === 'true') {
        setConsentDecisionMade(true);
        setHasConsent(false);
        return;
      }

      const response = await fetch('/api/keystroke/consent');
      if (response.ok) {
        const data = await response.json();
        if (data.hasConsent) {
          setHasConsent(true);
          setConsentSettings(data.settings);
          setConsentDecisionMade(true);
          // Store positive consent decision in localStorage
          localStorage.setItem('keystroke-consent-decision', 'accepted');
        } else if (data.declined) {
          // Server knows user has declined
          setConsentDecisionMade(true);
          setHasConsent(false);
          localStorage.setItem('keystroke-consent-declined', 'true');
        }
      } else if (localConsentDecision === 'accepted') {
        // User had consented before but server doesn't know - clear local storage
        localStorage.removeItem('keystroke-consent-decision');
      }
    } catch (error) {
      console.error('Error loading consent:', error);
      // Check localStorage as fallback
      const localConsentDeclined = localStorage.getItem('keystroke-consent-declined');
      if (localConsentDeclined === 'true') {
        setConsentDecisionMade(true);
        setHasConsent(false);
      }
    }
  };

  const handleConsentGiven = async (consent: ConsentSettings) => {
    try {
      // Save consent to backend
      const response = await fetch('/api/keystroke/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consent)
      });

      if (response.ok) {
        setHasConsent(true);
        setConsentSettings(consent);
        setShowConsentDialog(false);
        setConsentDecisionMade(true);
        // Store consent decision in localStorage
        localStorage.setItem('keystroke-consent-decision', 'accepted');
        localStorage.removeItem('keystroke-consent-declined');

      } else {
        throw new Error('Failed to save consent');
      }
    } catch (error) {
      console.error('Error saving consent:', error);
      alert('Failed to save consent. Please try again.');
    }
  };

  const handleConsentDeclined = async () => {
    try {
      // Save decline decision to backend
      const response = await fetch('/api/keystroke/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ declined: true })
      });

      setShowConsentDialog(false);
      setConsentDecisionMade(true);
      setHasConsent(false);
      // Store decline decision in localStorage
      localStorage.setItem('keystroke-consent-declined', 'true');
      localStorage.removeItem('keystroke-consent-decision');
      
    } catch (error) {
      console.error('Error saving decline decision:', error);
      // Still record locally even if server save fails
      setShowConsentDialog(false);
      setConsentDecisionMade(true);
      setHasConsent(false);
      localStorage.setItem('keystroke-consent-declined', 'true');
    }
  };

  const startRecording = async () => {
    if (!consentSettings) {
      console.error('No consent settings available');
      return;
    }

    try {
      // Initialize keystroke recorder if not already created
      if (!keystrokeRecorderRef.current) {
        keystrokeRecorderRef.current = new KeystrokeRecorder({
          enableEncryption: true,
          sampleRate: 10,
          bufferSize: 100,
          enablePasteDetection: true,
          enableSelectionTracking: consentSettings.allowPlaybackReview,
          enableTimingAnalysis: true,
          privacyMode: consentSettings.privacyLevel === 'anonymized'
        });
      }

      // Start keystroke recording
      const sessionId = await keystrokeRecorderRef.current.startRecording(
        studentName, 
        documentId, 
        documentTitle
      );

      const startTime = new Date();
      setIsRecording(true);
      setIsPaused(false);
      sessionStartTimeRef.current = startTime;
      setCurrentSession({
        id: sessionId,
        startTime,
        keystrokeCount: 0,
        wordsTyped: 0,
        averageWPM: 0,
        status: 'recording'
      });

      // Start stats tracking
      startStatsTracking();

      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please try again.');
    }
  };

  const pauseRecording = async () => {
    try {
      if (keystrokeRecorderRef.current) {
        keystrokeRecorderRef.current.pauseRecording();
      }
      setIsPaused(true);
      setCurrentSession(prev => prev ? { ...prev, status: 'paused' } : null);
      
    } catch (error) {
      console.error('Error pausing recording:', error);
    }
  };

  const resumeRecording = async () => {
    try {
      if (keystrokeRecorderRef.current) {
        keystrokeRecorderRef.current.resumeRecording();
      }
      setIsPaused(false);
      setCurrentSession(prev => prev ? { ...prev, status: 'recording' } : null);
      
    } catch (error) {
      console.error('Error resuming recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      // Stop keystroke recording and get session data
      let sessionData = null;
      if (keystrokeRecorderRef.current) {
        sessionData = await keystrokeRecorderRef.current.stopRecording();
      }

      setIsRecording(false);
      setIsPaused(false);
      setCurrentSession(prev => prev ? { 
        ...prev, 
        endTime: new Date(),
        status: 'completed'
      } : null);

      // Stop stats tracking
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }

      // Send session data to backend
      if (sessionData) {
        try {
          await fetch('/api/keystroke/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData)
          });

        } catch (error) {
          console.error('Error saving session data:', error);
        }
      }

      
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const startStatsTracking = () => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
    }

    statsIntervalRef.current = setInterval(() => {
      if (sessionStartTimeRef.current && keystrokeRecorderRef.current) {
        const duration = (Date.now() - sessionStartTimeRef.current.getTime()) / 1000;
        
        // Get real stats from keystroke recorder
        const recorderStats = keystrokeRecorderRef.current.getStatistics();
        const recordingStatus = keystrokeRecorderRef.current.getRecordingStatus();
        
        setSessionStats({
          keystrokeCount: recorderStats?.totalEvents || 0,
          wordsTyped: Math.floor((recorderStats?.totalEvents || 0) / 5), // Estimate words from keystrokes
          averageWPM: recorderStats?.averageWPM || 0,
          sessionDuration: Math.floor(duration)
        });

        setCurrentSession(prev => prev ? {
          ...prev,
          keystrokeCount: recorderStats?.totalEvents || 0,
          wordsTyped: Math.floor((recorderStats?.totalEvents || 0) / 5),
          averageWPM: recorderStats?.averageWPM || 0
        } : null);
      }
    }, 1000);
  };

  const handleSettingsUpdate = async (newSettings: ConsentSettings) => {
    try {
      const response = await fetch('/api/keystroke/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        setConsentSettings(newSettings);

      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    }
  };

  const handleWithdrawConsent = async () => {
    try {
      const response = await fetch('/api/keystroke/consent', {
        method: 'DELETE'
      });

      if (response.ok) {
        setHasConsent(false);
        setConsentSettings(null);
        setConsentDecisionMade(true);
        // Update localStorage to reflect withdrawal (which is like declining)
        localStorage.setItem('keystroke-consent-declined', 'true');
        localStorage.removeItem('keystroke-consent-decision');
        
        if (isRecording) {
          await stopRecording();
        }

      } else {
        throw new Error('Failed to withdraw consent');
      }
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      alert('Failed to withdraw consent. Please try again.');
    }
  };

  const handleDataExport = async () => {
    try {
      const response = await fetch('/api/keystroke/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `keystroke-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

      } else {
        throw new Error('Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleDataDeletion = async () => {
    try {
      const response = await fetch('/api/keystroke/data', {
        method: 'DELETE'
      });

      if (response.ok) {

        alert('Data deletion request submitted. Your data will be removed within 24 hours.');
      } else {
        throw new Error('Failed to request data deletion');
      }
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      alert('Failed to request data deletion. Please try again.');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recording Status Card */}
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Keystroke Recording</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {hasConsent ? (
                <Badge variant="default" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Consent Required
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!hasConsent ? (
            consentDecisionMade ? (
              <div className="space-y-3">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Keystroke recording is disabled.</strong><br />
                    You have chosen not to participate in keystroke recording.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={() => setShowConsentDialog(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Change Consent Decision
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Keystroke recording can help improve your writing.</strong><br />
                    We need your consent to record your typing patterns for educational analysis.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={() => setShowConsentDialog(true)}
                  className="w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Review Consent Notice
                </Button>
              </div>
            )
          ) : (
            <div className="space-y-3">
              {/* Recording Controls */}
              <div className="flex items-center space-x-2">
                {!isRecording ? (
                  <Button 
                    onClick={startRecording} 
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start Recording
                  </Button>
                ) : isPaused ? (
                  <>
                    <Button 
                      onClick={resumeRecording} 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                    <Button 
                      onClick={stopRecording} 
                      size="sm" 
                      variant="destructive"
                    >
                      <Square className="w-4 h-4 mr-1" />
                      Stop
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={pauseRecording} 
                      size="sm" 
                      variant="outline"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                    <Button 
                      onClick={stopRecording} 
                      size="sm" 
                      variant="destructive"
                    >
                      <Square className="w-4 h-4 mr-1" />
                      Stop
                    </Button>
                  </>
                )}
                
                <Dialog open={showPrivacySettings} onOpenChange={setShowPrivacySettings}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Privacy Settings</DialogTitle>
                    </DialogHeader>
                    {consentSettings && (
                      <PrivacySettings
                        currentSettings={consentSettings}
                        onSettingsUpdate={handleSettingsUpdate}
                        onWithdrawConsent={handleWithdrawConsent}
                        onRequestDataExport={handleDataExport}
                        onRequestDataDeletion={handleDataDeletion}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </div>

              {/* Session Stats */}
              {currentSession && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>Duration: {formatDuration(sessionStats.sessionDuration)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-gray-500" />
                    <span>Keystrokes: {sessionStats.keystrokeCount}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span>Words: {sessionStats.wordsTyped}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>WPM: {sessionStats.averageWPM}</span>
                  </div>
                </div>
              )}

              {/* Privacy Level Indicator */}
              {consentSettings && (
                <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t">
                  <span>Privacy Level:</span>
                  <Badge variant="outline" className="text-xs">
                    {consentSettings.privacyLevel.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent className="max-w-none w-[95vw] max-h-[95vh] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Keystroke Recording Consent</DialogTitle>
          </DialogHeader>
          <ConsentNotice
            isVisible={showConsentDialog}
            onConsent={handleConsentGiven}
            onDecline={handleConsentDeclined}
            studentName={studentName}
            documentTitle={documentTitle}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 