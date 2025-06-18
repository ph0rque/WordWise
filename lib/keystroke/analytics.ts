/**
 * Keystroke Analytics Engine
 * 
 * Provides comprehensive analytics for writing sessions including:
 * - Time-on-task measurements
 * - Writing productivity metrics
 * - Pause pattern analysis
 * - Session quality scoring
 */

export interface KeystrokeEvent {
  id: string;
  key: string;
  code: string;
  type: 'keydown' | 'keyup';
  timestamp: number;
  value?: string;
  cursorPosition?: number;
}

export interface WritingSession {
  id: string;
  userId: string;
  documentId: string;
  startTime: number;
  endTime?: number;
  events: KeystrokeEvent[];
  metadata: {
    documentTitle?: string;
    assignmentType?: string;
    privacyLevel: 'full' | 'anonymized' | 'metadata_only';
  };
}

export interface SessionAnalytics {
  // Basic Metrics
  sessionId: string;
  userId: string;
  documentId: string;
  totalDuration: number; // milliseconds
  activeWritingTime: number; // milliseconds (excluding long pauses)
  
  // Writing Productivity
  totalKeystrokes: number;
  productiveKeystrokes: number; // excluding backspace, delete
  wordsPerMinute: number;
  charactersPerMinute: number;
  
  // Time Analysis
  timeOnTask: number; // active writing time in minutes
  totalPauses: number;
  averagePauseLength: number; // milliseconds
  longestPause: number; // milliseconds
  shortPauses: number; // < 2 seconds
  mediumPauses: number; // 2-10 seconds
  longPauses: number; // > 10 seconds
  
  // Writing Patterns
  burstsOfActivity: WritingBurst[];
  editingRatio: number; // backspace/delete vs productive keys
  revisionPatterns: RevisionPattern[];
  
  // Quality Metrics
  focusScore: number; // 0-100, based on consistency of writing
  productivityScore: number; // 0-100, based on output vs time
  engagementScore: number; // 0-100, based on sustained activity
  
  // Session Characteristics
  sessionType: 'focused' | 'distracted' | 'exploratory' | 'editing';
  peakProductivityPeriod?: TimeRange;
  strugglingPeriods: TimeRange[];
}

export interface WritingBurst {
  startTime: number;
  endTime: number;
  keystrokes: number;
  duration: number;
  averageWPM: number;
}

export interface RevisionPattern {
  timestamp: number;
  type: 'deletion' | 'insertion' | 'replacement';
  length: number;
  context?: string;
}

export interface TimeRange {
  start: number;
  end: number;
  duration: number;
}

export class KeystrokeAnalytics {
  private static readonly PAUSE_THRESHOLD_SHORT = 2000; // 2 seconds
  private static readonly PAUSE_THRESHOLD_MEDIUM = 10000; // 10 seconds
  private static readonly BURST_MIN_DURATION = 5000; // 5 seconds
  private static readonly BURST_MIN_KEYSTROKES = 10;
  private static readonly AVERAGE_WORD_LENGTH = 5; // characters

  /**
   * Analyze a complete writing session
   */
  static analyzeSession(session: WritingSession): SessionAnalytics {
    const events = session.events.sort((a, b) => a.timestamp - b.timestamp);
    
    if (events.length === 0) {
      return this.createEmptyAnalytics(session);
    }

    const basicMetrics = this.calculateBasicMetrics(events);
    const timeAnalysis = this.analyzeTimePatterns(events);
    const writingPatterns = this.analyzeWritingPatterns(events);
    const qualityMetrics = this.calculateQualityMetrics(events, timeAnalysis);
    
    return {
      sessionId: session.id,
      userId: session.userId,
      documentId: session.documentId,
      ...basicMetrics,
      ...timeAnalysis,
      ...writingPatterns,
      ...qualityMetrics,
      sessionType: this.determineSessionType(basicMetrics, timeAnalysis, writingPatterns),
      peakProductivityPeriod: this.findPeakProductivityPeriod(events),
      strugglingPeriods: this.identifyStrugglingPeriods(events)
    };
  }

