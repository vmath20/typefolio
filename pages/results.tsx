import React, { useState, useCallback, useMemo, memo, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ResumeData {
  name?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  github?: string
  twitter?: string
  instagram?: string
  facebook?: string
  devpost?: string
  scholar?: string
  youtube?: string
  website?: string
  tagline?: string
  about?: string
  skills?: string[]
  work_experience?: Array<{
    company: string
    title: string
    start_date?: string
    end_date?: string
    description: string
    location?: string
    tags?: string[]
    logo_url?: string
    media_url?: string
  }>
  education?: Array<{
    institution: string
    degree: string
    start_date?: string
    end_date?: string
    gpa?: string
    activities?: string
    logo_url?: string
  }>
  courses?: string[]
  awards?: Array<{
    name: string
    description?: string
  }>
  publications?: Array<{
    name: string
    journal?: string
    year?: string
    authors?: string
    link?: string
  }>
  projects?: Array<{
    name: string
    description?: string
    start_date?: string
    end_date?: string
    tags?: string[]
    links?: string
    media_url?: string
  }>
  patents?: Array<{
    name: string
    inventors?: string
    number?: string
    link?: string
  }>
  test_scores?: Array<{
    test_name: string
    score: string
  }>
  certifications?: Array<{
    name: string
    date_issued?: string
    link?: string
  }>
  profile_picture?: string
  parsing_error?: string
}

export default function Results() {
  const router = useRouter()
  const [fileName, setFileName] = useState<string>('')
  const [parsedText, setParsedText] = useState<string>('')
  const [extractedJson, setExtractedJson] = useState<ResumeData | null>(null)
  const [enhancedJson, setEnhancedJson] = useState<ResumeData | null>(null)
  const [editedJson, setEditedJson] = useState<ResumeData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)

  // Load data from sessionStorage on mount
  useEffect(() => {
    const savedFileName = sessionStorage.getItem('fileName')
    const savedParsedText = sessionStorage.getItem('parsedText')
    const savedResumeJson = sessionStorage.getItem('resumeJson')
    const savedRefinedJson = sessionStorage.getItem('refinedResumeJson')

    if (!savedFileName || !savedParsedText || !savedResumeJson) {
      // Redirect back to upload if no data
      router.push('/')
      return
    }

    setFileName(savedFileName)
    setParsedText(savedParsedText)
    
    try {
      const extractedData = JSON.parse(savedResumeJson)
      setExtractedJson(extractedData)
      
      if (savedRefinedJson) {
        const enhancedData = JSON.parse(savedRefinedJson)
        setEnhancedJson(enhancedData)
      } else {
        setEnhancedJson(extractedData)
      }
    } catch (error) {
      console.error('Error parsing saved JSON data:', error)
      router.push('/')
    }
  }, [router])

  const handleStartEditing = useCallback(() => {
    if (enhancedJson) {
      setEditedJson(JSON.parse(JSON.stringify(enhancedJson)))
      setIsEditing(true)
    }
  }, [enhancedJson])

  const handleSaveEdits = useCallback(() => {
    if (editedJson) {
      sessionStorage.setItem('refinedResumeJson', JSON.stringify(editedJson))
      setEnhancedJson(editedJson)
      setIsEditing(false)
      alert('Changes saved successfully!')
    }
  }, [editedJson])

  const handleCancelEdits = useCallback(() => {
    if (enhancedJson) {
      setEditedJson(JSON.parse(JSON.stringify(enhancedJson)))
      setIsEditing(false)
    }
  }, [enhancedJson])

  const handleDataChange = useCallback((updatedData: ResumeData) => {
    setEditedJson(updatedData)
  }, [])

  const handleSaveAndFetchLogos = useCallback(async () => {
    if (!editedJson) return

    try {
      // Show loading state
      const loadingAlert = alert('Fetching logos for companies and institutions... This may take a moment.')
      
      // Extract company and institution names
      const companies = (editedJson.work_experience || [])
        .map(exp => exp.company)
        .filter(company => company && company.trim())
      
      const institutions = (editedJson.education || [])
        .map(edu => edu.institution)
        .filter(institution => institution && institution.trim())

      if (companies.length === 0 && institutions.length === 0) {
        alert('No companies or institutions found to fetch logos for.')
        return
      }

      console.log('Fetching logos for:', { companies, institutions })

      const response = await fetch('/api/fetch-logos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companies,
          institutions,
        }),
      })

      if (!response.ok) {
        console.error('Failed to fetch logos:', response.status)
        alert('Failed to fetch logos. Please try again.')
        return
      }

      const { companyLogos, institutionLogos } = await response.json()
      
      // Update work experience with logos
      const updatedWorkExperience = (editedJson.work_experience || []).map(exp => ({
        ...exp,
        logo_url: exp.logo_url || companyLogos[exp.company] || undefined
      }))

      // Update education with logos
      const updatedEducation = (editedJson.education || []).map(edu => ({
        ...edu,
        logo_url: edu.logo_url || institutionLogos[edu.institution] || undefined
      }))

      const updatedData = {
        ...editedJson,
        work_experience: updatedWorkExperience,
        education: updatedEducation,
      }

      // Update state and session storage
      setEditedJson(updatedData)
      sessionStorage.setItem('refinedResumeJson', JSON.stringify(updatedData))

      const companiesWithLogos = Object.keys(companyLogos).filter(company => companyLogos[company])
      const institutionsWithLogos = Object.keys(institutionLogos).filter(institution => institutionLogos[institution])

      console.log('Updated data with logos:', {
        companiesWithLogos,
        institutionsWithLogos
      })

      alert(`Successfully fetched logos!\nCompanies with logos: ${companiesWithLogos.length}\nInstitutions with logos: ${institutionsWithLogos.length}`)
    } catch (error) {
      console.error('Error fetching logos:', error)
      alert('Error fetching logos. Please try again.')
    }
  }, [editedJson])

  const handleCreateSite = useCallback(() => {
    const dataToUse = editedJson || enhancedJson || extractedJson
    if (dataToUse) {
      sessionStorage.setItem('refinedResumeJson', JSON.stringify(dataToUse))
      router.push('/portfolio')
    }
  }, [editedJson, enhancedJson, extractedJson, router])

  const handleBackToUpload = useCallback(() => {
    router.push('/')
  }, [router])

  const handleNewUpload = useCallback(() => {
    // Clear session storage and go to upload
    sessionStorage.removeItem('fileName')
    sessionStorage.removeItem('parsedText')
    sessionStorage.removeItem('resumeJson')
    sessionStorage.removeItem('refinedResumeJson')
    router.push('/')
  }, [router])

  // Define sections for card navigation
  const sections = [
    { id: 'personal', title: 'Personal Information', icon: '/people.png' },
    { id: 'summary', title: 'AI-Generated Summary', icon: '/ai-generate-portrait-image-spark-solid.png' },
    { id: 'skills', title: 'Skills', icon: '/lightbulb.png' },
    { id: 'experience', title: 'Work Experience', icon: '/briefcase.png' },
    { id: 'education', title: 'Education', icon: '/graduationcap.png' },
    { id: 'projects', title: 'Projects', icon: '/rocket.png' },
    { id: 'publications', title: 'Publications', icon: '/books.png' },
    { id: 'patents', title: 'Patents', icon: '/microscope.png' },
    { id: 'awards', title: 'Awards', icon: '/trophy.png' },
    { id: 'test_scores', title: 'Test Scores', icon: '/test-beaker-solid.png' },
    { id: 'courses', title: 'Courses', icon: '/course-filled.png' },
    { id: 'certifications', title: 'Certifications', icon: '/certification.png' }
  ]

  const handleNextSection = useCallback(() => {
    setCurrentSection(prev => Math.min(prev + 1, sections.length - 1))
  }, [sections.length])

  const handlePrevSection = useCallback(() => {
    setCurrentSection(prev => Math.max(prev - 1, 0))
  }, [])

  // Show loading if data hasn't loaded yet
  if (!extractedJson) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300" style={{ fontFamily: 'Roboto, sans-serif' }}>Loading resume data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
              {/* Logo */}
        <div className="absolute top-6 left-6">
          <img 
            src="/Logo.png" 
            alt="Typefolio" 
            className="h-16 w-auto"
          />
        </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <h1 className="text-3xl font-bold text-white text-center" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Please make sure all the information below is correct (we make errors too).
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-black rounded-lg shadow-sm p-4 mb-6 border border-white">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300" style={{ fontFamily: 'Roboto, sans-serif' }}>
              {isEditing ? (
                <span className="text-orange-400 font-medium">⚠️ You have unsaved changes</span>
              ) : (
                <span>Edit to personalize</span>
              )}
            </div>
            <div className="flex gap-3">
              {!isEditing ? (
                <button
                  onClick={handleStartEditing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={!enhancedJson}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                >
                  Edit Data
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancelEdits}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdits}
                    className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  >
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="bg-black rounded-lg shadow-sm p-4 mb-6 border border-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2" style={{ fontFamily: 'Roboto, sans-serif' }}>
              <img 
                src={sections[currentSection].icon} 
                alt={sections[currentSection].title}
                className="w-6 h-6 object-contain border border-white rounded-sm p-0.5"
              />
              {sections[currentSection].title}
            </h3>
            <div className="text-sm text-gray-300" style={{ fontFamily: 'Roboto, sans-serif' }}>
              {currentSection + 1} of {sections.length}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevSection}
              disabled={currentSection === 0}
              className="px-4 py-2 text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              ← Previous
            </button>
            
            <div className="flex gap-2">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSection ? 'bg-white' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  title={section.title}
                />
              ))}
            </div>
            
            <button
              onClick={handleNextSection}
              disabled={currentSection === sections.length - 1}
              className="px-4 py-2 text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Section Content Card */}
        <div className="bg-black rounded-lg shadow-sm border border-white min-h-96">
          <div className="p-6">
            {enhancedJson && (
              <SectionContent
                section={sections[currentSection]}
                data={isEditing ? (editedJson || enhancedJson) : enhancedJson}
                isEnhanced={true}
                isEditable={isEditing}
                onDataChange={handleDataChange}
              />
            )}
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={handleNewUpload}
            className="px-6 py-3 text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            Back
          </button>
          {isEditing && (
            <button
              onClick={handleSaveAndFetchLogos}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Save & Fetch Logos
            </button>
          )}
          <button
            onClick={() => router.push('/templates')}
            className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
            disabled={isEditing}
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            Create Portfolio Site →
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper components (moved outside for reuse)
const Field = memo(({ label, value, onChange, type = 'text', multiline = false, isEditable }: {
  label: string
  value?: string
  onChange?: (value: string) => void
  type?: 'text' | 'email' | 'tel' | 'url' | 'link'
  multiline?: boolean
  isEditable?: boolean
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange?.(e.target.value)
  }, [onChange])

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2">
      <label className="text-sm font-medium text-gray-300 sm:w-32 flex-shrink-0 mt-1" style={{ fontFamily: 'Roboto, sans-serif' }}>
        {label}:
      </label>
      <div className="flex-1">
        {isEditable ? (
          multiline ? (
            <textarea
              value={value || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent resize-vertical min-h-[80px] bg-gray-800 text-white"
              rows={3}
            />
          ) : (
            <input
              type={type === 'link' ? 'url' : type}
              value={value || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white"
            />
          )
        ) : (
          <div className="text-white">
            {type === 'link' && value ? (
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                {value}
              </a>
            ) : (
              value || <span className="text-gray-400 italic">Not provided</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

  // Reusable MediaUploadField component for managing images and videos
const MediaUploadField = memo(({ 
  currentMedia, 
  onMediaChange, 
  isEditable, 
  placeholder = "Upload media...",
  size = "w-32 h-24"
}: {
  currentMedia?: string
  onMediaChange?: (mediaUrl: string) => void
  isEditable?: boolean
  placeholder?: string
  size?: string
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [inputId] = useState(() => `media-upload-${Math.random().toString(36).substr(2, 9)}`)

  const handleMediaUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onMediaChange) return

    // Validate file type
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    
    if (!isImage && !isVideo) {
      alert('Please select an image or video file')
      return
    }

    // Validate file size (max 10MB for videos, 5MB for images)
    const maxSize = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`File size must be less than ${isVideo ? '10MB' : '5MB'}`)
      return
    }

    setIsUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (result) {
          onMediaChange(result)
        }
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading media:', error)
      alert('Error uploading media. Please try again.')
      setIsUploading(false)
    }
  }, [onMediaChange])

  const isVideo = currentMedia?.startsWith('data:video/')

  return (
    <div className="flex flex-col gap-3">
      {/* Current Media Display */}
      <div className={`${size} rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center`}>
        {currentMedia ? (
          isVideo ? (
            <video 
              src={currentMedia} 
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src={currentMedia} 
              alt="Uploaded media" 
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="text-gray-400 text-xs text-center">
            No media
          </div>
        )}
      </div>

      {/* Upload Controls */}
      {isEditable && (
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaUpload}
            disabled={isUploading}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className={`px-3 py-1 text-xs rounded cursor-pointer transition-colors ${
              isUploading 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Add Media'}
          </label>
          {currentMedia && (
            <button
              onClick={() => onMediaChange?.('')}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  )
})

// Reusable ImageUploadField component for managing images
const ImageUploadField = memo(({ 
  currentImage, 
  onImageChange, 
  isEditable, 
  placeholder = "Upload image...",
  size = "w-12 h-12"
}: {
  currentImage?: string
  onImageChange?: (imageUrl: string) => void
  isEditable?: boolean
  placeholder?: string
  size?: string
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [inputId] = useState(() => `image-upload-${Math.random().toString(36).substr(2, 9)}`)

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onImageChange) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB')
      return
    }

    setIsUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (result) {
          onImageChange(result)
        }
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image. Please try again.')
      setIsUploading(false)
    }
  }, [onImageChange])

  return (
    <div className="flex items-center gap-3">
      {/* Current Image Display */}
      <div className={`${size} rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center`}>
        {currentImage ? (
          <img 
            src={currentImage} 
            alt="Uploaded" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400 text-xs text-center">
            No image
          </div>
        )}
      </div>

      {/* Upload Controls */}
      {isEditable && (
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className={`px-3 py-1 text-xs rounded cursor-pointer transition-colors ${
              isUploading 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Change Image'}
          </label>
          {currentImage && (
            <button
              onClick={() => onImageChange?.('')}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  )
})

// Reusable TagsField component for managing tags
const TagsField = memo(({ tags = [], onTagsChange, isEditable, placeholder }: {
  tags?: string[]
  onTagsChange?: (tags: string[]) => void
  isEditable?: boolean
  placeholder?: string
}) => {
  const [newTag, setNewTag] = useState('')

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && onTagsChange) {
      const currentTags = tags || []
      if (!currentTags.includes(newTag.trim())) {
        onTagsChange([...currentTags, newTag.trim()])
        setNewTag('')
      }
    }
  }, [newTag, tags, onTagsChange])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    if (onTagsChange) {
      const currentTags = tags || []
      onTagsChange(currentTags.filter(tag => tag !== tagToRemove))
    }
  }, [tags, onTagsChange])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }, [handleAddTag])

  if (!isEditable && (!tags || tags.length === 0)) {
    return null
  }

  return (
    <div className="space-y-2">
      {isEditable && (
        <div className="flex gap-2">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder || "Add tag..."}
            className="flex-1 p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm"
          />
          <button
            onClick={handleAddTag}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Add
          </button>
        </div>
      )}
      {(tags || []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-gray-700 text-white px-2 py-1 rounded text-xs"
            >
              <span>{tag}</span>
              {isEditable && (
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-red-400 hover:text-red-300 font-bold"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

const ListField = memo(({ label, items, field, onItemsChange, isEditable }: {
  label: string
  items?: string[]
  field: string
  onItemsChange?: (items: string[]) => void
  isEditable?: boolean
}) => {
  const handleAddItem = useCallback(() => {
    if (isEditable && onItemsChange) {
      onItemsChange([...(items || []), ''])
    }
  }, [items, onItemsChange, isEditable])

  const handleRemoveItem = useCallback((index: number) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems.splice(index, 1)
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  const handleInputChange = useCallback((index: number, value: string) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems[index] = value
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  if ((!items || items.length === 0) && !isEditable) {
    return (
      <div className="text-center text-gray-400 py-8 border border-white rounded-lg bg-black">
        <p>Nothing here yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {(items || []).map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {isEditable ? (
            <>
              <input
                value={item}
                onChange={(e) => handleInputChange(index, e.target.value)}
                className="flex-1 p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white"
                placeholder={`Enter ${label.toLowerCase()}`}
              />
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-400 hover:text-red-300 font-bold w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </>
          ) : (
            <span className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm">
              {item}
            </span>
          )}
        </div>
      ))}
      {isEditable && (
        <button
          onClick={handleAddItem}
          className="w-full p-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-white hover:text-white"
        >
          + Add {label}
        </button>
      )}
    </div>
  )
})

const ExperienceField = memo(({ items, isEditable, onItemsChange }: { 
  items?: ResumeData['work_experience']
  isEditable?: boolean
  onItemsChange?: (items: ResumeData['work_experience']) => void
}) => {
  const handleAddItem = useCallback(() => {
    if (isEditable && onItemsChange) {
      onItemsChange([...(items || []), {
        company: '',
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        tags: []
      }])
    }
  }, [items, onItemsChange, isEditable])

  const handleRemoveItem = useCallback((index: number) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems.splice(index, 1)
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  const handleUpdateItem = useCallback((index: number, field: string, value: string) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems[index] = { ...newItems[index], [field]: value }
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  if ((!items || items.length === 0) && !isEditable) {
    return (
      <div className="text-center text-gray-400 py-8 border border-white rounded-lg bg-black">
        <p>Nothing here yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(items || []).map((exp, index) => (
        <div key={index} className="p-4 border border-white rounded-lg bg-black">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {isEditable ? (
                <ImageUploadField
                  currentImage={exp.logo_url}
                  onImageChange={(logoUrl) => {
                    if (isEditable && onItemsChange) {
                      const newItems = [...(items || [])]
                      newItems[index] = { ...newItems[index], logo_url: logoUrl }
                      onItemsChange(newItems)
                    }
                  }}
                  isEditable={isEditable}
                  size="w-12 h-12"
                />
              ) : (
                exp.logo_url && (
                  <img 
                    src={exp.logo_url} 
                    alt={`${exp.company} logo`}
                    className="w-12 h-12 object-contain rounded"
                  />
                )
              )}
            </div>
            <div className="flex-1 space-y-2">
              {isEditable ? (
                <>
                  <input
                    value={exp.company}
                    onChange={(e) => handleUpdateItem(index, 'company', e.target.value)}
                    placeholder="Company"
                    className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white font-semibold"
                  />
                  <input
                    value={exp.title}
                    onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                    placeholder="Job Title"
                    className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      value={exp.start_date || ''}
                      onChange={(e) => handleUpdateItem(index, 'start_date', e.target.value)}
                      placeholder="Start Date"
                      className="flex-1 p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-xs"
                    />
                    <input
                      value={exp.end_date || ''}
                      onChange={(e) => handleUpdateItem(index, 'end_date', e.target.value)}
                      placeholder="End Date (or Present)"
                      className="flex-1 p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-xs"
                    />
                  </div>
                  <input
                    value={exp.location || ''}
                    onChange={(e) => handleUpdateItem(index, 'location', e.target.value)}
                    placeholder="Location (e.g., Remote, San Francisco, CA)"
                    className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-xs"
                  />
                  <textarea
                    value={exp.description}
                    onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                    placeholder="Job Description"
                    className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm resize-vertical min-h-[80px]"
                    rows={3}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Tags (skills/technologies)</label>
                    <TagsField
                      tags={exp.tags}
                      onTagsChange={(tags) => {
                        if (isEditable && onItemsChange) {
                          const newItems = [...(items || [])]
                          newItems[index] = { ...newItems[index], tags }
                          onItemsChange(newItems)
                        }
                      }}
                      isEditable={isEditable}
                      placeholder="Add skills/technologies used..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Media (image or video)</label>
                    <MediaUploadField
                      currentMedia={exp.media_url}
                      onMediaChange={(mediaUrl) => {
                        if (isEditable && onItemsChange) {
                          const newItems = [...(items || [])]
                          newItems[index] = { ...newItems[index], media_url: mediaUrl }
                          onItemsChange(newItems)
                        }
                      }}
                      isEditable={isEditable}
                      size="w-48 h-32"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-400 hover:text-red-300 font-bold w-8 h-8 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <div className="font-semibold text-white">{exp.company}</div>
                  <div className="text-sm text-gray-300">{exp.title}</div>
                  <div className="text-xs text-gray-400">
                    {exp.start_date ? `${exp.start_date} - ${exp.end_date || 'Present'}` : ''}
                    {exp.location && exp.start_date && ' • '}
                    {exp.location}
                  </div>
                  {exp.tags && exp.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {exp.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="bg-gray-700 text-white px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {exp.description && (
                    <div className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">
                      {exp.description}
                    </div>
                  )}
                  {exp.media_url && (
                    <div className="mt-3">
                      {exp.media_url.startsWith('data:video/') ? (
                        <video 
                          src={exp.media_url} 
                          controls
                          className="w-full max-w-md h-auto rounded-lg"
                        />
                      ) : (
                        <img 
                          src={exp.media_url} 
                          alt={`${exp.company} media`}
                          className="w-full max-w-md h-auto rounded-lg object-cover"
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      {isEditable && (
        <button
          onClick={handleAddItem}
          className="w-full p-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-white hover:text-white"
        >
          + Add Work Experience
        </button>
      )}
    </div>
  )
})

const EducationField = memo(({ items, isEditable, onItemsChange }: { 
  items?: ResumeData['education']
  isEditable?: boolean
  onItemsChange?: (items: ResumeData['education']) => void
}) => {
  const handleAddItem = useCallback(() => {
    if (isEditable && onItemsChange) {
      onItemsChange([...(items || []), {
        institution: '',
        degree: '',
        start_date: '',
        end_date: '',
        gpa: '',
        activities: ''
      }])
    }
  }, [items, onItemsChange, isEditable])

  const handleRemoveItem = useCallback((index: number) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems.splice(index, 1)
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  const handleUpdateItem = useCallback((index: number, field: string, value: string) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems[index] = { ...newItems[index], [field]: value }
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  if ((!items || items.length === 0) && !isEditable) {
    return (
      <div className="text-center text-gray-400 py-8 border border-white rounded-lg bg-black">
        <p>Nothing here yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(items || []).map((edu, index) => (
        <div key={index} className="p-4 border border-white rounded-lg bg-black">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {isEditable ? (
                <ImageUploadField
                  currentImage={edu.logo_url}
                  onImageChange={(logoUrl) => {
                    if (isEditable && onItemsChange) {
                      const newItems = [...(items || [])]
                      newItems[index] = { ...newItems[index], logo_url: logoUrl }
                      onItemsChange(newItems)
                    }
                  }}
                  isEditable={isEditable}
                  size="w-12 h-12"
                />
              ) : (
                edu.logo_url && (
                  <img 
                    src={edu.logo_url} 
                    alt={`${edu.institution} logo`}
                    className="w-12 h-12 object-contain rounded"
                  />
                )
              )}
            </div>
            <div className="flex-1 space-y-2">
              {isEditable ? (
                <>
                  <input
                    value={edu.institution}
                    onChange={(e) => handleUpdateItem(index, 'institution', e.target.value)}
                    placeholder="Institution"
                    className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white font-semibold"
                  />
                  <input
                    value={edu.degree}
                    onChange={(e) => handleUpdateItem(index, 'degree', e.target.value)}
                    placeholder="Degree"
                    className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      value={edu.start_date || ''}
                      onChange={(e) => handleUpdateItem(index, 'start_date', e.target.value)}
                      placeholder="Start Date"
                      className="flex-1 p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-xs"
                    />
                    <input
                      value={edu.end_date || ''}
                      onChange={(e) => handleUpdateItem(index, 'end_date', e.target.value)}
                      placeholder="End Date (or Present)"
                      className="flex-1 p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-xs"
                    />
                  </div>
                  <input
                    value={edu.gpa || ''}
                    onChange={(e) => handleUpdateItem(index, 'gpa', e.target.value)}
                    placeholder="GPA (optional)"
                    className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-xs"
                  />
                  <textarea
                    value={edu.activities || ''}
                    onChange={(e) => handleUpdateItem(index, 'activities', e.target.value)}
                    placeholder="Activities/Extracurriculars"
                    className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm resize-vertical min-h-[60px]"
                    rows={2}
                  />
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-400 hover:text-red-300 font-bold w-8 h-8 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <div className="font-semibold text-white">{edu.institution}</div>
                  <div className="text-sm text-gray-300">{edu.degree}</div>
                  <div className="text-xs text-gray-400">
                    {edu.start_date ? `${edu.start_date} - ${edu.end_date || 'Present'}` : ''}
                    {edu.gpa && ` • GPA: ${edu.gpa}`}
                  </div>
                  {edu.activities && (
                    <div className="text-sm text-gray-300 mt-2">
                      {edu.activities}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      {isEditable && (
        <button
          onClick={handleAddItem}
          className="w-full p-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-white hover:text-white"
        >
          + Add Education
        </button>
      )}
    </div>
  )
})

const ProjectsField = memo(({ items, isEditable, onItemsChange }: { 
  items?: ResumeData['projects']
  isEditable?: boolean
  onItemsChange?: (items: ResumeData['projects']) => void
}) => {
  const handleAddItem = useCallback(() => {
    if (isEditable && onItemsChange) {
      onItemsChange([...(items || []), {
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        tags: [],
        links: ''
      }])
    }
  }, [items, onItemsChange, isEditable])

  const handleRemoveItem = useCallback((index: number) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems.splice(index, 1)
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  const handleUpdateItem = useCallback((index: number, field: string, value: string) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems[index] = { ...newItems[index], [field]: value }
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  if ((!items || items.length === 0) && !isEditable) {
    return (
      <div className="text-center text-gray-400 py-8 border border-white rounded-lg bg-black">
        <p>Nothing here yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(items || []).map((project, index) => (
        <div key={index} className="p-4 border border-white rounded-lg bg-black">
          {isEditable ? (
            <div className="space-y-2">
              <input
                value={project.name}
                onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                placeholder="Project Name"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white font-semibold"
              />
              <textarea
                value={project.description || ''}
                onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                placeholder="Project Description"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm resize-vertical min-h-[60px]"
                rows={2}
              />
              <div className="flex gap-2">
                <input
                  value={project.start_date || ''}
                  onChange={(e) => handleUpdateItem(index, 'start_date', e.target.value)}
                  placeholder="Start Date"
                  className="flex-1 p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-xs"
                />
                <input
                  value={project.end_date || ''}
                  onChange={(e) => handleUpdateItem(index, 'end_date', e.target.value)}
                  placeholder="End Date (or Present)"
                  className="flex-1 p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Tags (skills/technologies)</label>
                <TagsField
                  tags={project.tags}
                  onTagsChange={(tags) => {
                    if (isEditable && onItemsChange) {
                      const newItems = [...(items || [])]
                      newItems[index] = { ...newItems[index], tags }
                      onItemsChange(newItems)
                    }
                  }}
                  isEditable={isEditable}
                  placeholder="Add skills/technologies used..."
                />
              </div>
              <input
                value={project.links || ''}
                onChange={(e) => handleUpdateItem(index, 'links', e.target.value)}
                placeholder="Project Link (optional)"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm"
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Media (image or video)</label>
                <MediaUploadField
                  currentMedia={project.media_url}
                  onMediaChange={(mediaUrl) => {
                    if (isEditable && onItemsChange) {
                      const newItems = [...(items || [])]
                      newItems[index] = { ...newItems[index], media_url: mediaUrl }
                      onItemsChange(newItems)
                    }
                  }}
                  isEditable={isEditable}
                  size="w-48 h-32"
                />
              </div>
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-400 hover:text-red-300 font-bold w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className="font-semibold text-white">{project.name}</div>
              {project.start_date && (
                <div className="text-xs text-gray-400 mt-1">
                  {project.start_date} - {project.end_date || 'Present'}
                </div>
              )}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {project.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="bg-gray-700 text-white px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {project.description && (
                <div className="text-sm text-gray-300 mt-2">
                  {project.description}
                </div>
              )}
              {project.links && (
                <div className="text-sm text-blue-400 mt-2">
                  <a href={project.links} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300">
                    {project.links}
                  </a>
                </div>
              )}
              {project.media_url && (
                <div className="mt-3">
                  {project.media_url.startsWith('data:video/') ? (
                    <video 
                      src={project.media_url} 
                      controls
                      className="w-full max-w-md h-auto rounded-lg"
                    />
                  ) : (
                    <img 
                      src={project.media_url} 
                      alt={`${project.name} media`}
                      className="w-full max-w-md h-auto rounded-lg object-cover"
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}
      {isEditable && (
        <button
          onClick={handleAddItem}
          className="w-full p-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-white hover:text-white"
        >
          + Add Project
        </button>
      )}
    </div>
  )
})

const PublicationsField = memo(({ items, isEditable, onItemsChange }: { 
  items?: ResumeData['publications']
  isEditable?: boolean
  onItemsChange?: (items: ResumeData['publications']) => void
}) => {
  const handleAddItem = useCallback(() => {
    if (isEditable && onItemsChange) {
      onItemsChange([...(items || []), {
        name: '',
        journal: '',
        year: '',
        authors: '',
        link: ''
      }])
    }
  }, [items, onItemsChange, isEditable])

  const handleRemoveItem = useCallback((index: number) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems.splice(index, 1)
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  const handleUpdateItem = useCallback((index: number, field: string, value: string) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems[index] = { ...newItems[index], [field]: value }
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  if ((!items || items.length === 0) && !isEditable) {
    return (
      <div className="text-center text-gray-400 py-8 border border-white rounded-lg bg-black">
        <p>Nothing here yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(items || []).map((pub, index) => (
        <div key={index} className="p-4 border border-white rounded-lg bg-black">
          {isEditable ? (
            <div className="space-y-2">
              <input
                value={pub.name}
                onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                placeholder="Publication Title"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white font-semibold"
              />
              <input
                value={pub.journal || ''}
                onChange={(e) => handleUpdateItem(index, 'journal', e.target.value)}
                placeholder="Journal/Conference"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm"
              />
              <div className="flex gap-2">
                <input
                  value={pub.year || ''}
                  onChange={(e) => handleUpdateItem(index, 'year', e.target.value)}
                  placeholder="Year"
                  className="flex-1 p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-xs"
                />
                <input
                  value={pub.authors || ''}
                  onChange={(e) => handleUpdateItem(index, 'authors', e.target.value)}
                  placeholder="Authors"
                  className="flex-1 p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-xs"
                />
              </div>
              <input
                value={pub.link || ''}
                onChange={(e) => handleUpdateItem(index, 'link', e.target.value)}
                placeholder="Publication Link (optional)"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm"
              />
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-400 hover:text-red-300 font-bold w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className="font-semibold text-white">{pub.name}</div>
              <div className="text-sm text-gray-300">
                {pub.journal && `${pub.journal}`}
                {pub.year && ` • ${pub.year}`}
              </div>
              {pub.authors && (
                <div className="text-sm text-gray-400 mt-1">
                  {pub.authors}
                </div>
              )}
              {pub.link && (
                <div className="text-sm text-blue-400 mt-2">
                  <a href={pub.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300">
                    View Publication
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      ))}
      {isEditable && (
        <button
          onClick={handleAddItem}
          className="w-full p-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-white hover:text-white"
        >
          + Add Publication
        </button>
      )}
    </div>
  )
})

const PatentsField = memo(({ items, isEditable, onItemsChange }: { 
  items?: ResumeData['patents']
  isEditable?: boolean
  onItemsChange?: (items: ResumeData['patents']) => void
}) => {
  const handleAddItem = useCallback(() => {
    if (isEditable && onItemsChange) {
      onItemsChange([...(items || []), {
        name: '',
        inventors: '',
        number: '',
        link: ''
      }])
    }
  }, [items, onItemsChange, isEditable])

  const handleRemoveItem = useCallback((index: number) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems.splice(index, 1)
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  const handleUpdateItem = useCallback((index: number, field: string, value: string) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems[index] = { ...newItems[index], [field]: value }
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  if ((!items || items.length === 0) && !isEditable) {
    return (
      <div className="text-center text-gray-400 py-8 border border-white rounded-lg bg-black">
        <p>Nothing here yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(items || []).map((patent, index) => (
        <div key={index} className="p-4 border border-white rounded-lg bg-black">
          {isEditable ? (
            <div className="space-y-2">
              <input
                value={patent.name}
                onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                placeholder="Patent Title"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white font-semibold"
              />
              <input
                value={patent.inventors || ''}
                onChange={(e) => handleUpdateItem(index, 'inventors', e.target.value)}
                placeholder="Inventors"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm"
              />
              <input
                value={patent.number || ''}
                onChange={(e) => handleUpdateItem(index, 'number', e.target.value)}
                placeholder="Patent Number"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm"
              />
              <input
                value={patent.link || ''}
                onChange={(e) => handleUpdateItem(index, 'link', e.target.value)}
                placeholder="Patent Link (optional)"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm"
              />
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-400 hover:text-red-300 font-bold w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className="font-semibold text-white">{patent.name}</div>
              {patent.inventors && (
                <div className="text-sm text-gray-300 mt-1">
                  Inventors: {patent.inventors}
                </div>
              )}
              {patent.number && (
                <div className="text-sm text-gray-400">
                  Patent Number: {patent.number}
                </div>
              )}
              {patent.link && (
                <div className="text-sm text-blue-400 mt-2">
                  <a href={patent.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300">
                    View Patent
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      ))}
      {isEditable && (
        <button
          onClick={handleAddItem}
          className="w-full p-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-white hover:text-white"
        >
          + Add Patent
        </button>
      )}
    </div>
  )
})

const AwardsField = memo(({ items, isEditable, onItemsChange }: { 
  items?: ResumeData['awards']
  isEditable?: boolean
  onItemsChange?: (items: ResumeData['awards']) => void
}) => {
  const handleAddItem = useCallback(() => {
    if (isEditable && onItemsChange) {
      onItemsChange([...(items || []), {
        name: '',
        description: ''
      }])
    }
  }, [items, onItemsChange, isEditable])

  const handleRemoveItem = useCallback((index: number) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems.splice(index, 1)
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  const handleUpdateItem = useCallback((index: number, field: string, value: string) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems[index] = { ...newItems[index], [field]: value }
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  if ((!items || items.length === 0) && !isEditable) {
    return (
      <div className="text-center text-gray-400 py-8 border border-white rounded-lg bg-black">
        <p>Nothing here yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(items || []).map((award, index) => (
        <div key={index} className="p-4 border border-white rounded-lg bg-black">
          {isEditable ? (
            <div className="space-y-2">
              <input
                value={award.name}
                onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                placeholder="Award Name"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white font-semibold"
              />
              <textarea
                value={award.description || ''}
                onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                placeholder="Award Description"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm resize-vertical min-h-[60px]"
                rows={2}
              />
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-400 hover:text-red-300 font-bold w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className="font-semibold text-white">{award.name}</div>
              {award.description && (
                <div className="text-sm text-gray-300 mt-2">
                  {award.description}
                </div>
              )}
            </>
          )}
        </div>
      ))}
      {isEditable && (
        <button
          onClick={handleAddItem}
          className="w-full p-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-white hover:text-white"
        >
          + Add Award
        </button>
      )}
    </div>
  )
})

const TestScoresField = memo(({ items, isEditable, onItemsChange }: { 
  items?: ResumeData['test_scores']
  isEditable?: boolean
  onItemsChange?: (items: ResumeData['test_scores']) => void
}) => {
  const handleAddItem = useCallback(() => {
    if (isEditable && onItemsChange) {
      onItemsChange([...(items || []), {
        test_name: '',
        score: ''
      }])
    }
  }, [items, onItemsChange, isEditable])

  const handleRemoveItem = useCallback((index: number) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems.splice(index, 1)
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  const handleUpdateItem = useCallback((index: number, field: string, value: string) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems[index] = { ...newItems[index], [field]: value }
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  if ((!items || items.length === 0) && !isEditable) {
    return (
      <div className="text-center text-gray-400 py-8 border border-white rounded-lg bg-black">
        <p>Nothing here yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(items || []).map((test, index) => (
        <div key={index} className="p-4 border border-white rounded-lg bg-black">
          {isEditable ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={test.test_name}
                  onChange={(e) => handleUpdateItem(index, 'test_name', e.target.value)}
                  placeholder="Test Name"
                  className="flex-1 p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white font-semibold"
                />
                <input
                  value={test.score}
                  onChange={(e) => handleUpdateItem(index, 'score', e.target.value)}
                  placeholder="Score"
                  className="flex-1 p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-lg font-bold"
                />
              </div>
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-400 hover:text-red-300 font-bold w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="font-semibold text-white">{test.test_name}</div>
              <div className="text-lg font-bold text-white">{test.score}</div>
            </div>
          )}
        </div>
      ))}
      {isEditable && (
        <button
          onClick={handleAddItem}
          className="w-full p-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-white hover:text-white"
        >
          + Add Test Score
        </button>
      )}
    </div>
  )
})

const CertificationsField = memo(({ items, isEditable, onItemsChange }: { 
  items?: ResumeData['certifications']
  isEditable?: boolean
  onItemsChange?: (items: ResumeData['certifications']) => void
}) => {
  const handleAddItem = useCallback(() => {
    if (isEditable && onItemsChange) {
      onItemsChange([...(items || []), {
        name: '',
        date_issued: '',
        link: ''
      }])
    }
  }, [items, onItemsChange, isEditable])

  const handleRemoveItem = useCallback((index: number) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems.splice(index, 1)
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  const handleUpdateItem = useCallback((index: number, field: string, value: string) => {
    if (isEditable && onItemsChange) {
      const newItems = [...(items || [])]
      newItems[index] = { ...newItems[index], [field]: value }
      onItemsChange(newItems)
    }
  }, [items, onItemsChange, isEditable])

  if ((!items || items.length === 0) && !isEditable) {
    return (
      <div className="text-center text-gray-400 py-8 border border-white rounded-lg bg-black">
        <p>Nothing here yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(items || []).map((cert, index) => (
        <div key={index} className="p-4 border border-white rounded-lg bg-black">
          {isEditable ? (
            <div className="space-y-2">
              <input
                value={cert.name}
                onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                placeholder="Certification Name"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white font-semibold"
              />
              <input
                value={cert.date_issued || ''}
                onChange={(e) => handleUpdateItem(index, 'date_issued', e.target.value)}
                placeholder="Date Issued"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm"
              />
              <input
                value={cert.link || ''}
                onChange={(e) => handleUpdateItem(index, 'link', e.target.value)}
                placeholder="Certificate Link (optional)"
                className="w-full p-2 border border-gray-600 rounded focus:ring-2 focus:ring-white focus:border-transparent bg-gray-800 text-white text-sm"
              />
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-400 hover:text-red-300 font-bold w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className="font-semibold text-white">{cert.name}</div>
              {cert.date_issued && (
                <div className="text-sm text-gray-300 mt-1">
                  Issued: {cert.date_issued}
                </div>
              )}
              {cert.link && (
                <div className="text-sm text-blue-400 mt-2">
                  <a href={cert.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300">
                    View Certificate
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      ))}
      {isEditable && (
        <button
          onClick={handleAddItem}
          className="w-full p-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-white hover:text-white"
        >
          + Add Certification
        </button>
      )}
    </div>
  )
})

// Section Content Component
const SectionContent = memo(({ section, data, isEnhanced, isEditable, onDataChange }: {
  section: { id: string; title: string; icon: string }
  data: ResumeData
  isEnhanced: boolean
  isEditable: boolean
  onDataChange?: (data: ResumeData) => void
}) => {
  const renderSectionContent = () => {
    switch (section.id) {
      case 'personal':
        return (
          <div className="space-y-6">
            {/* Profile Picture Field */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-300">Profile Picture</label>
                  <div className="flex items-center gap-3">
                    {/* Profile Picture Display */}
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                      {data.profile_picture ? (
                        <img 
                          src={data.profile_picture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-xl font-bold">
                          {data.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </div>
                      )}
                    </div>

                    {/* Upload Controls */}
                    {isEditable && (
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return

                            // Validate file type
                            if (!file.type.startsWith('image/')) {
                              alert('Please select an image file')
                              return
                            }

                            // Validate file size (max 5MB)
                            if (file.size > 5 * 1024 * 1024) {
                              alert('Image file size must be less than 5MB')
                              return
                            }

                            const reader = new FileReader()
                            reader.onload = (event) => {
                              const result = event.target?.result as string
                              if (result) {
                                onDataChange?.({ ...data, profile_picture: result })
                              }
                            }
                            reader.readAsDataURL(file)
                          }}
                          className="hidden"
                          id="profile-picture-upload"
                        />
                        <label
                          htmlFor="profile-picture-upload"
                          className="px-3 py-1 text-xs rounded cursor-pointer transition-colors bg-blue-600 text-white hover:bg-blue-700"
                        >
                          {data.profile_picture ? 'Change Image' : 'Upload Image'}
                        </label>
                        {data.profile_picture && (
                          <button
                            onClick={() => onDataChange?.({ ...data, profile_picture: '' })}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information Fields */}
            <Field 
              label="Name" 
              value={data.name} 
              onChange={(value) => onDataChange?.({ ...data, name: value })}
              isEditable={isEditable}
            />
            <Field 
              label="Email" 
              value={data.email} 
              onChange={(value) => onDataChange?.({ ...data, email: value })}
              type="email"
              isEditable={isEditable}
            />
            <Field 
              label="Phone" 
              value={data.phone} 
              onChange={(value) => onDataChange?.({ ...data, phone: value })}
              type="tel"
              isEditable={isEditable}
            />
            <Field 
              label="Location" 
              value={data.location} 
              onChange={(value) => onDataChange?.({ ...data, location: value })}
              isEditable={isEditable}
            />
            <Field 
              label="LinkedIn" 
              value={data.linkedin} 
              onChange={(value) => onDataChange?.({ ...data, linkedin: value })}
              type="link"
              isEditable={isEditable}
            />
            <Field 
              label="GitHub" 
              value={data.github} 
              onChange={(value) => onDataChange?.({ ...data, github: value })}
              type="link"
              isEditable={isEditable}
            />
            <Field 
              label="Website" 
              value={data.website} 
              onChange={(value) => onDataChange?.({ ...data, website: value })}
              type="link"
              isEditable={isEditable}
            />
            <Field 
              label="Twitter/X" 
              value={data.twitter} 
              onChange={(value) => onDataChange?.({ ...data, twitter: value })}
              type="link"
              isEditable={isEditable}
            />
            <Field 
              label="Instagram" 
              value={data.instagram} 
              onChange={(value) => onDataChange?.({ ...data, instagram: value })}
              type="link"
              isEditable={isEditable}
            />
            <Field 
              label="Facebook" 
              value={data.facebook} 
              onChange={(value) => onDataChange?.({ ...data, facebook: value })}
              type="link"
              isEditable={isEditable}
            />
            <Field 
              label="YouTube" 
              value={data.youtube} 
              onChange={(value) => onDataChange?.({ ...data, youtube: value })}
              type="link"
              isEditable={isEditable}
            />
            <Field 
              label="Devpost" 
              value={data.devpost} 
              onChange={(value) => onDataChange?.({ ...data, devpost: value })}
              type="link"
              isEditable={isEditable}
            />
            <Field 
              label="Google Scholar" 
              value={data.scholar} 
              onChange={(value) => onDataChange?.({ ...data, scholar: value })}
              type="link"
              isEditable={isEditable}
            />
          </div>
        )
      
      case 'summary':
        return isEnhanced ? (
          <div className="space-y-4">
                         <Field 
               label="Tagline" 
               value={data.tagline} 
               onChange={(value) => onDataChange?.({ ...data, tagline: value })}
               isEditable={isEditable}
             />
             <Field 
               label="About" 
               value={data.about} 
               onChange={(value) => onDataChange?.({ ...data, about: value })}
               multiline={true}
               isEditable={isEditable}
             />
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <p>AI-generated summary will appear here after enhancement.</p>
          </div>
        )
      
      case 'skills':
                 return (
           <ListField 
             label="Skills" 
             items={data.skills} 
             field="skills"
             onItemsChange={(items) => onDataChange?.({ ...data, skills: items })}
             isEditable={isEditable}
           />
         )
      
      case 'experience':
        return (
          <ExperienceField 
            items={data.work_experience} 
            isEditable={isEditable}
            onItemsChange={(items) => onDataChange?.({ ...data, work_experience: items })}
          />
        )
      
      case 'education':
        return (
          <EducationField 
            items={data.education} 
            isEditable={isEditable}
            onItemsChange={(items) => onDataChange?.({ ...data, education: items })}
          />
        )
      
      case 'projects':
        return (
          <ProjectsField 
            items={data.projects} 
            isEditable={isEditable}
            onItemsChange={(items) => onDataChange?.({ ...data, projects: items })}
          />
        )
      
      case 'publications':
        return (
          <PublicationsField 
            items={data.publications} 
            isEditable={isEditable}
            onItemsChange={(items) => onDataChange?.({ ...data, publications: items })}
          />
        )
      
      case 'patents':
        return (
          <PatentsField 
            items={data.patents} 
            isEditable={isEditable}
            onItemsChange={(items) => onDataChange?.({ ...data, patents: items })}
          />
        )
      
      case 'awards':
        return (
          <AwardsField 
            items={data.awards} 
            isEditable={isEditable}
            onItemsChange={(items) => onDataChange?.({ ...data, awards: items })}
          />
        )
      
      case 'test_scores':
        return (
          <TestScoresField 
            items={data.test_scores} 
            isEditable={isEditable}
            onItemsChange={(items) => onDataChange?.({ ...data, test_scores: items })}
          />
        )
      
      case 'courses':
        return (
          <ListField 
            label="Courses" 
            items={data.courses} 
            field="courses"
            isEditable={isEditable}
            onItemsChange={(items) => onDataChange?.({ ...data, courses: items })}
          />
        )
      
      case 'certifications':
        return (
          <CertificationsField 
            items={data.certifications} 
            isEditable={isEditable}
            onItemsChange={(items) => onDataChange?.({ ...data, certifications: items })}
          />
        )
      
      default:
        return (
          <div className="text-center text-gray-400 py-8">
            <p>Section not found.</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {renderSectionContent()}
    </div>
  )
})

// All the display components from index.tsx
const ResumeDataDisplay = memo(({ data, isEnhanced, isEditable, onDataChange }: {
  data: ResumeData
  isEnhanced: boolean
  isEditable: boolean
  onDataChange?: (data: ResumeData) => void
}) => {
  const handleProfilePictureChange = useCallback((newPicture: string) => {
    if (onDataChange) {
      onDataChange({ ...data, profile_picture: newPicture })
    }
  }, [data, onDataChange])



  // Helper components defined first
  const ListField = memo(({ label, items, field, onItemsChange }: {
    label: string
    items?: string[]
    field: string
    onItemsChange?: (items: string[]) => void
  }) => {
    const handleAddItem = useCallback(() => {
      if (isEditable && onItemsChange) {
        onItemsChange([...(items || []), ''])
      }
    }, [items, onItemsChange])

    const handleRemoveItem = useCallback((index: number) => {
      if (isEditable && onItemsChange) {
        const newItems = [...(items || [])]
        newItems.splice(index, 1)
        onItemsChange(newItems)
      }
    }, [items, onItemsChange])

    const handleInputChange = useCallback((index: number, value: string) => {
      if (isEditable && onItemsChange) {
        const newItems = [...(items || [])]
        newItems[index] = value
        onItemsChange(newItems)
      }
    }, [items, onItemsChange])

    if ((!items || items.length === 0) && !isEditable) return null

    return (
      <div className="space-y-2">
        {(items || []).map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {isEditable ? (
              <>
                <input
                  value={item}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-600 hover:text-red-800 font-bold w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>
              </>
            ) : (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {item}
              </span>
            )}
          </div>
        ))}
        {isEditable && (
          <button
            onClick={handleAddItem}
            className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600"
          >
            + Add {label}
          </button>
        )}
      </div>
    )
  })

  const ExperienceField = memo(({ items }: { items?: ResumeData['work_experience'] }) => {
    if (!items || items.length === 0) return null
    
    return (
      <div className="space-y-4">
        {items.map((exp, index) => (
          <div key={index} className="p-4 border border-gray-300 rounded-lg bg-white">
            <div className="flex items-start gap-3">
              {exp.logo_url && (
                <img 
                  src={exp.logo_url} 
                  alt={`${exp.company} logo`}
                  className="w-12 h-12 object-contain rounded"
                />
              )}
              <div className="flex-1">
                <div className="font-semibold">{exp.company}</div>
                <div className="text-sm text-gray-600">{exp.title}</div>
                <div className="text-xs text-gray-500">
                  {exp.start_date ? `${exp.start_date} - ${exp.end_date || 'Present'}` : ''}
                </div>
                {exp.description && (
                  <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                    {exp.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  })

  const EducationField = memo(({ items }: { items?: ResumeData['education'] }) => {
    if (!items || items.length === 0) return null
    
    return (
      <div className="space-y-4">
        {items.map((edu, index) => (
          <div key={index} className="p-4 border border-gray-300 rounded-lg bg-white">
            <div className="flex items-start gap-3">
              {edu.logo_url && (
                <img 
                  src={edu.logo_url} 
                  alt={`${edu.institution} logo`}
                  className="w-12 h-12 object-contain rounded"
                />
              )}
              <div className="flex-1">
                <div className="font-semibold">{edu.institution}</div>
                <div className="text-sm text-gray-600">{edu.degree}</div>
                <div className="text-xs text-gray-500">
                  {edu.start_date ? `${edu.start_date} - ${edu.end_date || 'Present'}` : ''}
                </div>
                {edu.gpa && <div className="text-xs text-gray-500">GPA: {edu.gpa}</div>}
                {edu.activities && (
                  <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                    {edu.activities}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  })

  const AwardsField = memo(({ items }: { items?: ResumeData['awards'] }) => {
    if ((!items || items.length === 0) && !isEditable) return null
    
    return (
      <div className="space-y-4">
        {(items || []).map((award, idx) => (
          <div key={idx} className="p-4 border border-gray-300 rounded-lg bg-white">
            <div className="font-semibold">{award.name}</div>
            {award.description && (
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{award.description}</div>
            )}
          </div>
        ))}
      </div>
    )
  })

  const PublicationsField = memo(({ items }: { items?: ResumeData['publications'] }) => {
    if ((!items || items.length === 0) && !isEditable) return null
    
    return (
      <div className="space-y-4">
        {(items || []).map((pub, idx) => (
          <div key={idx} className="p-4 border border-gray-300 rounded-lg bg-white">
            <div className="font-semibold">{pub.name}</div>
            <div className="text-sm text-gray-600">{pub.journal} ({pub.year})</div>
            <div className="text-xs text-gray-500">{pub.authors}</div>
            {pub.link && <a href={pub.link} className="text-xs text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View Publication</a>}
          </div>
        ))}
      </div>
    )
  })

  const ProjectsField = memo(({ items }: { items?: ResumeData['projects'] }) => {
    if ((!items || items.length === 0) && !isEditable) return null
    
    return (
      <div className="space-y-4">
        {(items || []).map((project, idx) => (
          <div key={idx} className="p-4 border border-gray-300 rounded-lg bg-white">
            <div className="font-semibold">{project.name}</div>
            {project.description && <div className="text-sm text-gray-700 whitespace-pre-wrap">{project.description}</div>}
            {project.links && (
              <div className="text-xs text-blue-600 hover:underline">
                <a href={project.links} target="_blank" rel="noopener noreferrer">View Project</a>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  })

  const PatentsField = memo(({ items }: { items?: ResumeData['patents'] }) => {
    if ((!items || items.length === 0) && !isEditable) return null
    
    return (
      <div className="space-y-4">
        {(items || []).map((patent, idx) => (
          <div key={idx} className="p-4 border border-gray-300 rounded-lg bg-white">
            <div className="font-semibold">{patent.name}</div>
            <div className="text-sm text-gray-600">Patent #{patent.number}</div>
            <div className="text-xs text-gray-500">Inventors: {patent.inventors}</div>
            {patent.link && <a href={patent.link} className="text-xs text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View Patent</a>}
          </div>
        ))}
      </div>
    )
  })

  const TestScoresField = memo(({ items }: { items?: ResumeData['test_scores'] }) => {
    if ((!items || items.length === 0) && !isEditable) return null
    
    return (
      <div className="space-y-4">
        {(items || []).map((test, idx) => (
          <div key={idx} className="p-4 border border-gray-300 rounded-lg bg-white">
            <div className="flex justify-between items-center">
              <div className="font-semibold">{test.test_name}</div>
              <div className="text-sm text-gray-600">{test.score}</div>
            </div>
          </div>
        ))}
      </div>
    )
  })

  const CertificationsField = memo(({ items }: { items?: ResumeData['certifications'] }) => {
    if ((!items || items.length === 0) && !isEditable) return null
    
    return (
      <div className="space-y-4">
        {(items || []).map((cert, idx) => (
          <div key={idx} className="p-4 border border-gray-300 rounded-lg bg-white">
            <div className="font-semibold">{cert.name}</div>
            {cert.date_issued && <div className="text-sm text-gray-600">Issued: {cert.date_issued}</div>}
            {cert.link && <a href={cert.link} className="text-xs text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View Certificate</a>}
          </div>
        ))}
      </div>
    )
  })

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-1">{title}</h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )

  const Field = memo(({ label, value, onChange, type = 'text', multiline = false, isEditable }: {
    label: string
    value?: string
    onChange?: (value: string) => void
    type?: 'text' | 'email' | 'tel' | 'url' | 'link'
    multiline?: boolean
    isEditable?: boolean
  }) => {
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange?.(e.target.value)
    }, [onChange])

    return (
      <div className="flex flex-col sm:flex-row sm:items-start gap-2">
        <label className="text-sm font-medium text-gray-600 sm:w-32 flex-shrink-0 mt-1">
          {label}:
        </label>
        <div className="flex-1">
          {isEditable ? (
            multiline ? (
              <textarea
                value={value || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[80px]"
                rows={3}
              />
            ) : (
              <input
                type={type === 'link' ? 'url' : type}
                value={value || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )
          ) : (
            <div className="text-gray-800">
              {type === 'link' && value ? (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                  {value}
                </a>
              ) : (
                value || <span className="text-gray-400 italic">Not provided</span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  })

  return null
})

