'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Download, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConsentSettings } from './consent-notice';

interface PrivacySettingsProps {
  currentSettings: ConsentSettings;
  onSettingsUpdate: (settings: ConsentSettings) => void;
  onWithdrawConsent: () => void;
  onRequestDataExport: () => void;
  onRequestDataDeletion: () => void;
  className?: string;
}

export function PrivacySettings({
  currentSettings,
  onSettingsUpdate,
  onWithdrawConsent,
  onRequestDataExport,
  onRequestDataDeletion,
  className = ''
}: PrivacySettingsProps) {
  const [settings, setSettings] = useState<ConsentSettings>(currentSettings);
  const [isModified, setIsModified] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSettings(currentSettings);
    setIsModified(false);
  }, [currentSettings]);

  const handleSettingChange = (setting: keyof ConsentSettings, value: any) => {
    const newSettings = { ...settings, [setting]: value };
    
    if (setting === 'privacyLevel') {
      if (value !== 'full') {
        newSettings.allowPlaybackReview = false;
      }
    }

    setSettings(newSettings);
    setIsModified(JSON.stringify(newSettings) !== JSON.stringify(currentSettings));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      await onSettingsUpdate(settings);
      setIsModified(false);
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawConsent = async () => {
    setIsLoading(true);
    try {
      await onWithdrawConsent();
      setShowWithdrawDialog(false);
    } catch (error) {
      console.error('Error withdrawing consent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestDataDeletion = async () => {
    setIsLoading(true);
    try {
      await onRequestDataDeletion();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error requesting data deletion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getDaysUntilExpiry = () => {
    const consentDate = new Date(settings.consentTimestamp);
    const expiryDate = new Date(consentDate.getTime() + (settings.dataRetentionDays * 24 * 60 * 60 * 1000));
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Keystroke Recording Status</span>
            </CardTitle>
            <Badge variant={settings.recordingEnabled ? "default" : "secondary"}>
              {settings.recordingEnabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Privacy Level</h4>
              <Badge variant="outline">
                {settings.privacyLevel.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data Retention</h4>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{settings.dataRetentionDays} days</span>
                <Badge variant="outline" className="text-xs">
                  {getDaysUntilExpiry()} days left
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <strong>Consent given:</strong> {formatDate(new Date(settings.consentTimestamp))}
            <br />
            <strong>Digital signature:</strong> {settings.studentSignature}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Privacy Level</h4>
            <div className="space-y-3">
              {[
                { level: 'metadata_only', label: 'Statistics Only', description: 'Only basic metrics' },
                { level: 'anonymized', label: 'Anonymous Patterns', description: 'Patterns without personal data' },
                { level: 'full', label: 'Complete Recording', description: 'Full keystroke data' }
              ].map(({ level, label, description }) => (
                <div key={level} className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id={level}
                    name="privacyLevel"
                    checked={settings.privacyLevel === level}
                    onChange={() => handleSettingChange('privacyLevel', level)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor={level} className="cursor-pointer">
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-gray-600">{description}</div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Data Retention Period</h4>
            <select
              value={settings.dataRetentionDays}
              onChange={(e) => handleSettingChange('dataRetentionDays', Number(e.target.value))}
              className="border rounded px-3 py-2"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
            </select>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Access Controls</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium">Teacher Review</h5>
                <p className="text-sm text-gray-600">Allow teachers to view anonymized patterns</p>
              </div>
              <Switch
                checked={settings.allowTeacherReview}
                onCheckedChange={(checked) => handleSettingChange('allowTeacherReview', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium">Playback Review</h5>
                <p className="text-sm text-gray-600">Enable keystroke playback (requires full recording)</p>
              </div>
              <Switch
                checked={settings.allowPlaybackReview}
                onCheckedChange={(checked) => handleSettingChange('allowPlaybackReview', checked)}
                disabled={settings.privacyLevel !== 'full'}
              />
            </div>
          </div>

          {isModified && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. Click "Save Settings" to apply them.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={!isModified || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={onRequestDataExport}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export My Data</span>
            </Button>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2 text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete My Data</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete All Keystroke Data</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> This action cannot be undone.
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRequestDataDeletion}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Deleting...' : 'Delete All Data'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800">Withdraw Consent</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            You can withdraw your consent for keystroke recording at any time.
          </p>
          
          <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Withdraw Consent</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw Keystroke Recording Consent</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You are about to withdraw your consent for keystroke recording.
                  </AlertDescription>
                </Alert>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
                    Keep Recording
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleWithdrawConsent}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Withdraw Consent'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
} 