  /**
   * Calculate basic session metrics
   */
  private static calculateBasicMetrics(events: KeystrokeEvent[]) {
    const startTime = events[0].timestamp;
    const endTime = events[events.length - 1].timestamp;
    const totalDuration = endTime - startTime;
    
    const productiveKeys = events.filter(e => 
      e.type === 'keydown' && 
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
    );
    
    const totalKeystrokes = events.filter(e => e.type === 'keydown').length;
    const productiveKeystrokes = productiveKeys.length;
    
    // Calculate active writing time (excluding long pauses)
    const activeWritingTime = this.calculateActiveWritingTime(events);
    
    // Calculate WPM and CPM
    const wordsPerMinute = activeWritingTime > 0 ? 
      (productiveKeystrokes / this.AVERAGE_WORD_LENGTH) / (activeWritingTime / 60000) : 0;
    const charactersPerMinute = activeWritingTime > 0 ? 
      productiveKeystrokes / (activeWritingTime / 60000) : 0;
    
    return {
      totalDuration,
      activeWritingTime,
      totalKeystrokes,
      productiveKeystrokes,
      wordsPerMinute: Math.round(wordsPerMinute * 100) / 100,
      charactersPerMinute: Math.round(charactersPerMinute * 100) / 100,
      timeOnTask: Math.round(activeWritingTime / 60000 * 100) / 100 // minutes
    };
  }

  /**
   * Analyze time patterns and pauses
   */
  private static analyzeTimePatterns(events: KeystrokeEvent[]) {
    const pauses: number[] = [];
    
    for (let i = 1; i < events.length; i++) {
      const pauseLength = events[i].timestamp - events[i - 1].timestamp;
      if (pauseLength > 100) { // Ignore very short gaps
        pauses.push(pauseLength);
      }
    }
    
    const shortPauses = pauses.filter(p => p < this.PAUSE_THRESHOLD_SHORT).length;
    const mediumPauses = pauses.filter(p => 
      p >= this.PAUSE_THRESHOLD_SHORT && p < this.PAUSE_THRESHOLD_MEDIUM
    ).length;
    const longPauses = pauses.filter(p => p >= this.PAUSE_THRESHOLD_MEDIUM).length;
    
    const averagePauseLength = pauses.length > 0 ? 
      pauses.reduce((sum, p) => sum + p, 0) / pauses.length : 0;
    const longestPause = pauses.length > 0 ? Math.max(...pauses) : 0;
    
    return {
      totalPauses: pauses.length,
      averagePauseLength: Math.round(averagePauseLength),
      longestPause,
      shortPauses,
      mediumPauses,
      longPauses
    };
  }

  /**
   * Analyze writing patterns and behaviors
   */
  private static analyzeWritingPatterns(events: KeystrokeEvent[]) {
    const burstsOfActivity = this.identifyWritingBursts(events);
    const revisionPatterns = this.analyzeRevisionPatterns(events);
    
    const editingKeys = events.filter(e => 
      e.type === 'keydown' && ['Backspace', 'Delete'].includes(e.key)
    ).length;
    const productiveKeys = events.filter(e => 
      e.type === 'keydown' && 
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
    ).length;
    
    const editingRatio = productiveKeys > 0 ? editingKeys / productiveKeys : 0;
    
    return {
      burstsOfActivity,
      revisionPatterns,
      editingRatio: Math.round(editingRatio * 100) / 100
    };
  }

  /**
   * Calculate quality and engagement metrics
   */
  private static calculateQualityMetrics(events: KeystrokeEvent[], timeAnalysis: any) {
    // Focus Score: Based on consistency of writing (fewer long pauses = higher focus)
    const focusScore = Math.max(0, 100 - (timeAnalysis.longPauses * 10));
    
    // Productivity Score: Based on keystrokes per minute vs expected rate
    const expectedWPM = 30; // Average typing speed for students
    const actualWPM = timeAnalysis.totalDuration > 0 ? 
      (events.filter(e => e.type === 'keydown').length / 5) / (timeAnalysis.totalDuration / 60000) : 0;
    const productivityScore = Math.min(100, (actualWPM / expectedWPM) * 100);
    
    // Engagement Score: Based on sustained activity and active writing time
    const engagementRatio = timeAnalysis.totalDuration > 0 ? 
      timeAnalysis.activeWritingTime / timeAnalysis.totalDuration : 0;
    const engagementScore = engagementRatio * 100;
    
    return {
      focusScore: Math.round(focusScore),
      productivityScore: Math.round(productivityScore),
      engagementScore: Math.round(engagementScore)
    };
  }

  /**
   * Calculate active writing time (excluding long pauses)
   */
  private static calculateActiveWritingTime(events: KeystrokeEvent[]): number {
    let activeTime = 0;
    
    for (let i = 1; i < events.length; i++) {
      const gap = events[i].timestamp - events[i - 1].timestamp;
      if (gap < this.PAUSE_THRESHOLD_MEDIUM) {
        activeTime += gap;
      }
    }
    
    return activeTime;
  }

