"use client"

import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignJustify,
  Indent,
  LineHeight,
  FileText,
  CheckCircle,
  AlertTriangle,
  Zap,
  Settings,
  BookOpen,
  Eye,
  Download
} from 'lucide-react'

// Formatting styles and guidelines
type FormatStyle = 'MLA' | 'APA' | 'Chicago' | 'Custom'

interface FormattingGuidelines {
  font: string
  fontSize: string
  lineSpacing: string
  margins: string
  headerFormat: string
  pageNumbers: string
  indentation: string
  alignment: string
}

interface FormattingProps {
  onApplyFormatting?: (formatting: FormattingGuidelines) => void
  currentStyle?: FormatStyle
  className?: string
}

// Academic style guidelines
const styleGuidelines: Record<FormatStyle, FormattingGuidelines> = {
  MLA: {
    font: 'Times New Roman',
    fontSize: '12pt',
    lineSpacing: 'Double',
    margins: '1 inch on all sides',
    headerFormat: 'Last name and page number in top right corner',
    pageNumbers: 'Top right corner with last name',
    indentation: '0.5 inch for first line of paragraphs',
    alignment: 'Left-aligned'
  },
  APA: {
    font: 'Times New Roman',
    fontSize: '12pt',
    lineSpacing: 'Double',
    margins: '1 inch on all sides',
    headerFormat: 'Running head and page number',
    pageNumbers: 'Top right corner',
    indentation: '0.5 inch for first line of paragraphs',
    alignment: 'Left-aligned'
  },
  Chicago: {
    font: 'Times New Roman',
    fontSize: '12pt',
    lineSpacing: 'Double',
    margins: '1 inch on all sides',
    headerFormat: 'Title and page number',
    pageNumbers: 'Top or bottom center',
    indentation: '0.5 inch for first line of paragraphs',
    alignment: 'Left-aligned'
  },
  Custom: {
    font: 'Times New Roman',
    fontSize: '12pt',
    lineSpacing: 'Double',
    margins: '1 inch on all sides',
    headerFormat: 'Custom header format',
    pageNumbers: 'Bottom center',
    indentation: '0.5 inch for first line of paragraphs',
    alignment: 'Left-aligned'
  }
}

// Formatting checklist items
const getFormattingChecklist = (style: FormatStyle) => {
  const common = [
    { id: 'font', label: `Font: ${styleGuidelines[style].font}`, category: 'Typography' },
    { id: 'fontSize', label: `Font Size: ${styleGuidelines[style].fontSize}`, category: 'Typography' },
    { id: 'lineSpacing', label: `Line Spacing: ${styleGuidelines[style].lineSpacing}`, category: 'Spacing' },
    { id: 'margins', label: `Margins: ${styleGuidelines[style].margins}`, category: 'Layout' },
    { id: 'alignment', label: `Text Alignment: ${styleGuidelines[style].alignment}`, category: 'Layout' },
    { id: 'indentation', label: `Paragraph Indentation: ${styleGuidelines[style].indentation}`, category: 'Spacing' }
  ]

  const styleSpecific = {
    MLA: [
      { id: 'header', label: 'Header with last name and page number', category: 'Headers' },
      { id: 'title', label: 'Title centered on first page', category: 'Title' },
      { id: 'worksCited', label: 'Works Cited page with hanging indent', category: 'Citations' }
    ],
    APA: [
      { id: 'runningHead', label: 'Running head on every page', category: 'Headers' },
      { id: 'titlePage', label: 'Separate title page', category: 'Title' },
      { id: 'references', label: 'References page with hanging indent', category: 'Citations' }
    ],
    Chicago: [
      { id: 'pageNumbers', label: 'Page numbers in header or footer', category: 'Headers' },
      { id: 'footnotes', label: 'Footnotes or endnotes for citations', category: 'Citations' },
      { id: 'bibliography', label: 'Bibliography with hanging indent', category: 'Citations' }
    ],
    Custom: []
  }

  return [...common, ...styleSpecific[style]]
}

