"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  BookOpen, 
  Globe, 
  Newspaper, 
  Video, 
  FileText, 
  Users, 
  Copy, 
  Plus,
  Search,
  Trash2,
  Edit3,
  CheckCircle,
  AlertCircle,
  Quote,
  Download,
  Upload
} from 'lucide-react'

// Citation formats and types
type CitationFormat = 'MLA' | 'APA' | 'Chicago'
type SourceType = 'book' | 'website' | 'journal' | 'newspaper' | 'video' | 'interview' | 'other'

interface CitationSource {
  id: string
  type: SourceType
  format: CitationFormat
  title: string
  author: string
  year?: string
  publisher?: string
  url?: string
  accessDate?: string
  pages?: string
  volume?: string
  issue?: string
  doi?: string
  location?: string
  created: Date
  citation: string
  inTextCitation: string
}

interface CitationHelperProps {
  onInsertCitation?: (citation: string, type: 'full' | 'intext') => void
  onSaveCitation?: (source: CitationSource) => void
  savedCitations?: CitationSource[]
  className?: string
}

// Citation formatting functions
const formatCitation = {
  MLA: {
    book: (source: Partial<CitationSource>) => {
      const author = source.author || 'Unknown Author'
      const title = source.title || 'Untitled'
      const publisher = source.publisher || ''
      const year = source.year || 'n.d.'
      const pages = source.pages ? `, pp. ${source.pages}` : ''
      
      return `${author}. *${title}*. ${publisher}, ${year}${pages}.`
    },
    website: (source: Partial<CitationSource>) => {
      const author = source.author || 'Unknown Author'
      const title = source.title || 'Untitled'
      const url = source.url || ''
      const accessDate = source.accessDate || new Date().toLocaleDateString()
      
      return `${author}. "${title}." *Web*. ${accessDate}. <${url}>.`
    },
    journal: (source: Partial<CitationSource>) => {
      const author = source.author || 'Unknown Author'
      const title = source.title || 'Untitled'
      const publisher = source.publisher || 'Unknown Journal'
      const volume = source.volume || ''
      const issue = source.issue || ''
      const year = source.year || 'n.d.'
      const pages = source.pages || ''
      
      return `${author}. "${title}." *${publisher}* ${volume}${issue ? `.${issue}` : ''} (${year}): ${pages}.`
    }
  },
  APA: {
    book: (source: Partial<CitationSource>) => {
      const author = source.author || 'Unknown Author'
      const year = source.year || 'n.d.'
      const title = source.title || 'Untitled'
      const publisher = source.publisher || 'Unknown Publisher'
      
      return `${author} (${year}). *${title}*. ${publisher}.`
    },
    website: (source: Partial<CitationSource>) => {
      const author = source.author || 'Unknown Author'
      const year = source.year || 'n.d.'
      const title = source.title || 'Untitled'
      const url = source.url || ''
      const accessDate = source.accessDate || new Date().toLocaleDateString()
      
      return `${author} (${year}). ${title}. Retrieved ${accessDate}, from ${url}`
    },
    journal: (source: Partial<CitationSource>) => {
      const author = source.author || 'Unknown Author'
      const year = source.year || 'n.d.'
      const title = source.title || 'Untitled'
      const publisher = source.publisher || 'Unknown Journal'
      const volume = source.volume || ''
      const issue = source.issue || ''
      const pages = source.pages || ''
      const doi = source.doi || ''
      
      return `${author} (${year}). ${title}. *${publisher}*, *${volume}*${issue ? `(${issue})` : ''}, ${pages}${doi ? `. https://doi.org/${doi}` : ''}.`
    }
  },
  Chicago: {
    book: (source: Partial<CitationSource>) => {
      const author = source.author || 'Unknown Author'
      const title = source.title || 'Untitled'
      const location = source.location || 'Unknown Location'
      const publisher = source.publisher || 'Unknown Publisher'
      const year = source.year || 'n.d.'
      
      return `${author}. *${title}*. ${location}: ${publisher}, ${year}.`
    },
    website: (source: Partial<CitationSource>) => {
      const author = source.author || 'Unknown Author'
      const title = source.title || 'Untitled'
      const url = source.url || ''
      const accessDate = source.accessDate || new Date().toLocaleDateString()
      
      return `${author}. "${title}." Accessed ${accessDate}. ${url}.`
    },
    journal: (source: Partial<CitationSource>) => {
      const author = source.author || 'Unknown Author'
      const title = source.title || 'Untitled'
      const publisher = source.publisher || 'Unknown Journal'
      const volume = source.volume || ''
      const issue = source.issue || ''
      const year = source.year || 'n.d.'
      const pages = source.pages || ''
      
      return `${author}. "${title}." *${publisher}* ${volume}, no. ${issue} (${year}): ${pages}.`
    }
  }
}