  /**
   * Identify periods of sustained writing activity
   */
  private static identifyWritingBursts(events: KeystrokeEvent[]): WritingBurst[] {
    const bursts: WritingBurst[] = [];
    let currentBurst: Partial<WritingBurst> | null = null;
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const nextEvent = events[i + 1];
      
      if (event.type === 'keydown') {
        if (!currentBurst) {
          currentBurst = {
            startTime: event.timestamp,
            keystrokes: 1
          };
        } else {
          currentBurst.keystrokes = (currentBurst.keystrokes || 0) + 1;
        }
        
        // Check if burst should end
        if (nextEvent) {
          const gap = nextEvent.timestamp - event.timestamp;
          if (gap > this.PAUSE_THRESHOLD_SHORT) {
            // End current burst
            if (currentBurst && currentBurst.startTime) {
              const duration = event.timestamp - currentBurst.startTime;
              if (duration >= this.BURST_MIN_DURATION && 
                  (currentBurst.keystrokes || 0) >= this.BURST_MIN_KEYSTROKES) {
                bursts.push({
                  startTime: currentBurst.startTime,
                  endTime: event.timestamp,
                  keystrokes: currentBurst.keystrokes || 0,
                  duration,
                  averageWPM: ((currentBurst.keystrokes || 0) / 5) / (duration / 60000)
                });
              }
            }
            currentBurst = null;
          }
        }
      }
    }
    
