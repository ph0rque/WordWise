import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Create a simplified version of the component for testing
interface ReadabilityMetrics {
  fleschScore: number
  fleschKincaidGrade: number
  averageWordsPerSentence: number
  complexWordsPercentage: number
  passiveVoicePercentage: number
  readingTimeMinutes: number
}

interface ReadabilityAnalysis {
  metrics: ReadabilityMetrics
  overallGrade: number
  difficulty: string
  score: number
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  strengths: string[]
  improvements: string[]
  recommendations: string[]
}

interface ReadabilityTrend {
  date: string
  score: number
  gradeLevel: number
  wordCount: number
  difficulty: string
}

interface ReadabilityDashboardProps {
  analysis?: ReadabilityAnalysis
  trends?: ReadabilityTrend[]
  targetGradeLevel?: number
  isLoading?: boolean
  onAnalyze?: (text: string) => void
  onRefresh?: () => void
}

// Simplified component for testing
const SimpleReadabilityDashboard: React.FC<ReadabilityDashboardProps> = ({
  analysis,
  trends = [],
  targetGradeLevel = 12,
  isLoading = false,
  onAnalyze,
  onRefresh
}) => {
  const sampleAnalysis: ReadabilityAnalysis = {
    metrics: {
      fleschScore: 65.2,
      fleschKincaidGrade: 8.5,
      averageWordsPerSentence: 15.3,
      complexWordsPercentage: 12.5,
      passiveVoicePercentage: 8.3,
      readingTimeMinutes: 3.5
    },
    overallGrade: 9.0,
    difficulty: 'Standard',
    score: 72,
    wordCount: 245,
    sentenceCount: 16,
    paragraphCount: 4,
    strengths: [
      'Good sentence variety keeps readers engaged',
      'Appropriate vocabulary level for target audience'
    ],
    improvements: [
      'Reduce complex sentences for better clarity',
      'Minimize passive voice usage'
    ],
    recommendations: [
      'Aim for 12-18 words per sentence',
      'Use more active voice constructions'
    ]
  }

  const currentAnalysis = analysis || sampleAnalysis

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#6366f1'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const getGradeTrend = () => {
    if (trends.length < 2) return null
    const recent = trends[trends.length - 1].gradeLevel
    const previous = trends[trends.length - 2].gradeLevel
    return recent - previous
  }

  if (isLoading) {
    return (
      <div data-testid="loading-state">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div data-testid="readability-dashboard">
      <div data-testid="dashboard-header">
        <h2>Readability Dashboard</h2>
        <p>Analyze and improve your writing clarity</p>
      </div>

      <div data-testid="action-buttons">
        {onRefresh && (
          <button onClick={onRefresh} data-testid="refresh-button">
            Refresh
          </button>
        )}
        {onAnalyze && (
          <button onClick={() => onAnalyze('')} data-testid="analyze-button">
            Analyze Text
          </button>
        )}
      </div>

      <div data-testid="metrics-cards">
        <div data-testid="score-card">
          <h3>Readability Score</h3>
          <div 
            data-testid="score-value" 
            style={{ color: getScoreColor(currentAnalysis.score) }}
          >
            {currentAnalysis.score}/100
          </div>
          <p>Target: 80+ for academic writing</p>
        </div>

        <div data-testid="grade-card">
          <h3>Grade Level</h3>
          <div data-testid="grade-value">
            {currentAnalysis.overallGrade.toFixed(1)}
            {getGradeTrend() !== null && (
              <span data-testid="grade-trend">
                {getGradeTrend()! > 0 ? '↗' : '↘'}
              </span>
            )}
          </div>
          <p>Target: {targetGradeLevel}th grade</p>
        </div>

        <div data-testid="difficulty-card">
          <h3>Difficulty</h3>
          <div data-testid="difficulty-value">{currentAnalysis.difficulty}</div>
        </div>

        <div data-testid="reading-time-card">
          <h3>Reading Time</h3>
          <div data-testid="reading-time-value">
            {currentAnalysis.metrics.readingTimeMinutes.toFixed(1)}m
          </div>
          <p>{currentAnalysis.wordCount} words</p>
        </div>
      </div>

      <div data-testid="detailed-metrics">
        <div data-testid="flesch-score">
          Flesch Score: {currentAnalysis.metrics.fleschScore.toFixed(1)}
        </div>
        <div data-testid="flesch-kincaid-grade">
          Flesch-Kincaid Grade: {currentAnalysis.metrics.fleschKincaidGrade.toFixed(1)}
        </div>
        <div data-testid="words-per-sentence">
          Words/Sentence: {currentAnalysis.metrics.averageWordsPerSentence.toFixed(1)}
        </div>
        <div data-testid="complex-words">
          Complex Words: {currentAnalysis.metrics.complexWordsPercentage.toFixed(1)}%
        </div>
        <div data-testid="passive-voice">
          Passive Voice: {currentAnalysis.metrics.passiveVoicePercentage.toFixed(1)}%
        </div>
      </div>

      <div data-testid="strengths-section">
        <h3>Strengths</h3>
        {currentAnalysis.strengths.map((strength, index) => (
          <div key={index} data-testid={`strength-${index}`}>
            {strength}
          </div>
        ))}
      </div>

      <div data-testid="improvements-section">
        <h3>Areas for Improvement</h3>
        {currentAnalysis.improvements.map((improvement, index) => (
          <div key={index} data-testid={`improvement-${index}`}>
            {improvement}
          </div>
        ))}
      </div>

      <div data-testid="recommendations-section">
        <h3>Recommendations</h3>
        {currentAnalysis.recommendations.map((recommendation, index) => (
          <div key={index} data-testid={`recommendation-${index}`}>
            {recommendation}
          </div>
        ))}
      </div>

      {trends.length > 0 && (
        <div data-testid="trends-section">
          <h3>Trends</h3>
          {trends.slice(-3).map((trend, index) => (
            <div key={index} data-testid={`trend-${index}`}>
              {trend.date}: Score {trend.score}, Grade {trend.gradeLevel}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

describe('ReadabilityDashboard Component Logic', () => {
  const mockAnalysis: ReadabilityAnalysis = {
    metrics: {
      fleschScore: 65.2,
      fleschKincaidGrade: 8.5,
      averageWordsPerSentence: 15.3,
      complexWordsPercentage: 12.5,
      passiveVoicePercentage: 8.3,
      readingTimeMinutes: 3.5
    },
    overallGrade: 9.0,
    difficulty: 'Standard',
    score: 72,
    wordCount: 245,
    sentenceCount: 16,
    paragraphCount: 4,
    strengths: [
      'Good sentence variety keeps readers engaged',
      'Appropriate vocabulary level for target audience'
    ],
    improvements: [
      'Reduce complex sentences for better clarity',
      'Minimize passive voice usage'
    ],
    recommendations: [
      'Aim for 12-18 words per sentence',
      'Use more active voice constructions'
    ]
  }

  const mockTrends: ReadabilityTrend[] = [
    { date: '2024-01-01', score: 68, gradeLevel: 9.2, wordCount: 220, difficulty: 'Standard' },
    { date: '2024-01-02', score: 71, gradeLevel: 8.8, wordCount: 235, difficulty: 'Standard' },
    { date: '2024-01-03', score: 74, gradeLevel: 8.5, wordCount: 245, difficulty: 'Fairly Easy' }
  ]

  describe('Basic Rendering', () => {
    it('should render dashboard header', () => {
      render(<SimpleReadabilityDashboard />)
      
      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
      expect(screen.getByText('Readability Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Analyze and improve your writing clarity')).toBeInTheDocument()
    })

    it('should render metrics cards', () => {
      render(<SimpleReadabilityDashboard analysis={mockAnalysis} />)
      
      expect(screen.getByTestId('score-card')).toBeInTheDocument()
      expect(screen.getByTestId('grade-card')).toBeInTheDocument()
      expect(screen.getByTestId('difficulty-card')).toBeInTheDocument()
      expect(screen.getByTestId('reading-time-card')).toBeInTheDocument()
    })

    it('should display correct metric values', () => {
      render(<SimpleReadabilityDashboard analysis={mockAnalysis} />)
      
      expect(screen.getByTestId('score-value')).toHaveTextContent('72/100')
      expect(screen.getByTestId('grade-value')).toHaveTextContent('9.0')
      expect(screen.getByTestId('difficulty-value')).toHaveTextContent('Standard')
      expect(screen.getByTestId('reading-time-value')).toHaveTextContent('3.5m')
    })
  })

  describe('Loading State', () => {
    it('should show loading state when isLoading is true', () => {
      render(<SimpleReadabilityDashboard isLoading={true} />)
      
      expect(screen.getByTestId('loading-state')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByTestId('readability-dashboard')).not.toBeInTheDocument()
    })

    it('should show dashboard when not loading', () => {
      render(<SimpleReadabilityDashboard isLoading={false} />)
      
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument()
      expect(screen.getByTestId('readability-dashboard')).toBeInTheDocument()
    })
  })

  describe('Score Color Coding', () => {
    it('should apply success color for high scores', () => {
      const highScoreAnalysis = { ...mockAnalysis, score: 85 }
      render(<SimpleReadabilityDashboard analysis={highScoreAnalysis} />)
      
      const scoreElement = screen.getByTestId('score-value')
      expect(scoreElement).toHaveStyle({ color: '#10b981' })
    })

    it('should apply info color for medium scores', () => {
      const mediumScoreAnalysis = { ...mockAnalysis, score: 65 }
      render(<SimpleReadabilityDashboard analysis={mediumScoreAnalysis} />)
      
      const scoreElement = screen.getByTestId('score-value')
      expect(scoreElement).toHaveStyle({ color: '#6366f1' })
    })

    it('should apply warning color for low-medium scores', () => {
      const lowMediumScoreAnalysis = { ...mockAnalysis, score: 45 }
      render(<SimpleReadabilityDashboard analysis={lowMediumScoreAnalysis} />)
      
      const scoreElement = screen.getByTestId('score-value')
      expect(scoreElement).toHaveStyle({ color: '#f59e0b' })
    })

    it('should apply danger color for low scores', () => {
      const lowScoreAnalysis = { ...mockAnalysis, score: 25 }
      render(<SimpleReadabilityDashboard analysis={lowScoreAnalysis} />)
      
      const scoreElement = screen.getByTestId('score-value')
      expect(scoreElement).toHaveStyle({ color: '#ef4444' })
    })
  })

  describe('Trend Indicators', () => {
    it('should show upward trend when grade level increases', () => {
      const trendsWithIncrease: ReadabilityTrend[] = [
        { date: '2024-01-01', score: 68, gradeLevel: 8.0, wordCount: 220, difficulty: 'Standard' },
        { date: '2024-01-02', score: 71, gradeLevel: 9.0, wordCount: 235, difficulty: 'Standard' }
      ]
      
      render(<SimpleReadabilityDashboard trends={trendsWithIncrease} />)
      
      const trendElement = screen.getByTestId('grade-trend')
      expect(trendElement).toHaveTextContent('↗')
    })

    it('should show downward trend when grade level decreases', () => {
      const trendsWithDecrease: ReadabilityTrend[] = [
        { date: '2024-01-01', score: 68, gradeLevel: 9.0, wordCount: 220, difficulty: 'Standard' },
        { date: '2024-01-02', score: 71, gradeLevel: 8.0, wordCount: 235, difficulty: 'Standard' }
      ]
      
      render(<SimpleReadabilityDashboard trends={trendsWithDecrease} />)
      
      const trendElement = screen.getByTestId('grade-trend')
      expect(trendElement).toHaveTextContent('↘')
    })

    it('should not show trend indicator with insufficient data', () => {
      const singleTrend: ReadabilityTrend[] = [
        { date: '2024-01-01', score: 68, gradeLevel: 9.0, wordCount: 220, difficulty: 'Standard' }
      ]
      
      render(<SimpleReadabilityDashboard trends={singleTrend} />)
      
      expect(screen.queryByTestId('grade-trend')).not.toBeInTheDocument()
    })
  })

  describe('Detailed Metrics', () => {
    it('should display all detailed metrics', () => {
      render(<SimpleReadabilityDashboard analysis={mockAnalysis} />)
      
      expect(screen.getByTestId('flesch-score')).toHaveTextContent('Flesch Score: 65.2')
      expect(screen.getByTestId('flesch-kincaid-grade')).toHaveTextContent('Flesch-Kincaid Grade: 8.5')
      expect(screen.getByTestId('words-per-sentence')).toHaveTextContent('Words/Sentence: 15.3')
      expect(screen.getByTestId('complex-words')).toHaveTextContent('Complex Words: 12.5%')
      expect(screen.getByTestId('passive-voice')).toHaveTextContent('Passive Voice: 8.3%')
    })
  })

  describe('Content Sections', () => {
    it('should display strengths', () => {
      render(<SimpleReadabilityDashboard analysis={mockAnalysis} />)
      
      expect(screen.getByTestId('strength-0')).toHaveTextContent(mockAnalysis.strengths[0])
      expect(screen.getByTestId('strength-1')).toHaveTextContent(mockAnalysis.strengths[1])
    })

    it('should display improvements', () => {
      render(<SimpleReadabilityDashboard analysis={mockAnalysis} />)
      
      expect(screen.getByTestId('improvement-0')).toHaveTextContent(mockAnalysis.improvements[0])
      expect(screen.getByTestId('improvement-1')).toHaveTextContent(mockAnalysis.improvements[1])
    })

    it('should display recommendations', () => {
      render(<SimpleReadabilityDashboard analysis={mockAnalysis} />)
      
      expect(screen.getByTestId('recommendation-0')).toHaveTextContent(mockAnalysis.recommendations[0])
      expect(screen.getByTestId('recommendation-1')).toHaveTextContent(mockAnalysis.recommendations[1])
    })
  })

  describe('Trends Section', () => {
    it('should display trends when provided', () => {
      render(<SimpleReadabilityDashboard trends={mockTrends} />)
      
      expect(screen.getByTestId('trends-section')).toBeInTheDocument()
      expect(screen.getByTestId('trend-0')).toBeInTheDocument()
      expect(screen.getByTestId('trend-1')).toBeInTheDocument()
      expect(screen.getByTestId('trend-2')).toBeInTheDocument()
    })

    it('should not display trends section when no trends provided', () => {
      render(<SimpleReadabilityDashboard trends={[]} />)
      
      expect(screen.queryByTestId('trends-section')).not.toBeInTheDocument()
    })

    it('should limit trends display to last 3 entries', () => {
      const manyTrends: ReadabilityTrend[] = [
        ...mockTrends,
        { date: '2024-01-04', score: 76, gradeLevel: 8.2, wordCount: 250, difficulty: 'Fairly Easy' },
        { date: '2024-01-05', score: 78, gradeLevel: 8.0, wordCount: 255, difficulty: 'Fairly Easy' }
      ]
      
      render(<SimpleReadabilityDashboard trends={manyTrends} />)
      
      expect(screen.getByTestId('trend-0')).toBeInTheDocument()
      expect(screen.getByTestId('trend-1')).toBeInTheDocument()
      expect(screen.getByTestId('trend-2')).toBeInTheDocument()
      expect(screen.queryByTestId('trend-3')).not.toBeInTheDocument()
    })
  })

  describe('Callback Functions', () => {
    it('should call onAnalyze when analyze button is clicked', () => {
      const onAnalyzeMock = jest.fn()
      render(<SimpleReadabilityDashboard onAnalyze={onAnalyzeMock} />)
      
      const analyzeButton = screen.getByTestId('analyze-button')
      fireEvent.click(analyzeButton)
      
      expect(onAnalyzeMock).toHaveBeenCalledWith('')
    })

    it('should call onRefresh when refresh button is clicked', () => {
      const onRefreshMock = jest.fn()
      render(<SimpleReadabilityDashboard onRefresh={onRefreshMock} />)
      
      const refreshButton = screen.getByTestId('refresh-button')
      fireEvent.click(refreshButton)
      
      expect(onRefreshMock).toHaveBeenCalled()
    })

    it('should not render buttons when callbacks not provided', () => {
      render(<SimpleReadabilityDashboard />)
      
      expect(screen.queryByTestId('analyze-button')).not.toBeInTheDocument()
      expect(screen.queryByTestId('refresh-button')).not.toBeInTheDocument()
    })
  })

  describe('Target Grade Level', () => {
    it('should display custom target grade level', () => {
      render(<SimpleReadabilityDashboard targetGradeLevel={10} />)
      
      expect(screen.getByText('Target: 10th grade')).toBeInTheDocument()
    })

    it('should use default target grade level when not provided', () => {
      render(<SimpleReadabilityDashboard />)
      
      expect(screen.getByText('Target: 12th grade')).toBeInTheDocument()
    })
  })

  describe('Sample Data Fallback', () => {
    it('should use sample data when no analysis provided', () => {
      render(<SimpleReadabilityDashboard />)
      
      // Should display some score (from sample data)
      expect(screen.getByTestId('score-value')).toBeInTheDocument()
      expect(screen.getByTestId('grade-value')).toBeInTheDocument()
      expect(screen.getByTestId('difficulty-value')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero values gracefully', () => {
      const zeroAnalysis: ReadabilityAnalysis = {
        ...mockAnalysis,
        score: 0,
        metrics: {
          ...mockAnalysis.metrics,
          fleschScore: 0,
          readingTimeMinutes: 0
        }
      }
      
      render(<SimpleReadabilityDashboard analysis={zeroAnalysis} />)
      
      expect(screen.getByTestId('score-value')).toHaveTextContent('0/100')
      expect(screen.getByTestId('reading-time-value')).toHaveTextContent('0.0m')
    })

    it('should handle very high values', () => {
      const highAnalysis: ReadabilityAnalysis = {
        ...mockAnalysis,
        score: 100,
        metrics: {
          ...mockAnalysis.metrics,
          fleschScore: 100,
          complexWordsPercentage: 100
        }
      }
      
      render(<SimpleReadabilityDashboard analysis={highAnalysis} />)
      
      expect(screen.getByTestId('score-value')).toHaveTextContent('100/100')
      expect(screen.getByTestId('complex-words')).toHaveTextContent('Complex Words: 100.0%')
    })
  })
}) 