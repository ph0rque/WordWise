'use client';

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { KeystrokeRecorder } from '@/lib/keystroke/recorder';

interface AutomaticRecorderProps {
  documentId: string;
  documentTitle: string;
  studentName: string;
  isEnabled?: boolean;
  textAreaRef?: React.RefObject<HTMLTextAreaElement | null>;
  editorRef?: React.RefObject<HTMLDivElement | null>;
  onSave?: () => void; // Callback when save button is clicked
}

export interface AutomaticRecorderRef {
  stopRecording: () => Promise<void>;
  isRecording: boolean;
}

export const AutomaticRecorder = forwardRef<AutomaticRecorderRef, AutomaticRecorderProps>(({
  documentId,
  documentTitle,
  studentName,
  isEnabled = true,
  textAreaRef,
  editorRef,
  onSave
}, ref) => {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<KeystrokeRecorder | null>(null);
  const sessionStartedRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Expose stopRecording method via ref
  useImperativeHandle(ref, () => ({
    stopRecording: async () => {
      await stopRecording();
    },
    isRecording
  }));

  // Check consent on mount
  useEffect(() => {

    checkConsent();
  }, []);

  // Set up automatic recording when consent is available
  useEffect(() => {

    
    if (hasConsent && isEnabled && !sessionStartedRef.current) {

      // Add small delay to ensure DOM elements are ready
      setTimeout(() => {
        setupAutomaticRecording();
      }, 100);
    } else {

    }
  }, [hasConsent, isEnabled, documentId]);

  // Handle save callback
  useEffect(() => {
    if (onSave) {
      // Store the original onSave function
      const originalOnSave = onSave;
      
      // No need to override anything - the parent will call our ref method
    }
  }, [onSave]);

  // Cleanup on unmount and page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (recorderRef.current && isRecording) {

        stopRecording();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (recorderRef.current && isRecording) {

        stopRecording();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isRecording]);

  const checkConsent = async () => {

    
    // For students who signed up, consent is implied during registration
    // Only need to check if they explicitly declined
    const localDeclined = localStorage.getItem('keystroke-consent-declined');
    
    if (localDeclined === 'true') {

      setHasConsent(false);
      return;
    }

    // For students, assume consent was given during signup

    setHasConsent(true);
  };

  const setupAutomaticRecording = () => {

    
    if (!hasConsent) {

      return;
    }

    const targetElement = textAreaRef?.current || editorRef?.current;
    if (!targetElement) {

      return;
    }
    


    // Initialize recorder
    if (!recorderRef.current) {
      recorderRef.current = new KeystrokeRecorder({
        enableEncryption: false, // Disabled for simplicity
        sampleRate: 10,
        bufferSize: 100,
        enablePasteDetection: true,
        enableSelectionTracking: true,
        enableTimingAnalysis: true,
        privacyMode: false // Disabled for simplicity
      });
    }

    // Add event listeners for automatic start
    const handleFirstInput = async () => {
      if (!sessionStartedRef.current && recorderRef.current) {
        await startRecording();
        sessionStartedRef.current = true;
      }
      
      // Reset the idle timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Auto-stop if no activity for 5 minutes (longer timeout now that we have manual save)
      typingTimeoutRef.current = setTimeout(async () => {
        if (isRecording) {

          await stopRecording();
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Add listeners to the target element

    targetElement.addEventListener('input', handleFirstInput);
    targetElement.addEventListener('keydown', handleFirstInput);
    targetElement.addEventListener('paste', handleFirstInput);



    // Cleanup function
    return () => {

      targetElement.removeEventListener('input', handleFirstInput);
      targetElement.removeEventListener('keydown', handleFirstInput);
      targetElement.removeEventListener('paste', handleFirstInput);
    };
  };

  const startRecording = async () => {

    
    if (!recorderRef.current || isRecording) {

      return;
    }

    try {
      const sessionId = await recorderRef.current.startRecording(
        studentName,
        documentId,
        documentTitle
      );
      
      setIsRecording(true);

    } catch (error) {
      console.error('❌ Error starting automatic recording:', error);
    }
  };

  const stopRecording = async () => {

    
    if (!recorderRef.current || !isRecording) {

      return;
    }

    try {
      const sessionData = await recorderRef.current.stopRecording();

      
      setIsRecording(false);
      sessionStartedRef.current = false;

      // Clear typing timeout since we're stopping manually
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Save session data to backend
      if (sessionData) {

        const response = await fetch('/api/keystroke/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        });
        
        if (response.ok) {

          // Dispatch event to notify other components that recording is complete
          window.dispatchEvent(new CustomEvent('keystroke-recording-completed', {
            detail: { sessionId: sessionData.id, documentId }
          }));
        } else {
          const errorData = await response.text();
          console.error('❌ Failed to save session data:', response.status, errorData);
        }
      } else {
        console.warn('⚠️ No session data to save');
      }
    } catch (error) {
      console.error('❌ Error stopping automatic recording:', error);
    }
  };

  // This component renders nothing - it's completely invisible
  return null;
});

AutomaticRecorder.displayName = 'AutomaticRecorder'; 