const formatInTextCitation = {
  MLA: (source: Partial<CitationSource>) => {
    const author = source.author?.split(' ').pop() || 'Unknown'
    const pages = source.pages || ''
    return `(${author}${pages ? ` ${pages}` : ''})`
  },
  APA: (source: Partial<CitationSource>) => {
    const author = source.author?.split(' ').pop() || 'Unknown'
    const year = source.year || 'n.d.'
    const pages = source.pages ? `, p. ${source.pages}` : ''
    return `(${author}, ${year}${pages})`
  },
  Chicago: (source: Partial<CitationSource>) => {
    const author = source.author?.split(' ').pop() || 'Unknown'
    const year = source.year || 'n.d.'
    const pages = source.pages || ''
    return `(${author} ${year}${pages ? `, ${pages}` : ''})`
  }
}

// Source type icons and labels
const sourceTypeConfig = {
  book: { icon: BookOpen, label: 'Book', color: 'bg-blue-100 text-blue-800' },
  website: { icon: Globe, label: 'Website', color: 'bg-green-100 text-green-800' },
  journal: { icon: FileText, label: 'Journal Article', color: 'bg-purple-100 text-purple-800' },
  newspaper: { icon: Newspaper, label: 'Newspaper', color: 'bg-orange-100 text-orange-800' },
  video: { icon: Video, label: 'Video', color: 'bg-red-100 text-red-800' },
  interview: { icon: Users, label: 'Interview', color: 'bg-yellow-100 text-yellow-800' },
  other: { icon: FileText, label: 'Other', color: 'bg-gray-100 text-gray-800' }
}

