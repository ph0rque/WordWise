'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Download, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Calendar,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { RetentionPolicy, RetentionStatus, DataHandlingLog } from '@/lib/keystroke/data-retention';

interface DataRetentionPanelProps {
  userId: string;
  recordingIds?: string[];
  className?: string;
}

interface ExportRequest {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: 'json' | 'csv' | 'pdf';
  createdAt: Date;
  downloadUrl?: string;
}

interface DeletionRequest {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  confirmationRequired: boolean;
  confirmationCode?: string;
  createdAt: Date;
}

export default function DataRetentionPanel({ 
  userId, 
  recordingIds = [],
  className = '' 
}: DataRetentionPanelProps) {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [retentionStatus, setRetentionStatus] = useState<RetentionStatus[]>([]);
  const [logs, setLogs] = useState<DataHandlingLog[]>([]);
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [selectedRecordings, setSelectedRecordings] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load policies
      const policiesResponse = await fetch('/api/keystroke/data-retention?action=policies');
      const policiesData = await policiesResponse.json();
      if (policiesData.success) {
        setPolicies(policiesData.policies);
      }

      // Load retention status for recordings
      if (recordingIds.length > 0) {
        const statusPromises = recordingIds.map(async (recordingId) => {
          const response = await fetch(`/api/keystroke/data-retention?action=status&recordingId=${recordingId}`);
          const data = await response.json();
          return data.success ? data.status : null;
        });
        
        const statuses = await Promise.all(statusPromises);
        setRetentionStatus(statuses.filter(Boolean));
      }

      // Load data handling logs
      const logsResponse = await fetch(`/api/keystroke/data-retention?action=logs&userId=${userId}`);
      const logsData = await logsResponse.json();
      if (logsData.success) {
        setLogs(logsData.logs);
      }

    } catch (error) {
      console.error('Error loading data retention info:', error);
      setError('Failed to load data retention information');
    } finally {
      setLoading(false);
    }
  };

  const handleExportRequest = async () => {
    try {
      const response = await fetch('/api/keystroke/data-retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export',
          userId,
          requestedBy: userId,
          recordingIds: selectedRecordings.length > 0 ? selectedRecordings : recordingIds,
          format: exportFormat
        })
      });

      const data = await response.json();
      if (data.success) {
        // Add to export requests list
        setExportRequests(prev => [...prev, {
          id: data.exportRequest.id,
          status: data.exportRequest.status,
          format: data.exportRequest.format,
          createdAt: new Date(data.exportRequest.createdAt),
          downloadUrl: data.exportRequest.downloadUrl
        }]);
        
        alert('Export request submitted successfully!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Export request failed:', error);
      alert('Failed to submit export request');
    }
  };

  const handleDeletionRequest = async () => {
    if (!confirm('Are you sure you want to request deletion of your data? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/keystroke/data-retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          userId,
          requestedBy: userId,
          recordingIds: selectedRecordings.length > 0 ? selectedRecordings : recordingIds,
          reason: 'user_request'
        })
      });

      const data = await response.json();
      if (data.success) {
        setDeletionRequests(prev => [...prev, {
          id: data.deletionRequest.id,
          status: data.deletionRequest.status,
          confirmationRequired: data.deletionRequest.confirmationRequired,
          confirmationCode: data.deletionRequest.confirmationCode,
          createdAt: new Date(data.deletionRequest.createdAt)
        }]);
        
        alert('Deletion request submitted. Check your email for confirmation instructions.');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Deletion request failed:', error);
      alert('Failed to submit deletion request');
    }
  };

  const handleConfirmDeletion = async (requestId: string) => {
    if (!confirmationCode) {
      alert('Please enter the confirmation code');
      return;
    }

    try {
      const response = await fetch('/api/keystroke/data-retention', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm-deletion',
          requestId,
          confirmationCode
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Deletion confirmed and will be processed');
        setConfirmationCode('');
        loadData(); // Refresh data
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Deletion confirmation failed:', error);
      alert('Failed to confirm deletion');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'grace_period':
        return 'bg-orange-100 text-orange-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'grace_period':
        return <AlertTriangle className="h-4 w-4" />;
      case 'expired':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data retention information...</p>
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
              <p className="font-medium">Error loading data retention information</p>
              <p className="text-sm mt-1">{error}</p>
              <Button variant="outline" size="sm" onClick={loadData} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Data Retention & Privacy
          </h2>
          <p className="text-gray-600 mt-1">
            Manage your data retention settings and privacy controls
          </p>
        </div>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="logs">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Retention Status
              </CardTitle>
              <CardDescription>
                Current retention status for your keystroke recordings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {retentionStatus.length > 0 ? (
                <div className="space-y-4">
                  {retentionStatus.map((status, index) => (
                    <div key={status.recordingId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">Recording {index + 1}</span>
                        <Badge className={getStatusColor(status.status)}>
                          {getStatusIcon(status.status)}
                          <span className="ml-1 capitalize">{status.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Created</span>
                          <div className="font-medium">{formatDate(status.createdAt)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Days Remaining</span>
                          <div className="font-medium">{status.daysRemaining}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Policy</span>
                          <div className="font-medium">{status.retentionPolicy.name}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Auto Delete</span>
                          <div className="font-medium">
                            {status.retentionPolicy.autoDelete ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>

                      {status.scheduledDeletionDate && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <AlertTriangle className="h-4 w-4 inline mr-2 text-yellow-600" />
                          Scheduled for deletion: {formatDate(status.scheduledDeletionDate)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  No recordings found or no retention data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Retention Policies
              </CardTitle>
              <CardDescription>
                Data retention policies that apply to your recordings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{policy.name}</h4>
                      <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{policy.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Retention Period</span>
                        <div className="font-medium">{Math.floor(policy.retentionPeriodDays / 365)} years</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Warning Period</span>
                        <div className="font-medium">{policy.warningPeriodDays} days</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Grace Period</span>
                        <div className="font-medium">{policy.gracePeriodDays} days</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Auto Delete</span>
                        <div className="font-medium">{policy.autoDelete ? 'Yes' : 'No'}</div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="text-gray-600 text-sm">Applies to: </span>
                      <div className="flex gap-2 mt-1">
                        {policy.privacyLevels.map((level) => (
                          <Badge key={level} variant="outline" className="text-xs">
                            {level.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Data Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Data Export
                </CardTitle>
                <CardDescription>
                  Export your keystroke data for personal use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="export-format">Export Format</Label>
                  <select
                    id="export-format"
                    className="w-full mt-1 p-2 border rounded-md"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF Report</option>
                  </select>
                </div>

                <Button onClick={handleExportRequest} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Request Data Export
                </Button>

                {/* Export Requests List */}
                {exportRequests.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recent Export Requests</h4>
                    {exportRequests.map((request) => (
                      <div key={request.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex justify-between items-center">
                          <span>{request.format.toUpperCase()} export</span>
                          <Badge variant="outline">{request.status}</Badge>
                        </div>
                        <div className="text-gray-600 text-xs mt-1">
                          {formatDate(request.createdAt)}
                        </div>
                        {request.downloadUrl && request.status === 'completed' && (
                          <Button size="sm" variant="outline" className="mt-2">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Deletion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Data Deletion
                </CardTitle>
                <CardDescription>
                  Request permanent deletion of your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                  <AlertTriangle className="h-4 w-4 inline mr-2 text-red-600" />
                  <strong>Warning:</strong> Data deletion is permanent and cannot be undone.
                </div>

                <Button 
                  onClick={handleDeletionRequest} 
                  variant="destructive" 
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Request Data Deletion
                </Button>

                {/* Deletion Requests List */}
                {deletionRequests.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Deletion Requests</h4>
                    {deletionRequests.map((request) => (
                      <div key={request.id} className="p-3 border rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Deletion Request</span>
                          <Badge variant="outline">{request.status}</Badge>
                        </div>
                        
                        <div className="text-gray-600 text-sm mb-2">
                          {formatDate(request.createdAt)}
                        </div>

                        {request.confirmationRequired && request.status === 'pending' && (
                          <div className="space-y-2">
                            <Label htmlFor="confirmation-code">Confirmation Code</Label>
                            <div className="flex gap-2">
                              <Input
                                id="confirmation-code"
                                placeholder="Enter code from email"
                                value={confirmationCode}
                                onChange={(e) => setConfirmationCode(e.target.value)}
                              />
                              <Button 
                                size="sm" 
                                onClick={() => handleConfirmDeletion(request.id)}
                              >
                                Confirm
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Activity Log
              </CardTitle>
              <CardDescription>
                History of data handling activities for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      
                      {log.details && (
                        <p className="text-sm text-gray-600">{log.details}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Recording: {log.recordingId}</span>
                        <span>By: {log.performedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  No activity logs available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 