    return bursts;
  }

  /**
   * Analyze revision and editing patterns
   */
  private static analyzeRevisionPatterns(events: KeystrokeEvent[]): RevisionPattern[] {
    const patterns: RevisionPattern[] = [];
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      if (event.type === 'keydown' && ['Backspace', 'Delete'].includes(event.key)) {
        // Count consecutive deletions
        let deletionCount = 1;
        let j = i + 1;
        
        while (j < events.length && 
               events[j].type === 'keydown' && 
               ['Backspace', 'Delete'].includes(events[j].key)) {
          deletionCount++;
          j++;
        }
        
        patterns.push({
          timestamp: event.timestamp,
          type: 'deletion',
          length: deletionCount
        });
        
        i = j - 1; // Skip processed events
      }
    }
    
    return patterns;
  }

  /**
   * Determine the overall session type based on patterns
   */
  private static determineSessionType(
    basicMetrics: any, 
    timeAnalysis: any, 
    writingPatterns: any
  ): 'focused' | 'distracted' | 'exploratory' | 'editing' {
    // High editing ratio suggests editing session
    if (writingPatterns.editingRatio > 0.3) {
      return 'editing';
    }
    
    // Many long pauses suggest distracted session
    if (timeAnalysis.longPauses > 5) {
      return 'distracted';
    }
    
    // Low productivity with many pauses suggests exploratory
    if (basicMetrics.wordsPerMinute < 15 && timeAnalysis.totalPauses > 20) {
      return 'exploratory';
    }
    
    // Default to focused for consistent writing
    return 'focused';
  }

  /**
   * Find the period of highest productivity
   */
  private static findPeakProductivityPeriod(events: KeystrokeEvent[]): TimeRange | undefined {
    if (events.length < 10) return undefined;
    
    const windowSize = 60000; // 1 minute windows
    let maxKeystrokes = 0;
    let peakPeriod: TimeRange | undefined;
    
    for (let i = 0; i < events.length - 1; i++) {
      const windowStart = events[i].timestamp;
      const windowEnd = windowStart + windowSize;
      
      const keystrokesInWindow = events.filter(e => 
        e.timestamp >= windowStart && 
        e.timestamp <= windowEnd && 
        e.type === 'keydown'
      ).length;
      
      if (keystrokesInWindow > maxKeystrokes) {
        maxKeystrokes = keystrokesInWindow;
        peakPeriod = {
          start: windowStart,
          end: windowEnd,
          duration: windowSize
        };
      }
    }
    
    return peakPeriod;
  }

  /**
   * Identify periods where the student was struggling
   */
  private static identifyStrugglingPeriods(events: KeystrokeEvent[]): TimeRange[] {
    const strugglingPeriods: TimeRange[] = [];
    const windowSize = 120000; // 2 minute windows
    
    for (let i = 0; i < events.length - 1; i++) {
      const windowStart = events[i].timestamp;
      const windowEnd = windowStart + windowSize;
      
      const windowEvents = events.filter(e => 
        e.timestamp >= windowStart && e.timestamp <= windowEnd
      );
      
      if (windowEvents.length > 0) {
        const deletions = windowEvents.filter(e => 
          e.type === 'keydown' && ['Backspace', 'Delete'].includes(e.key)
        ).length;
        const productive = windowEvents.filter(e => 
          e.type === 'keydown' && 
          !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
        ).length;
        
        // High deletion ratio indicates struggling
        if (productive > 0 && (deletions / productive) > 0.5) {
          strugglingPeriods.push({
            start: windowStart,
            end: windowEnd,
            duration: windowSize
          });
        }
      }
    }
    
    return strugglingPeriods;
  }

  /**
   * Create empty analytics for sessions with no events
   */
  private static createEmptyAnalytics(session: WritingSession): SessionAnalytics {
    return {
      sessionId: session.id,
      userId: session.userId,
      documentId: session.documentId,
      totalDuration: 0,
      activeWritingTime: 0,
      totalKeystrokes: 0,
      productiveKeystrokes: 0,
      wordsPerMinute: 0,
      charactersPerMinute: 0,
      timeOnTask: 0,
      totalPauses: 0,
      averagePauseLength: 0,
      longestPause: 0,
      shortPauses: 0,
      mediumPauses: 0,
      longPauses: 0,
      burstsOfActivity: [],
      editingRatio: 0,
      revisionPatterns: [],
      focusScore: 0,
      productivityScore: 0,
      engagementScore: 0,
      sessionType: 'exploratory',
      strugglingPeriods: []
    };
  }

  /**
   * Generate summary analytics for multiple sessions
   */
  static generateSessionSummary(analytics: SessionAnalytics[]): {
    totalSessions: number;
    totalTimeOnTask: number;
    averageWPM: number;
    averageFocusScore: number;
    averageProductivityScore: number;
    averageEngagementScore: number;
    sessionTypeDistribution: Record<string, number>;
    improvementTrend: 'improving' | 'stable' | 'declining';
  } {
    if (analytics.length === 0) {
      return {
        totalSessions: 0,
        totalTimeOnTask: 0,
        averageWPM: 0,
        averageFocusScore: 0,
        averageProductivityScore: 0,
        averageEngagementScore: 0,
        sessionTypeDistribution: {},
        improvementTrend: 'stable'
      };
    }

    const totalTimeOnTask = analytics.reduce((sum, a) => sum + a.timeOnTask, 0);
    const averageWPM = analytics.reduce((sum, a) => sum + a.wordsPerMinute, 0) / analytics.length;
    const averageFocusScore = analytics.reduce((sum, a) => sum + a.focusScore, 0) / analytics.length;
    const averageProductivityScore = analytics.reduce((sum, a) => sum + a.productivityScore, 0) / analytics.length;
    const averageEngagementScore = analytics.reduce((sum, a) => sum + a.engagementScore, 0) / analytics.length;

    // Session type distribution
    const sessionTypeDistribution: Record<string, number> = {};
    analytics.forEach(a => {
      sessionTypeDistribution[a.sessionType] = (sessionTypeDistribution[a.sessionType] || 0) + 1;
    });

    // Improvement trend (compare first half vs second half)
    let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (analytics.length >= 4) {
      const midPoint = Math.floor(analytics.length / 2);
      const firstHalf = analytics.slice(0, midPoint);
      const secondHalf = analytics.slice(midPoint);
      
      const firstHalfAvgScore = firstHalf.reduce((sum, a) => 
        sum + (a.focusScore + a.productivityScore + a.engagementScore) / 3, 0
      ) / firstHalf.length;
      
      const secondHalfAvgScore = secondHalf.reduce((sum, a) => 
        sum + (a.focusScore + a.productivityScore + a.engagementScore) / 3, 0
      ) / secondHalf.length;
      
      const improvement = secondHalfAvgScore - firstHalfAvgScore;
      if (improvement > 5) improvementTrend = 'improving';
      else if (improvement < -5) improvementTrend = 'declining';
    }

    return {
      totalSessions: analytics.length,
      totalTimeOnTask: Math.round(totalTimeOnTask * 100) / 100,
      averageWPM: Math.round(averageWPM * 100) / 100,
      averageFocusScore: Math.round(averageFocusScore),
      averageProductivityScore: Math.round(averageProductivityScore),
      averageEngagementScore: Math.round(averageEngagementScore),
      sessionTypeDistribution,
      improvementTrend
    };
  }
}

export default KeystrokeAnalytics; 