export default function CitationHelper({ 
  onInsertCitation, 
  onSaveCitation, 
  savedCitations = [],
  className 
}: CitationHelperProps) {
  const [currentFormat, setCurrentFormat] = useState<CitationFormat>('MLA')
  const [currentSource, setCurrentSource] = useState<Partial<CitationSource>>({
    type: 'book',
    format: 'MLA',
    title: '',
    author: '',
    year: '',
    publisher: '',
    url: '',
    accessDate: '',
    pages: '',
    volume: '',
    issue: '',
    doi: '',
    location: ''
  })
  const [previewCitation, setPreviewCitation] = useState('')
  const [previewInText, setPreviewInText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Generate citation preview
  const generatePreview = useCallback(() => {
    if (!currentSource.title && !currentSource.author) {
      setPreviewCitation('')
      setPreviewInText('')
      return
    }

    try {
      const formatter = formatCitation[currentFormat][currentSource.type as keyof typeof formatCitation['MLA']]
      const inTextFormatter = formatInTextCitation[currentFormat]
      
      if (formatter && inTextFormatter) {
        const citation = formatter(currentSource)
        const inText = inTextFormatter(currentSource)
        setPreviewCitation(citation)
        setPreviewInText(inText)
      }
    } catch (error) {
      setPreviewCitation('Error generating citation')
      setPreviewInText('Error')
    }
  }, [currentSource, currentFormat])

  useEffect(() => {
    generatePreview()
  }, [generatePreview])

  // Handle form changes
  const handleInputChange = (field: string, value: string) => {
    setCurrentSource(prev => ({
      ...prev,
      [field]: value,
      format: currentFormat
    }))
  }

  // Save citation
  const handleSaveCitation = () => {
    if (!currentSource.title || !currentSource.author) {
      return
    }

    const newSource: CitationSource = {
      id: editingId || Date.now().toString(),
      type: currentSource.type as SourceType,
      format: currentFormat,
      title: currentSource.title,
      author: currentSource.author,
      year: currentSource.year,
      publisher: currentSource.publisher,
      url: currentSource.url,
      accessDate: currentSource.accessDate,
      pages: currentSource.pages,
      volume: currentSource.volume,
      issue: currentSource.issue,
      doi: currentSource.doi,
      location: currentSource.location,
      created: new Date(),
      citation: previewCitation,
      inTextCitation: previewInText
    }

    onSaveCitation?.(newSource)
    
    // Reset form
    setCurrentSource({
      type: 'book',
      format: currentFormat,
      title: '',
      author: '',
      year: '',
      publisher: '',
      url: '',
      accessDate: '',
      pages: '',
      volume: '',
      issue: '',
      doi: '',
      location: ''
    })
    setIsCreating(false)
    setEditingId(null)
  }

  // Load citation for editing
  const handleEditCitation = (source: CitationSource) => {
    setCurrentSource(source)
    setCurrentFormat(source.format)
    setEditingId(source.id)
    setIsCreating(true)
  }

  // Copy citation to clipboard
  const handleCopyCitation = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy citation:', error)
    }
  }

  // Filter saved citations
  const filteredCitations = savedCitations.filter(citation =>
    citation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    citation.author.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get required fields based on source type
  const getRequiredFields = (type: SourceType) => {
    const common = ['title', 'author']
    const typeSpecific = {
      book: ['publisher', 'year'],
      website: ['url', 'accessDate'],
      journal: ['publisher', 'volume', 'year', 'pages'],
      newspaper: ['publisher', 'year'],
      video: ['year'],
      interview: ['year'],
      other: ['year']
    }
    return [...common, ...typeSpecific[type]]
  }

  return (
    <div className={`citation-helper ${className}`}>
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Citation</TabsTrigger>
          <TabsTrigger value="library">My Citations ({savedCitations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5" />
                Citation Format
              </CardTitle>
              <CardDescription>
                Choose the citation style required for your assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {(['MLA', 'APA', 'Chicago'] as CitationFormat[]).map(format => (
                  <Button
                    key={format}
                    variant={currentFormat === format ? "default" : "outline"}
                    onClick={() => setCurrentFormat(format)}
                    className="flex-1"
                  >
                    {format}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Source Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Source Type</CardTitle>
              <CardDescription>
                What type of source are you citing?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(sourceTypeConfig).map(([type, config]) => {
                  const Icon = config.icon
                  return (
                    <Button
                      key={type}
                      variant={currentSource.type === type ? "default" : "outline"}
                      onClick={() => handleInputChange('type', type)}
                      className="h-20 flex-col gap-1"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{config.label}</span>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Citation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Source Information</CardTitle>
              <CardDescription>
                Fill in the details for your {sourceTypeConfig[currentSource.type as SourceType]?.label.toLowerCase() || 'source'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={currentSource.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter the title of the source"
                    className="mt-1"
                  />
                </div>

                {/* Author */}
                <div>
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={currentSource.author || ''}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    placeholder="Last, First"
                    className="mt-1"
                  />
                </div>

                {/* Year */}
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    value={currentSource.year || ''}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    placeholder="2024"
                    className="mt-1"
                  />
                </div>

                {/* Publisher (for books, journals) */}
                {['book', 'journal', 'newspaper'].includes(currentSource.type || '') && (
                  <div>
                    <Label htmlFor="publisher">
                      {currentSource.type === 'book' ? 'Publisher' : 'Publication'} *
                    </Label>
                    <Input
                      id="publisher"
                      value={currentSource.publisher || ''}
                      onChange={(e) => handleInputChange('publisher', e.target.value)}
                      placeholder={currentSource.type === 'book' ? 'Publisher name' : 'Journal/Publication name'}
                      className="mt-1"
                    />
                  </div>
                )}

                {/* URL (for websites) */}
                {currentSource.type === 'website' && (
                  <>
                    <div>
                      <Label htmlFor="url">URL *</Label>
                      <Input
                        id="url"
                        value={currentSource.url || ''}
                        onChange={(e) => handleInputChange('url', e.target.value)}
                        placeholder="https://example.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accessDate">Access Date *</Label>
                      <Input
                        id="accessDate"
                        type="date"
                        value={currentSource.accessDate || ''}
                        onChange={(e) => handleInputChange('accessDate', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                {/* Journal-specific fields */}
                {currentSource.type === 'journal' && (
                  <>
                    <div>
                      <Label htmlFor="volume">Volume</Label>
                      <Input
                        id="volume"
                        value={currentSource.volume || ''}
                        onChange={(e) => handleInputChange('volume', e.target.value)}
                        placeholder="1"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="issue">Issue</Label>
                      <Input
                        id="issue"
                        value={currentSource.issue || ''}
                        onChange={(e) => handleInputChange('issue', e.target.value)}
                        placeholder="1"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pages">Pages *</Label>
                      <Input
                        id="pages"
                        value={currentSource.pages || ''}
                        onChange={(e) => handleInputChange('pages', e.target.value)}
                        placeholder="1-10"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="doi">DOI</Label>
                      <Input
                        id="doi"
                        value={currentSource.doi || ''}
                        onChange={(e) => handleInputChange('doi', e.target.value)}
                        placeholder="10.1000/182"
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                {/* Chicago format location */}
                {currentFormat === 'Chicago' && currentSource.type === 'book' && (
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={currentSource.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="New York"
                      className="mt-1"
                    />
                  </div>
                )}

                {/* Pages (for books, etc.) */}
                {!['website', 'journal'].includes(currentSource.type || '') && (
                  <div>
                    <Label htmlFor="pages">Pages</Label>
                    <Input
                      id="pages"
                      value={currentSource.pages || ''}
                      onChange={(e) => handleInputChange('pages', e.target.value)}
                      placeholder="1-50"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Citation Preview */}
              {previewCitation && (
                <div className="space-y-4 mt-6 p-4 border rounded-lg bg-gray-50">
                  <div>
                    <Label className="text-sm font-medium">Full Citation:</Label>
                    <div className="mt-2 p-3 bg-white border rounded text-sm">
                      {previewCitation}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyCitation(previewCitation)}
                        className="ml-2 h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">In-Text Citation:</Label>
                    <div className="mt-2 p-3 bg-white border rounded text-sm">
                      {previewInText}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyCitation(previewInText)}
                        className="ml-2 h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveCitation} className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      {editingId ? 'Update Citation' : 'Save Citation'}
                    </Button>
                    {onInsertCitation && (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => onInsertCitation(previewCitation, 'full')}
                        >
                          Insert Full
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => onInsertCitation(previewInText, 'intext')}
                        >
                          Insert In-Text
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Citation Library
              </CardTitle>
              <CardDescription>
                Manage your saved citations and insert them into your essay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search citations by title or author..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Saved Citations */}
          <div className="space-y-4">
            {filteredCitations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No citations yet</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'No citations match your search.' : 'Start by creating your first citation in the Create tab.'}
                  </p>
                  {searchTerm && (
                    <Button variant="outline" onClick={() => setSearchTerm('')}>
                      Clear Search
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredCitations.map(citation => {
                const Icon = sourceTypeConfig[citation.type].icon
                return (
                  <Card key={citation.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <Badge variant="secondary" className={sourceTypeConfig[citation.type].color}>
                            {sourceTypeConfig[citation.type].label}
                          </Badge>
                          <Badge variant="outline">
                            {citation.format}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditCitation(citation)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyCitation(citation.citation)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <h4 className="font-medium mb-1">{citation.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{citation.author}</p>
                      
                      <div className="space-y-2">
                        <div className="text-sm">
                          <div className="font-medium text-gray-700">Full Citation:</div>
                          <div className="mt-1 p-2 bg-gray-50 border rounded text-xs">
                            {citation.citation}
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <div className="font-medium text-gray-700">In-Text:</div>
                          <div className="mt-1 p-2 bg-gray-50 border rounded text-xs">
                            {citation.inTextCitation}
                          </div>
                        </div>
                      </div>

                      {onInsertCitation && (
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onInsertCitation(citation.citation, 'full')}
                          >
                            Insert Full Citation
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onInsertCitation(citation.inTextCitation, 'intext')}
                          >
                            Insert In-Text
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}