// Formatting tips and best practices
const formattingTips = {
  general: [
    "Always use consistent formatting throughout your entire document",
    "Check your assignment requirements before choosing a style",
    "Use the 'Show/Hide' formatting marks to see spaces and indents",
    "Set up your formatting before you start writing"
  ],
  MLA: [
    "Your last name and page number should appear on every page",
    "Don't include a separate title page unless specifically requested",
    "Use hanging indent for Works Cited entries",
    "Don't add extra spaces between paragraphs"
  ],
  APA: [
    "Include a running head (shortened title) on every page",
    "The title page should include your paper title, name, and institution",
    "Use hanging indent for reference list entries",
    "Include DOIs or URLs for online sources"
  ],
  Chicago: [
    "Choose between notes-bibliography or author-date system",
    "Use footnotes for citations and additional information",
    "Include page numbers in your citations",
    "Use hanging indent for bibliography entries"
  ]
}

export default function AcademicFormatting({ 
  onApplyFormatting, 
  currentStyle = 'MLA',
  className 
}: FormattingProps) {
  const [selectedStyle, setSelectedStyle] = useState<FormatStyle>(currentStyle)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [showPreview, setShowPreview] = useState(false)

  // Handle checklist item toggle
  const handleCheckItem = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  // Apply formatting
  const handleApplyFormatting = () => {
    const guidelines = styleGuidelines[selectedStyle]
    onApplyFormatting?.(guidelines)
  }

  // Get checklist completion percentage
  const getCompletionPercentage = () => {
    const checklist = getFormattingChecklist(selectedStyle)
    const completedItems = checklist.filter(item => checkedItems[item.id]).length
    return Math.round((completedItems / checklist.length) * 100)
  }

  const checklist = getFormattingChecklist(selectedStyle)
  const completionPercentage = getCompletionPercentage()

  // Group checklist items by category
  const groupedChecklist = checklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof checklist>)

  return (
    <div className={`academic-formatting ${className}`}>
      <Tabs defaultValue="format" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="format">Format Style</TabsTrigger>
          <TabsTrigger value="checklist">
            Checklist {completionPercentage > 0 && `(${completionPercentage}%)`}
          </TabsTrigger>
          <TabsTrigger value="tips">Tips & Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="format" className="space-y-6">
          {/* Style Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Academic Style
              </CardTitle>
              <CardDescription>
                Choose the formatting style required for your assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {(['MLA', 'APA', 'Chicago', 'Custom'] as FormatStyle[]).map(style => (
                  <Card 
                    key={style}
                    className={`cursor-pointer transition-all ${
                      selectedStyle === style ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedStyle(style)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{style}</h3>
                        {selectedStyle === style && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {style === 'MLA' && 'Modern Language Association - Common for English and Humanities'}
                        {style === 'APA' && 'American Psychological Association - Used for Psychology and Sciences'}
                        {style === 'Chicago' && 'Chicago Manual of Style - Used for History and Literature'}
                        {style === 'Custom' && 'Custom formatting based on specific requirements'}
                      </p>
                      <div className="text-xs space-y-1">
                        <div><strong>Font:</strong> {styleGuidelines[style].font}</div>
                        <div><strong>Size:</strong> {styleGuidelines[style].fontSize}</div>
                        <div><strong>Spacing:</strong> {styleGuidelines[style].lineSpacing}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Style Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedStyle} Formatting Guidelines</CardTitle>
              <CardDescription>
                Key formatting requirements for {selectedStyle} style
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(styleGuidelines[selectedStyle]).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="p-1 bg-blue-100 rounded">
                      {key === 'font' && <Type className="h-4 w-4 text-blue-600" />}
                      {key === 'fontSize' && <Type className="h-4 w-4 text-blue-600" />}
                      {key === 'lineSpacing' && <LineHeight className="h-4 w-4 text-blue-600" />}
                      {key === 'margins' && <AlignLeft className="h-4 w-4 text-blue-600" />}
                      {key === 'alignment' && <AlignJustify className="h-4 w-4 text-blue-600" />}
                      {key === 'indentation' && <Indent className="h-4 w-4 text-blue-600" />}
                      {!['font', 'fontSize', 'lineSpacing', 'margins', 'alignment', 'indentation'].includes(key) && 
                        <Settings className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div>
                      <div className="font-medium capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-sm text-gray-600">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-6">
                <Button onClick={handleApplyFormatting} className="flex-1">
                  <Zap className="h-4 w-4 mr-2" />
                  Apply {selectedStyle} Formatting
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </div>

              {/* Preview */}
              {showPreview && (
                <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-3">Document Preview</h4>
                  <div className="bg-white border shadow-sm p-8 rounded text-sm" style={{ 
                    fontFamily: styleGuidelines[selectedStyle].font.replace(' ', ', '),
                    fontSize: '11px', // Scaled down for preview
                    lineHeight: selectedStyle !== 'Custom' ? '1.8' : '1.5'
                  }}>
                    {selectedStyle === 'MLA' && (
                      <>
                        <div className="text-right text-xs mb-4">Smith 1</div>
                        <div className="mb-4">
                          <div>John Smith</div>
                          <div>Professor Johnson</div>
                          <div>English 101</div>
                          <div>15 October 2024</div>
                        </div>
                        <div className="text-center mb-4 font-medium">Essay Title</div>
                        <div className="indent-4">This is the first paragraph of your essay with proper MLA formatting...</div>
                      </>
                    )}
                    {selectedStyle === 'APA' && (
                      <>
                        <div className="text-center mb-8">
                          <div className="font-bold text-base mb-2">Essay Title</div>
                          <div>John Smith</div>
                          <div>University Name</div>
                        </div>
                        <div className="indent-4">This is the first paragraph of your essay with proper APA formatting...</div>
                      </>
                    )}
                    {selectedStyle === 'Chicago' && (
                      <>
                        <div className="text-center mb-6 font-bold text-base">Essay Title</div>
                        <div className="indent-4">This is the first paragraph of your essay with proper Chicago formatting...</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Formatting Checklist
              </CardTitle>
              <CardDescription>
                Track your progress with {selectedStyle} formatting requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <div className="text-sm font-medium">
                  {completionPercentage}% Complete
                </div>
              </div>
              
              {completionPercentage === 100 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Great job! Your formatting is complete.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Checklist Items by Category */}
          {Object.entries(groupedChecklist).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                      <Switch
                        id={item.id}
                        checked={checkedItems[item.id] || false}
                        onCheckedChange={() => handleCheckItem(item.id)}
                      />
                      <Label 
                        htmlFor={item.id} 
                        className={`flex-1 cursor-pointer ${
                          checkedItems[item.id] ? 'line-through text-gray-500' : ''
                        }`}
                      >
                        {item.label}
                      </Label>
                      {checkedItems[item.id] && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tips" className="space-y-6">
          {/* General Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                General Formatting Tips
              </CardTitle>
              <CardDescription>
                Best practices for academic writing formatting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formattingTips.general.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <Zap className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="text-sm">{tip}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Style-Specific Tips */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedStyle}-Specific Tips</CardTitle>
              <CardDescription>
                Special considerations for {selectedStyle} formatting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formattingTips[selectedStyle].map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="p-1 bg-green-100 rounded-full">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </div>
                    <div className="text-sm">{tip}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Common Mistakes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Common Formatting Mistakes
              </CardTitle>
              <CardDescription>
                Avoid these frequent formatting errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  "Using the wrong font or font size",
                  "Inconsistent line spacing throughout the document",
                  "Forgetting to include page numbers",
                  "Using single spacing instead of double spacing",
                  "Incorrect citation format",
                  "Missing or incorrect header information",
                  "Using extra spaces between paragraphs",
                  "Inconsistent indentation"
                ].map((mistake, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                    <div className="p-1 bg-red-100 rounded-full">
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                    </div>
                    <div className="text-sm text-red-800">{mistake}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Style Guide
                </Button>
                <Button variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Format Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}