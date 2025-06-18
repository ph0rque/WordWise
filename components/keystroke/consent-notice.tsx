'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Clock, Database, Lock, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ConsentNoticeProps {
  isVisible: boolean;
  onConsent: (consent: ConsentSettings) => void;
  onDecline: () => void;
  studentName?: string;
  documentTitle?: string;
  className?: string;
}

export interface ConsentSettings {
  recordingEnabled: boolean;
  privacyLevel: 'full' | 'anonymized' | 'metadata_only';
  dataRetentionDays: number;
  allowTeacherReview: boolean;
  allowPlaybackReview: boolean;
  consentTimestamp: Date;
  studentSignature: string;
}

export function ConsentNotice({
  isVisible,
  onConsent,
  onDecline,
  studentName = 'Student',
  documentTitle = 'Writing Assignment',
  className = ''
}: ConsentNoticeProps) {
  const [currentTab, setCurrentTab] = useState('overview');
  const [consentSettings, setConsentSettings] = useState<ConsentSettings>({
    recordingEnabled: false,
    privacyLevel: 'anonymized',
    dataRetentionDays: 30,
    allowTeacherReview: true,
    allowPlaybackReview: false,
    consentTimestamp: new Date(),
    studentSignature: ''
  });
  
  const [hasReadAllSections, setHasReadAllSections] = useState(false);
  const [readSections, setReadSections] = useState<Set<string>>(new Set());

  const requiredSections = ['overview', 'privacy', 'usage', 'rights'];

  useEffect(() => {
    if (readSections.size >= requiredSections.length) {
      setHasReadAllSections(true);
    }
  }, [readSections]);

  const markSectionAsRead = (section: string) => {
    setReadSections(prev => new Set([...prev, section]));
  };

  const handlePrivacyLevelChange = (level: 'full' | 'anonymized' | 'metadata_only') => {
    setConsentSettings(prev => ({
      ...prev,
      privacyLevel: level,
      allowPlaybackReview: level === 'full',
      dataRetentionDays: level === 'metadata_only' ? 90 : prev.dataRetentionDays
    }));
  };

  const handleRetentionChange = (days: number) => {
    setConsentSettings(prev => ({
      ...prev,
      dataRetentionDays: days
    }));
  };

  const handleSettingChange = (setting: keyof ConsentSettings, value: any) => {
    setConsentSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleGiveConsent = () => {
    if (!consentSettings.studentSignature.trim()) {
      alert('Please provide your digital signature to confirm consent.');
      return;
    }

    const finalSettings = {
      ...consentSettings,
      recordingEnabled: true,
      consentTimestamp: new Date()
    };

    onConsent(finalSettings);
  };

  const getPrivacyLevelDescription = (level: string) => {
    switch (level) {
      case 'full':
        return 'Complete keystroke data including exact content and timing';
      case 'anonymized':
        return 'Keystroke patterns and timing without personal identifiers';
      case 'metadata_only':
        return 'Only basic statistics like typing speed and session duration';
      default:
        return '';
    }
  };

  const getRetentionDescription = (days: number) => {
    if (days <= 7) return 'Very short-term (good for immediate feedback)';
    if (days <= 30) return 'Short-term (standard for assignments)';
    if (days <= 90) return 'Medium-term (useful for progress tracking)';
    return 'Long-term (comprehensive analysis)';
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Keystroke Recording Consent</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  For: {documentTitle} • Student: {studentName}
                </p>
              </div>
            </div>
            <Badge variant={hasReadAllSections ? "default" : "secondary"}>
              {readSections.size}/{requiredSections.length} sections read
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[70vh]">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger 
                value="overview" 
                className={readSections.has('overview') ? 'bg-green-50' : ''}
              >
                <div className="flex items-center space-x-1">
                  <Info className="w-4 h-4" />
                  <span>Overview</span>
                  {readSections.has('overview') && <CheckCircle className="w-3 h-3 text-green-600" />}
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="privacy"
                className={readSections.has('privacy') ? 'bg-green-50' : ''}
              >
                <div className="flex items-center space-x-1">
                  <Lock className="w-4 h-4" />
                  <span>Privacy</span>
                  {readSections.has('privacy') && <CheckCircle className="w-3 h-3 text-green-600" />}
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="usage"
                className={readSections.has('usage') ? 'bg-green-50' : ''}
              >
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>Usage</span>
                  {readSections.has('usage') && <CheckCircle className="w-3 h-3 text-green-600" />}
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="rights"
                className={readSections.has('rights') ? 'bg-green-50' : ''}
              >
                <div className="flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Your Rights</span>
                  {readSections.has('rights') && <CheckCircle className="w-3 h-3 text-green-600" />}
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-4">
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>What is keystroke recording?</strong><br />
                    We can record how you type to help improve your writing skills. This includes when you press keys, 
                    how fast you type, and patterns in your writing process.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium flex items-center mb-2">
                        <Clock className="w-4 h-4 mr-2 text-blue-600" />
                        What We Record
                      </h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Typing speed and rhythm</li>
                        <li>• Pause patterns while thinking</li>
                        <li>• Editing and revision patterns</li>
                        <li>• Time spent on different parts</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium flex items-center mb-2">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        How It Helps You
                      </h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Identify your writing strengths</li>
                        <li>• Understand your thinking process</li>
                        <li>• Get personalized feedback</li>
                        <li>• Track improvement over time</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => markSectionAsRead('overview')}
                    disabled={readSections.has('overview')}
                  >
                    {readSections.has('overview') ? 'Section Read' : 'Mark as Read'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="mt-6 space-y-4">
              <div className="space-y-4">
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Your privacy is our priority.</strong><br />
                    All keystroke data is encrypted and stored securely. You control who can see it and for how long.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Choose Your Privacy Level:</h4>
                    <div className="space-y-3">
                      {[
                        { level: 'metadata_only', icon: Database, color: 'green', label: 'Statistics Only' },
                        { level: 'anonymized', icon: EyeOff, color: 'blue', label: 'Anonymous Patterns' },
                        { level: 'full', icon: Eye, color: 'orange', label: 'Complete Recording' }
                      ].map(({ level, icon: Icon, color, label }) => (
                        <div key={level} className="flex items-start space-x-3">
                          <input
                            type="radio"
                            id={level}
                            name="privacyLevel"
                            checked={consentSettings.privacyLevel === level}
                            onChange={() => handlePrivacyLevelChange(level as any)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <label htmlFor={level} className="cursor-pointer">
                              <div className="flex items-center space-x-2 mb-1">
                                <Icon className={`w-4 h-4 text-${color}-600`} />
                                <span className="font-medium">{label}</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {getPrivacyLevelDescription(level)}
                              </p>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Data Retention Period:</h4>
                    <div className="flex items-center space-x-4">
                      <select
                        value={consentSettings.dataRetentionDays}
                        onChange={(e) => handleRetentionChange(Number(e.target.value))}
                        className="border rounded px-3 py-2"
                      >
                        <option value={7}>7 days</option>
                        <option value={30}>30 days</option>
                        <option value={90}>90 days</option>
                        <option value={180}>180 days</option>
                      </select>
                      <span className="text-sm text-gray-600">
                        {getRetentionDescription(consentSettings.dataRetentionDays)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => markSectionAsRead('privacy')}
                    disabled={readSections.has('privacy')}
                  >
                    {readSections.has('privacy') ? 'Section Read' : 'Mark as Read'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="usage" className="mt-6 space-y-4">
              <div className="space-y-4">
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Who can see your data?</strong><br />
                    You control who has access to your keystroke recordings and how they can be used.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Allow Teacher Review</h4>
                      <p className="text-sm text-gray-600">
                        Your teacher can view anonymized patterns to provide feedback
                      </p>
                    </div>
                    <Switch
                      checked={consentSettings.allowTeacherReview}
                      onCheckedChange={(checked) => handleSettingChange('allowTeacherReview', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Allow Playback Review</h4>
                      <p className="text-sm text-gray-600">
                        Enable keystroke playback for detailed analysis (requires full recording)
                      </p>
                    </div>
                    <Switch
                      checked={consentSettings.allowPlaybackReview}
                      onCheckedChange={(checked) => handleSettingChange('allowPlaybackReview', checked)}
                      disabled={consentSettings.privacyLevel !== 'full'}
                    />
                  </div>

                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-amber-800 mb-2">How Your Data Is Used:</h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li>• Providing personalized writing feedback</li>
                        <li>• Identifying areas for improvement</li>
                        <li>• Tracking your progress over time</li>
                        <li>• Helping teachers understand student needs</li>
                        <li>• Research to improve educational tools (anonymized only)</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => markSectionAsRead('usage')}
                    disabled={readSections.has('usage')}
                  >
                    {readSections.has('usage') ? 'Section Read' : 'Mark as Read'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rights" className="mt-6 space-y-4">
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>You have important rights regarding your data.</strong><br />
                    You can change your mind at any time and control how your information is used.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Your Rights Include:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Withdraw consent at any time</li>
                        <li>• Request to see your data</li>
                        <li>• Request data deletion</li>
                        <li>• Change privacy settings</li>
                        <li>• Ask questions about data use</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-purple-800 mb-2">Important Notes:</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Recording is completely optional</li>
                        <li>• No penalty for declining</li>
                        <li>• You can stop recording anytime</li>
                        <li>• Data is never shared publicly</li>
                        <li>• All data is encrypted and secure</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => markSectionAsRead('rights')}
                    disabled={readSections.has('rights')}
                  >
                    {readSections.has('rights') ? 'Section Read' : 'Mark as Read'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Consent Form */}
          {hasReadAllSections && (
            <div className="mt-8 p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
              <h3 className="font-medium text-blue-900 mb-4">Digital Consent Form</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Digital Signature (type your full name):
                  </label>
                  <input
                    type="text"
                    value={consentSettings.studentSignature}
                    onChange={(e) => handleSettingChange('studentSignature', e.target.value)}
                    placeholder="Type your full name here"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="text-sm text-gray-600">
                  <p>By typing your name above, you confirm that:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>You have read and understood all sections</li>
                    <li>You consent to keystroke recording with the selected privacy settings</li>
                    <li>You understand your rights and how to exercise them</li>
                    <li>You can withdraw this consent at any time</li>
                  </ul>
                </div>

                <div className="text-xs text-gray-500 bg-white p-3 rounded">
                  <strong>Consent Summary:</strong><br />
                  Privacy Level: {consentSettings.privacyLevel.replace('_', ' ')}<br />
                  Data Retention: {consentSettings.dataRetentionDays} days<br />
                  Teacher Review: {consentSettings.allowTeacherReview ? 'Allowed' : 'Not allowed'}<br />
                  Playback Review: {consentSettings.allowPlaybackReview ? 'Allowed' : 'Not allowed'}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <Button variant="outline" onClick={onDecline}>
            Decline Recording
          </Button>
          
          <Button
            onClick={handleGiveConsent}
            disabled={!hasReadAllSections || !consentSettings.studentSignature.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Give Consent & Start Recording
          </Button>
        </div>
      </Card>
    </div>
  );
} 