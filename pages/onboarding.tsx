import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const router = useRouter()
  const [currentScreen, setCurrentScreen] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [userName, setUserName] = useState('')
  const [useCase, setUseCase] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [isEmailValid, setIsEmailValid] = useState<boolean>(false)
  const [referralSource, setReferralSource] = useState<string>('')
  const [welcomeText, setWelcomeText] = useState('')
  const [trustedText, setTrustedText] = useState('')
  const [showTrustedText, setShowTrustedText] = useState(false)
  const [currentTweetImage, setCurrentTweetImage] = useState('')
  const [showAllTweets, setShowAllTweets] = useState(false)
  const [showContinueButton, setShowContinueButton] = useState(false)
  const [trustedLabel, setTrustedLabel] = useState('')
  const [showTweetImage, setShowTweetImage] = useState(false)
  // Upload screen state
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadEnhancing, setUploadEnhancing] = useState(false)

  useEffect(() => {
    // Reset visibility and animate text appearance
    setIsVisible(false)
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [currentScreen])

  // Animation for first screen
  useEffect(() => {
    if (currentScreen === 0) {
      // Reset text states
      setWelcomeText('')
      setTrustedText('')
      setShowTrustedText(false)
      setShowContinueButton(false)
      setTrustedLabel('')
      setShowTweetImage(false)
      
      // Animate "Welcome to <typefolio>"
      const welcomeText = "Welcome to <typefolio>"
      let welcomeIndex = 0
      const welcomeInterval = setInterval(() => {
        if (welcomeIndex < welcomeText.length) {
          setWelcomeText(welcomeText.slice(0, welcomeIndex + 1))
          welcomeIndex++
        } else {
          clearInterval(welcomeInterval)
          // Start "Trusted" label animation after welcome is complete
          setTimeout(() => {
            animateTrustedLabel()
          }, 100)
        }
      }, 100)
      
      // Show continue button after 5 seconds regardless of animation state
      const continueTimer = setTimeout(() => {
        setShowContinueButton(true)
      }, 5000)
      
      return () => {
        clearInterval(welcomeInterval)
        clearTimeout(continueTimer)
      }
    }
  }, [currentScreen])

  const animateTrustedLabel = () => {
    const trustedText = "Trusted by"
    let charIndex = 0
    
    console.log('Starting Trusted by animation')
    
    const labelInterval = setInterval(() => {
      if (charIndex < trustedText.length) {
        const newText = trustedText.slice(0, charIndex + 1)
        console.log('Typing Trusted by:', newText, 'CharIndex:', charIndex)
        setTrustedLabel(newText)
        charIndex++
      } else {
        clearInterval(labelInterval)
        // Show "Trusted by" immediately after it finishes typing
        setShowTrustedText(true)
        // Start the names animation after a short delay
        setTimeout(() => {
          animateTrustedText()
        }, 500)
      }
    }, 100)
  }

  const animateTrustedText = () => {
    const names = ["Mark Zuckerberg", "Lex Fridman", "Naval Ravikant", "Roy Lee"]
    const tweetImages = ["/mark.png", "/lex.png", "/naval.png", "/roy.png"]
    let currentNameIndex = 0
    let currentCharIndex = 0
    let isDeleting = false
    
    console.log('Starting animateTrustedText with names:', names)
    console.log('Names array length:', names.length)
    console.log('Last name should be:', names[names.length - 1])
    
    const typeInterval = setInterval(() => {
      const currentName = names[currentNameIndex]
      
      if (isDeleting) {
        // Deleting effect
        if (currentCharIndex > 0) {
          setTrustedText(currentName.slice(0, currentCharIndex - 1))
          currentCharIndex--
          console.log('Deleting, remaining:', currentCharIndex)
        } else {
          // Finished deleting name, move to next name
          console.log('Finished deleting, moving to next name. Current index:', currentNameIndex, 'Next index:', currentNameIndex + 1)
          isDeleting = false
          currentNameIndex++
          currentCharIndex = 0 // Reset character index for next name
          if (currentNameIndex >= names.length) {
            console.log('Reached end of names array, stopping animation')
            clearInterval(typeInterval)
            return
          }
          console.log('Moving to name:', names[currentNameIndex])
          // Update tweet image for next name
          if (currentNameIndex < tweetImages.length) {
            setCurrentTweetImage(tweetImages[currentNameIndex])
          }
        }
      } else {
        // Typing effect
        if (currentCharIndex < currentName.length) {
          const newText = currentName.slice(0, currentCharIndex + 1)
          console.log('Typing:', newText, 'CharIndex:', currentCharIndex, 'Name:', currentName, 'NameLength:', currentName.length, 'CurrentNameIndex:', currentNameIndex)
          setTrustedText(newText)
          currentCharIndex++
        } else {
          // Finished typing current name
          console.log('Finished typing:', currentName, 'at index:', currentNameIndex)
          
          // Don't delete the final "Roy Lee"
          if (currentNameIndex === names.length - 1) {
            console.log('Reached "Roy Lee", continuing to "literally everyone"')
            // After "Roy Lee", show "literally everyone"
            setTimeout(() => {
              setTrustedText("literally everyone")
              setShowAllTweets(true)
            }, 1000)
            clearInterval(typeInterval)
            return
          }
          
          // For other names, start deleting after a pause
          setTimeout(() => {
            isDeleting = true
          }, 1000)
        }
      }
    }, 100)
    
    // Set initial tweet image with smooth animation
    setCurrentTweetImage(tweetImages[0])
    setTimeout(() => {
      setShowTweetImage(true)
    }, 200) // Small delay for smooth fade-in
  }

  // Generate marquee positions for all tweets
  const generateMarqueePositions = (): Array<{x: number}> => {
    const positions: Array<{x: number}> = []
    const imageWidth = 400 // Same size as original card
    const spacing = 50 // Space between cards
    
    for (let i = 0; i < 12; i++) {
      positions.push({
        x: i * (imageWidth + spacing)
      })
    }
    
    return positions
  }

  const handleNext = () => {
    console.log('handleNext called:', { currentScreen, useCase, email, referralSource })
    
    if (currentScreen < 2) {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentScreen(currentScreen + 1)
      }, 200)
    } else if (currentScreen === 2) {
      // Name input screen - validate and continue
      if (userName.trim()) {
        setIsVisible(false)
        setTimeout(() => {
          setCurrentScreen(currentScreen + 1)
        }, 200)
      }
    } else if (currentScreen === 3) {
      // Video screen - continue to next
      setIsVisible(false)
      setTimeout(() => {
        setCurrentScreen(currentScreen + 1)
      }, 200)
    } else if (currentScreen === 4) {
      // Use case question screen - if user has made a choice, proceed
      console.log('Screen 4 - useCase:', useCase)
      if (useCase) {
        setIsVisible(false)
        setTimeout(() => {
          setCurrentScreen(currentScreen + 1)
        }, 200)
      }
    } else if (currentScreen === 5) {
      // Referral question screen - if user has made a choice, proceed to embedded upload
      console.log('Screen 5 - referralSource:', referralSource)
      if (referralSource) {
        if (userName.trim()) {
          sessionStorage.setItem('userName', userName.trim())
        }
        sessionStorage.setItem('useCase', useCase)
        sessionStorage.setItem('email', email.trim())
        sessionStorage.setItem('referralSource', referralSource)
        setIsVisible(false)
        setTimeout(() => setCurrentScreen(6), 200)
      }
    }
  }

  const handleUseCaseChoice = (useCaseOption: string) => {
    console.log('Use case choice selected:', useCaseOption)
    setUseCase(useCaseOption)
  }

  const handleReferralChoice = (source: string) => {
    console.log('Referral choice selected:', source)
    setReferralSource(source)
  }

  const screens = [
    {
      title: "Welcome to Typefolio",
      subtitle: "",
      content: "",
      showInput: false
    },
    {
      title: "What's your name?",
      subtitle: "We'll personalize your experience",
      content: "",
      showInput: true
    },
    {
      title: "Use <typefolio>",
      subtitle: "Let's get straight to it",
      content: "",
      showInput: false,
      showVideo: true
    },
    {
      title: "What do you need it for?",
      subtitle: "",
      content: "",
      showInput: false,
      showUseCaseOptions: true
    },
    {
      title: "What is your email?",
      subtitle: "We'll send you updates about your portfolio",
      content: "",
      showInput: true,
      showEmailInput: true
    },
    {
      title: "Where did you find out about us?",
      subtitle: "",
      content: "",
      showInput: false,
      showReferralOptions: true
    },
    {
      title: "Upload your resume",
      subtitle: "",
      content: "",
      showUpload: true
    }
  ]

  const currentScreenData = screens[currentScreen] || screens[0]

  // Jump to referral screen if directed from upload page
  useEffect(() => {
    const startAtReferral = sessionStorage.getItem('startAtReferral')
    if (startAtReferral) {
      sessionStorage.removeItem('startAtReferral')
      setCurrentScreen(5) // referral screen index
    }
  }, [])



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

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="max-w-4xl w-full">
          {/* Screen Content */}
          <div className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Title */}
            <div className="w-full flex justify-center">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-medium mb-8 leading-tight text-center whitespace-nowrap mx-auto w-fit" style={{ fontFamily: 'Roboto, sans-serif' }}>
                {currentScreen === 0 ? welcomeText : (currentScreenData?.title || 'Welcome to <typefolio>')}
              </h1>
            </div>

            {/* Trusted text for first screen */}
            {currentScreen === 0 && (showTrustedText || trustedLabel) && (
              <p className="text-2xl md:text-3xl text-white mb-12 text-center">
                <span className="text-gray-500">{trustedLabel}</span> {trustedText}
              </p>
            )}

            {/* Tweet image for first screen */}
            {currentScreen === 0 && showTrustedText && currentTweetImage && !showAllTweets && showTweetImage && (
              <div className="flex justify-center mb-12">
                <div className="relative overflow-hidden rounded-lg shadow-lg border-2 border-white transition-opacity duration-700 ease-in-out">
                  <img 
                    src={currentTweetImage} 
                    alt="Tweet" 
                    className="max-w-lg md:max-w-xl rounded-lg"
                    onError={(e) => {
                      console.error('Failed to load image:', currentTweetImage)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-shine"></div>
                </div>
              </div>
            )}

            {/* All tweets for "literally everyone" */}
            {currentScreen === 0 && showAllTweets && (
              <div className="flex justify-center mb-12 overflow-hidden">
                <div className="flex animate-marquee">
                  {(() => {
                    const tweetImages = [
                      "/mark.png", "/andrew.png", "/balaji.png", "/cory.png", "/garry.png", 
                      "/jonathan.png", "/levels.png", "/lex.png", "/naval.png", "/joowon.png", 
                      "/shaan.png", "/roy.png"
                    ]
                    
                    return tweetImages.map((image, index) => (
                      <div
                        key={index}
                        className="mx-6 flex-shrink-0"
                      >
                        <div className="relative overflow-hidden rounded-lg shadow-2xl border-2 border-white transition-opacity duration-700 ease-in-out">
                          <img 
                            src={image} 
                            alt="Tweet" 
                            className="max-w-lg md:max-w-xl rounded-lg"
                            onError={(e) => {
                              console.error('Failed to load image:', image)
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-shine"></div>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}

            {/* Subtitle */}
            {currentScreenData?.subtitle && (
              <p className="text-xl text-gray-400 mb-8 text-center">
                {currentScreenData.subtitle}
              </p>
            )}

            {/* Content */}
            {currentScreenData?.content && (
              <p className="text-lg text-gray-300 leading-relaxed mb-12 text-center">
                {currentScreenData.content}
              </p>
            )}

            {/* Video */}
            {currentScreenData?.showVideo && (
              <div className="flex justify-center items-center mb-12">
                <video 
                  autoPlay 
                  muted 
                  playsInline
                  className="max-w-sm md:max-w-md lg:max-w-lg rounded-lg shadow-lg"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                  onError={(e) => {
                    console.error('Video failed to load:', e)
                  }}
                  onLoadStart={() => {
                    console.log('Video loading started')
                  }}
                  onCanPlay={() => {
                    console.log('Video can play')
                  }}
                >
                  <source src="/B.mov" type="video/quicktime" />
                  <source src="/B.mov" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* Embedded Upload Screen */}
            {currentScreenData?.showUpload && (
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-10 mb-8 border border-gray-600">
                <div className="border-2 border-dashed border-gray-500 rounded-xl p-16 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setFileName(file.name)
                      setUploadLoading(true)

                      const reader = new FileReader()
                      reader.onloadend = async () => {
                        try {
                          const dataUrl = reader.result as string
                          const res = await fetch('/api/parse-resume', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ dataUrl }),
                          })
                          const data = await res.json()
                          if (!res.ok) {
                            throw new Error(data.error || 'Failed to parse resume')
                          }
                          if (!data.extractedJson) {
                            throw new Error('No JSON data extracted from resume')
                          }
                          if (data.extractedJson.parsing_error) {
                            alert(`⚠️ ${data.extractedJson.parsing_error}\n\nYou can edit the data manually before creating your website.`)
                          }
                          sessionStorage.setItem('fileName', file.name)
                          sessionStorage.setItem('parsedText', data.parsedText || 'Text extraction failed')
                          sessionStorage.setItem('resumeJson', JSON.stringify(data.extractedJson))

                          setUploadEnhancing(true)
                          try {
                            const enhanceRes = await fetch('/api/refine-resume', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ resumeJson: data.extractedJson }),
                            })
                            if (!enhanceRes.ok) {
                              throw new Error(`Enhancement failed: ${enhanceRes.status} ${enhanceRes.statusText}`)
                            }
                            const responseText = await enhanceRes.text()
                            let enhancedData
                            try {
                              enhancedData = JSON.parse(responseText)
                            } catch (jsonError) {
                              console.error('Failed to parse enhancement response:', responseText)
                              throw new Error('Server returned invalid JSON response')
                            }
                            sessionStorage.setItem('refinedResumeJson', JSON.stringify(enhancedData))
                          } catch (enhanceErr: any) {
                            console.error('Enhancement error:', enhanceErr)
                            alert(`Enhancement failed: ${enhanceErr.message}. The basic extracted data will be used instead.`)
                          } finally {
                            setUploadEnhancing(false)
                            setUploadLoading(false)
                            // Navigate to processing after upload
                            router.push('/processing')
                          }
                        } catch (err) {
                          console.error(err)
                          alert((err as Error).message)
                          setUploadLoading(false)
                        }
                      }
                      reader.readAsDataURL(file)
                    }}
                    disabled={uploadLoading || uploadEnhancing}
                    className="hidden"
                    id="onboarding-resume-upload"
                  />
                  <label
                    htmlFor="onboarding-resume-upload"
                    className={`cursor-pointer block ${uploadLoading || uploadEnhancing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-8xl mb-6">📄</div>
                    <h3 className="text-2xl font-semibold text-white mb-3" style={{ fontFamily: 'Roboto, sans-serif' }}>
                      Upload your resume
                    </h3>
                    <p className="text-gray-300 text-lg" style={{ fontFamily: 'Roboto, sans-serif' }}>
                      Supports PDF files
                    </p>
                  </label>
                </div>

                {uploadLoading && (
                  <div className="mt-6 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto"></div>
                    <p className="mt-3 text-gray-300 text-lg" style={{ fontFamily: 'Roboto, sans-serif' }}>Uploading and preparing...</p>
                  </div>
                )}
              </div>
            )}

            {/* Input Field for Name */}
            {currentScreenData?.showInput && !currentScreenData?.showEmailInput && (
              <div className="mb-12 flex justify-center">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full max-w-md bg-transparent border-b-2 border-white text-white text-xl py-2 px-0 focus:outline-none focus:border-gray-400 transition-colors placeholder-gray-500 text-center"
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                  autoFocus
                />
              </div>
            )}

            {/* Input Field for Email */}
            {currentScreenData?.showEmailInput && (
              <div className="mb-12 flex justify-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value
                    setEmail(value)
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    setIsEmailValid(emailRegex.test(value))
                  }}
                  placeholder="Enter your email"
                  className={`w-full max-w-md bg-transparent border-b-2 text-white text-xl py-2 px-0 focus:outline-none transition-colors placeholder-gray-500 text-center ${isEmailValid || email.length === 0 ? 'border-white focus:border-gray-400' : 'border-red-500 focus:border-red-500'}`}
                  style={{ fontFamily: 'Roboto, sans-serif' }}
                  autoFocus
                />
              </div>
            )}

            {/* Use Case Options */}
            {currentScreenData?.showUseCaseOptions && (
              <div className="mb-12 flex justify-center">
                <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
                  {['School', 'Work', 'Personal', 'Why not?'].map((useCaseOption) => (
                    <button
                      key={useCaseOption}
                      onClick={() => handleUseCaseChoice(useCaseOption)}
                      className={`flex flex-col items-center justify-center py-6 px-4 rounded-lg border-2 transition-colors ${
                        useCase === useCaseOption 
                          ? 'border-white bg-white text-black' 
                          : 'border-white text-white hover:bg-white hover:text-black'
                      }`}
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    >
                      <span className="text-lg font-medium text-center">{useCaseOption}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Referral Options */}
            {currentScreenData?.showReferralOptions && (
              <div className="mb-12 flex justify-center">
                <div className="grid grid-cols-4 gap-4 max-w-4xl w-full">
                  {[
                    { name: 'ProductHunt', logo: '/producthuntlogo.png' },
                    { name: 'X/Twitter', logo: '/XLogo.jpeg' },
                    { name: 'LinkedIn', logo: '/linkedinLogo.jpeg' },
                    { name: 'Friend', logo: '/friendLogo.png' },
                    { name: 'YouTube', logo: '/YouTubeLogo.png' },
                    { name: 'TikTok', logo: '/tiktokLogo.png' },
                    { name: 'Instagram', logo: '/instagramLogo.png' },
                    { name: 'Google', logo: '/googlelogo.png' }
                  ].map(({ name, logo }) => (
                    <button
                      key={name}
                      onClick={() => handleReferralChoice(name)}
                      className={`flex flex-col items-center justify-center py-6 px-4 rounded-lg border-2 transition-colors ${
                        referralSource === name 
                          ? 'border-white bg-white text-black' 
                          : 'border-white text-white hover:bg-white hover:text-black'
                      }`}
                      style={{ fontFamily: 'Roboto, sans-serif' }}
                    >
                      <img 
                        src={logo} 
                        alt={`${name} logo`}
                        className="w-12 h-12 mb-3 object-contain"
                        onError={(e) => {
                          console.error('Failed to load logo:', logo)
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <span className="text-sm text-center">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-center gap-6">
              {currentScreen === 0 ? (
                // Show continue button only after "literally everyone" is displayed
                showContinueButton && (
                  <button
                    onClick={handleNext}
                    className="px-12 py-4 rounded-lg font-medium transition-colors text-lg bg-white text-black hover:bg-gray-200"
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                  >
                    Continue
                  </button>
                )
              ) : (
                !currentScreenData?.showUpload && (
                  <button
                    onClick={handleNext}
                    className={`px-12 py-4 rounded-lg font-medium transition-colors text-lg ${
                      currentScreenData?.showReferralOptions 
                        ? (referralSource 
                            ? 'bg-white text-black hover:bg-gray-200' 
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed')
                        : currentScreenData?.showUseCaseOptions
                        ? (useCase 
                            ? 'bg-white text-black hover:bg-gray-200' 
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed')
                        : currentScreenData?.showEmailInput
                        ? (isEmailValid 
                            ? 'bg-white text-black hover:bg-gray-200' 
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed')
                        : currentScreenData?.showInput && !currentScreenData?.showEmailInput
                        ? (userName.trim() 
                            ? 'bg-white text-black hover:bg-gray-200' 
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed')
                        : 'bg-white text-black hover:bg-gray-200'
                    }`}
                    style={{ fontFamily: 'Roboto, sans-serif' }}
                    disabled={(currentScreenData?.showReferralOptions && !referralSource) || (currentScreenData?.showUseCaseOptions && !useCase) || (currentScreenData?.showEmailInput && !isEmailValid) || (currentScreenData?.showInput && !currentScreenData?.showEmailInput && !userName.trim())}
                  >
                    Continue
                  </button>
                )
              )}
              
              {currentScreen > 0 && (
                <button
                  onClick={() => {
                    setIsVisible(false)
                    setTimeout(() => {
                      setCurrentScreen(currentScreen - 1)
                    }, 200)
                  }}
                  className="text-white hover:text-gray-300 transition-colors text-lg"
                >
                  Back
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {screens.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentScreen ? 'bg-white' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  )
} 