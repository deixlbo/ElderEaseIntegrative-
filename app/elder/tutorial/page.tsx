'use client'
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  Search, 
  Share2, 
  Languages, 
  Mic, 
  CheckCircle, 
  PlayCircle,
  X,
  Send,
  Bot,
  ExternalLink,
  Volume2,
  Home,
  User,
  Calendar,
  BookOpen,
  Menu,
  Star,
  Clock,
  ChevronRight,
  Zap,
  Sparkles,
  MessageSquare,
  Video,
  Camera,
  Mail,
  Phone,
  Users,
  Music,
  Globe,
  Image as ImageIcon,
  ThumbsUp,
  Repeat,
  UserPlus,
  UserMinus,
  FolderPlus,
  Trash2,
  Filter,
  Heart,
  Trophy,
  Target,
  Bookmark
} from "lucide-react"

// Types for tutorial progress and favorites
interface TutorialProgress {
  tutorialId: string
  status: 'not-started' | 'in-progress' | 'completed'
  progress: number // 0-100
  lastAccessed: Date
  timeSpent: number // in minutes
  completedSteps: number[]
}

interface FavoriteTutorial {
  tutorialId: string
  platform: string
  addedAt: Date
}

// Extended language terms with modern words
const languageTerms = [
  // Modern Slang
  { word: "Stan", pronunciation: "stan", meaning: "To be a big fan or supporter of someone" },
  { word: "Flex", pronunciation: "fleks", meaning: "To show off" },
  { word: "Lowkey", pronunciation: "loh-kee", meaning: "Secretly or quietly feeling something" },
  { word: "Highkey", pronunciation: "hai-kee", meaning: "Openly or obviously feeling something" },
  { word: "Ghosting", pronunciation: "gos-ting", meaning: "Ignoring or cutting off communication suddenly" },
  { word: "Simp", pronunciation: "simp", meaning: "Someone who tries too hard to please someone they like" },
  { word: "Cringe", pronunciation: "krinj", meaning: "Awkward or embarrassing" },
  { word: "Lit", pronunciation: "lit", meaning: "Exciting or amazing" },
  { word: "Sus", pronunciation: "sas", meaning: "Suspicious" },
  { word: "Boujee", pronunciation: "boo-zhee", meaning: "Loves expensive or classy things" },
  { word: "Vibe", pronunciation: "vaib", meaning: "Mood or feeling of a place" },
  { word: "No cap", pronunciation: "noh-kap", meaning: "No lie / truthfully" },
  { word: "Slay", pronunciation: "slay", meaning: "Did something amazingly well" },
  { word: "Drip", pronunciation: "drip", meaning: "Stylish outfit" },
  { word: "Bussin", pronunciation: "bus-in", meaning: "Very delicious" },
  
  // Tech Terms
  { word: "AI", pronunciation: "ay-ai", meaning: "Artificial Intelligence - technology that mimics human intelligence" },
  { word: "VPN", pronunciation: "vee-pee-en", meaning: "Virtual Private Network - tool to protect privacy online" },
  { word: "NFT", pronunciation: "en-eff-tee", meaning: "Non-Fungible Token - digital collectible" },
  { word: "Metaverse", pronunciation: "me-ta-vurs", meaning: "Virtual world for interaction" },
  { word: "Cloud", pronunciation: "klawd", meaning: "Online storage system" },
  
  // Classic Internet Terms
  { word: "LMAO", pronunciation: "el-mao", meaning: "Laughing My Ass Off - used to indicate great amusement" },
  { word: "BRB", pronunciation: "bee-ar-bee", meaning: "Be Right Back - indicating a temporary absence" },
  { word: "AFK", pronunciation: "ay-eff-kay", meaning: "Away From Keyboard - not present" },
  { word: "ICYMI", pronunciation: "ai-see-wai-em-ai", meaning: "In Case You Missed It" },
  { word: "IYKYK", pronunciation: "ai-wai-kay-wai-kay", meaning: "If You Know, You Know" }
]

// Color theme
const PRIMARY_COLOR = "#10b981" // Emerald green
const SECONDARY_COLOR = "#059669" // Darker emerald
const LIGHT_GREEN = "#d1fae5"
const DARK_GREEN = "#047857"

// Pronunciation function
const speakWord = (text: string, rate = 0.8) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = 1
    utterance.volume = 1
    window.speechSynthesis.speak(utterance)
  } else {
    alert("Text-to-speech not supported in this browser")
  }
}

// Voice recognition hook
const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        let text = event.results[0][0].transcript
        // Remove punctuation and clean the transcript
        text = text.replace(/[.,!?;:]/g, '').trim()
        setTranscript(text)
        setIsListening(false)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript("")
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  return { isListening, transcript, startListening, stopListening }
}

// Progress tracking system
class TutorialProgressTracker {
  private static STORAGE_KEY = 'elder_tutorial_progress'
  private static FAVORITES_KEY = 'elder_tutorial_favorites'

  static getProgress(): TutorialProgress[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(this.STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  static saveProgress(progress: TutorialProgress[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress))
  }

  static updateProgress(tutorialId: string, updates: Partial<TutorialProgress>) {
    const progress = this.getProgress()
    const existing = progress.find(p => p.tutorialId === tutorialId)
    
    if (existing) {
      Object.assign(existing, updates)
      existing.lastAccessed = new Date()
    } else {
      progress.push({
        tutorialId,
        status: 'not-started',
        progress: 0,
        lastAccessed: new Date(),
        timeSpent: 0,
        completedSteps: [],
        ...updates
      })
    }
    
    this.saveProgress(progress)
    return progress.find(p => p.tutorialId === tutorialId)!
  }

  static markAsStarted(tutorialId: string) {
    return this.updateProgress(tutorialId, {
      status: 'in-progress',
      progress: 10
    })
  }

  static markAsCompleted(tutorialId: string) {
    return this.updateProgress(tutorialId, {
      status: 'completed',
      progress: 100
    })
  }

  static updateVideoProgress(tutorialId: string, currentTime: number, duration: number) {
    const progressPercent = Math.min(100, Math.round((currentTime / duration) * 100))
    const existing = this.getProgress().find(p => p.tutorialId === tutorialId)
    
    if (existing) {
      // Only update if progress increased
      if (progressPercent > existing.progress) {
        return this.updateProgress(tutorialId, {
          progress: progressPercent,
          status: progressPercent === 100 ? 'completed' : 'in-progress'
        })
      }
    } else {
      return this.updateProgress(tutorialId, {
        progress: progressPercent,
        status: progressPercent > 0 ? 'in-progress' : 'not-started'
      })
    }
    
    return existing
  }

  static getFavorites(): FavoriteTutorial[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(this.FAVORITES_KEY)
    return data ? JSON.parse(data) : []
  }

  static toggleFavorite(tutorialId: string, platform: string) {
    const favorites = this.getFavorites()
    const existingIndex = favorites.findIndex(f => f.tutorialId === tutorialId)
    
    if (existingIndex > -1) {
      favorites.splice(existingIndex, 1)
    } else {
      favorites.push({
        tutorialId,
        platform,
        addedAt: new Date()
      })
    }
    
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites))
    return existingIndex === -1 // Returns true if added, false if removed
  }

  static isFavorite(tutorialId: string): boolean {
    const favorites = this.getFavorites()
    return favorites.some(f => f.tutorialId === tutorialId)
  }

  static getUserStats() {
    const progress = this.getProgress()
    const completedTutorials = progress.filter(p => p.status === 'completed')
    const inProgressTutorials = progress.filter(p => p.status === 'in-progress')
    
    return {
      totalTutorials: progress.length,
      completedTutorials: completedTutorials.length,
      inProgressTutorials: inProgressTutorials.length,
      totalTimeSpent: progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0)
    }
  }
}

// Enhanced chatbot
function AIChatbot({ 
  currentContext,
  onNavigate
}: { 
  currentContext: string
  onNavigate: (platform: string, tutorialIndex: number) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant', 
    content: string,
    tutorialLink?: { platform: string, tutorialIndex: number, tutorial: any },
    tutorialLinks?: Array<{ platform: string, tutorialIndex: number, tutorial: any }>,
    languageTerm?: { word: string, pronunciation: string, meaning: string }
  }>>([
    { 
      role: 'assistant', 
      content: "Hi! I'm your learning assistant. You can ask me:\n\n📱 **Tutorials**: 'How to send message on Instagram?'\n💬 **Language**: 'What does stan mean?'\n\nTry asking anything about the tutorials!" 
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isListening, transcript, startListening, stopListening } = useVoiceRecognition()

  useEffect(() => {
    if (transcript) {
      setInput(transcript)
      setTimeout(() => {
        handleSend()
      }, 500)
    }
  }, [transcript])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const findAllTutorialsByKeyword = (query: string) => {
    const lowerQuery = query.toLowerCase().trim()
    const results: Array<{ platform: string, tutorialIndex: number, tutorial: any }> = []

    for (const [platform, tutorials] of Object.entries(tutorialData)) {
      for (let i = 0; i < tutorials.length; i++) {
        const tutorial = tutorials[i]
        const titleLower = tutorial.title.toLowerCase()
        const descLower = tutorial.desc.toLowerCase()
        
        if (titleLower.includes(lowerQuery) || 
            descLower.includes(lowerQuery) ||
            tutorial.steps.some((step: string) => step.toLowerCase().includes(lowerQuery))) {
          results.push({ platform, tutorialIndex: i, tutorial })
        }
      }
    }

    return results
  }

  const getTutorialSuggestions = (query: string) => {
    const lowerQuery = query.toLowerCase().trim()
    const allTutorials: Array<{ platform: string, tutorialIndex: number, tutorial: any }> = []
    
    for (const [platform, tutorials] of Object.entries(tutorialData)) {
      for (let i = 0; i < tutorials.length; i++) {
        allTutorials.push({ platform, tutorialIndex: i, tutorial: tutorials[i] })
      }
    }
    
    const exactMatches = allTutorials.filter(item => 
      item.tutorial.title.toLowerCase().includes(lowerQuery)
    )
    
    if (exactMatches.length > 0) {
      return exactMatches.slice(0, 5)
    }
    
    const keywords = lowerQuery.split(' ').filter(word => word.length > 2)
    const suggestions = allTutorials.filter(item => {
      const titleWords = item.tutorial.title.toLowerCase().split(/[\s\-]+/)
      return keywords.some(keyword => 
        titleWords.some(word => word.includes(keyword))
      )
    })
    
    return suggestions.slice(0, 5)
  }

  const getAIResponse = async (userMessage: string) => {
    await new Promise(resolve => setTimeout(resolve, 700))

    const lowerMessage = userMessage.toLowerCase().trim()
    
    // Language queries
    if (lowerMessage.includes('what does') || 
        lowerMessage.includes('meaning of') ||
        lowerMessage.includes('mean?') ||
        lowerMessage.includes('pronounce')) {
      
      const words = userMessage.split(' ')
      const potentialWord = words.find(word => 
        languageTerms.some(term => 
          term.word.toLowerCase() === word.toLowerCase().replace('?', '').replace('"', '') ||
          term.pronunciation.toLowerCase().includes(word.toLowerCase().replace('?', '').replace('"', ''))
        )
      ) || words[words.length - 1].replace('?', '').replace('"', '')
      
      const term = languageTerms.find(t => 
        t.word.toLowerCase() === potentialWord.toLowerCase() ||
        t.pronunciation.toLowerCase().includes(potentialWord.toLowerCase())
      )
      
      if (term) {
        return {
          content: `**${term.word}**\n\n📢 Pronunciation: /${term.pronunciation}/\n\n📖 Meaning: ${term.meaning}\n\nClick the speaker button to hear the pronunciation!`,
          languageTerm: term
        }
      }
    }
    
    // Tutorial search
    if (lowerMessage.length > 0) {
      const allMatches = findAllTutorialsByKeyword(lowerMessage)
      const suggestions = getTutorialSuggestions(lowerMessage)
      
      if (allMatches.length > 0 || suggestions.length > 0) {
        const combinedResults = [...allMatches, ...suggestions.filter(s => 
          !allMatches.some(m => m.tutorial.id === s.tutorial.id)
        )]
        
        const uniqueResults = combinedResults.reduce((acc, current) => {
          const x = acc.find(item => item.tutorial.id === current.tutorial.id)
          if (!x) {
            return acc.concat([current])
          } else {
            return acc
          }
        }, [] as typeof combinedResults)
        
        if (uniqueResults.length === 1) {
          const match = uniqueResults[0]
          return {
            content: `I found this tutorial for you: **"${match.tutorial.title}"** on ${platformData[match.platform as keyof typeof platformData].name}.\n\n${match.tutorial.desc}\n\nClick below to watch the tutorial!`,
            tutorialLink: match
          }
        } else if (uniqueResults.length > 1) {
          let response = `I found ${uniqueResults.length} tutorials related to "${userMessage}":\n\n`
          
          const groupedResults: Record<string, typeof uniqueResults> = {}
          uniqueResults.forEach(result => {
            if (!groupedResults[result.platform]) {
              groupedResults[result.platform] = []
            }
            groupedResults[result.platform].push(result)
          })
          
          Object.entries(groupedResults).forEach(([platform, tutorials]) => {
            response += `**${platformData[platform as keyof typeof platformData].name}:**\n`
            tutorials.forEach((tutorial, index) => {
              response += `• ${tutorial.tutorial.title}\n`
            })
            response += '\n'
          })
          
          return {
            content: response,
            tutorialLinks: uniqueResults.slice(0, 10)
          }
        }
      }
    }

    // Default response
    return {
      content: "I can help you with:\n\n📱 **Tutorials** - Search for how-to guides\n💬 **Language** - Learn modern terms\n\nTry asking: 'How to send message on Facebook?' or 'What does stan mean?'"
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsTyping(true)

    try {
      const response = await getAIResponse(userMessage)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.content,
        tutorialLink: response.tutorialLink,
        tutorialLinks: response.tutorialLinks,
        languageTerm: response.languageTerm
      }])
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble responding right now. Please try again!" 
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTutorialClick = (tutorialLink: any) => {
    onNavigate(tutorialLink.platform, tutorialLink.tutorialIndex)
    setIsOpen(false)
  }

  const handlePronunciation = (term: any) => {
    speakWord(term.word)
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl hover:shadow-2xl transition-all z-50 animate-pulse"
          style={{ 
            backgroundColor: PRIMARY_COLOR,
            boxShadow: `0 10px 25px ${PRIMARY_COLOR}40`
          }}
          size="lg"
        >
          <Bot className="h-7 w-7" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col border-2 border-emerald-200 rounded-2xl bg-white overflow-hidden">
          {/* Header */}
          <div className="p-4 rounded-t-xl flex items-center justify-between border-b"
            style={{ 
              backgroundColor: PRIMARY_COLOR,
              background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
            }}
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold">Learning Assistant</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-100">Online</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-2">
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'text-white shadow-md'
                      : 'bg-emerald-50 text-gray-800 shadow-sm'
                  }`}
                  style={msg.role === 'user' ? { 
                    backgroundColor: PRIMARY_COLOR,
                    background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
                  } : {}}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    
                    {/* Language Term Display */}
                    {msg.languageTerm && (
                      <div className="mt-3 p-3 bg-white/20 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-lg" style={{ color: PRIMARY_COLOR }}>
                            {msg.languageTerm.word}
                          </span>
                          <Button
                            onClick={() => handlePronunciation(msg.languageTerm)}
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0 rounded-full bg-white shadow-sm"
                          >
                            <Volume2 className="h-4 w-4" style={{ color: PRIMARY_COLOR }} />
                          </Button>
                        </div>
                        <div className="text-sm space-y-2">
                          <p className="flex items-center gap-2">
                            <span className="font-semibold">Pronunciation:</span>
                            <span className="font-mono bg-emerald-100 px-2 py-1 rounded">/{msg.languageTerm.pronunciation}/</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="font-semibold">Meaning:</span>
                            <span>{msg.languageTerm.meaning}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Tutorial Links */}
                {msg.tutorialLink && (
                  <div className="flex justify-start ml-2">
                    <Button
                      onClick={() => handleTutorialClick(msg.tutorialLink)}
                      className="gap-2 text-white shadow-sm hover:shadow-md transition-shadow"
                      size="sm"
                      style={{ 
                        backgroundColor: PRIMARY_COLOR,
                        background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
                      }}
                    >
                      <PlayCircle className="h-4 w-4" />
                      Watch Tutorial
                    </Button>
                  </div>
                )}

                {msg.tutorialLinks && msg.tutorialLinks.length > 0 && (
                  <div className="mt-3 ml-2 space-y-2 max-h-48 overflow-y-auto pr-2">
                    <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                      <Sparkles className="h-3 w-3" style={{ color: PRIMARY_COLOR }} />
                      Suggested tutorials ({msg.tutorialLinks.length}):
                    </div>
                    {msg.tutorialLinks.map((link, i) => (
                      <Button 
                        key={i} 
                        onClick={() => handleTutorialClick(link)} 
                        size="sm" 
                        className="justify-start gap-3 w-full text-left h-auto py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all hover:scale-[1.02]"
                        variant="ghost"
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0" style={{ color: PRIMARY_COLOR }} />
                        <div className="flex flex-col items-start overflow-hidden">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-5 h-5 rounded flex items-center justify-center text-xs text-white"
                              style={{ backgroundColor: platformData[link.platform as keyof typeof platformData].color }}
                            >
                              <i className={platformData[link.platform as keyof typeof platformData].icon}></i>
                            </div>
                            <span className="text-xs font-semibold text-gray-700">
                              {platformData[link.platform as keyof typeof platformData].name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600 truncate mt-1">{link.tutorial.title}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-emerald-50 rounded-2xl p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input with Voice */}
          <div className="p-4 border-t border-emerald-200 bg-white">
            <div className="flex gap-2">
              <Button
                onClick={isListening ? stopListening : startListening}
                size="icon"
                variant={isListening ? "destructive" : "outline"}
                className="flex-shrink-0 border-emerald-300 hover:border-emerald-400"
                style={isListening ? { backgroundColor: '#ef4444' } : {}}
              >
                <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Listening..." : "Type or speak your question..."}
                className="flex-1 text-sm rounded-xl border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200"
              />
              <Button 
                onClick={handleSend} 
                size="icon"
                className="text-white shadow-sm hover:shadow-md"
                style={{ 
                  backgroundColor: PRIMARY_COLOR,
                  background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {isListening && (
              <div className="mt-2 text-xs text-center text-red-600 animate-pulse">
                🎤 Listening... Speak now
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  )
}

// Tutorial Card Component
function TutorialCard({ 
  tutorial, 
  platform, 
  index, 
  onClick,
  isFavorite: initialFavorite,
  onFavoriteToggle
}: { 
  tutorial: any
  platform: string
  index: number
  onClick: () => void
  isFavorite?: boolean
  onFavoriteToggle?: () => void
}) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite || false)
  const progress = TutorialProgressTracker.getProgress().find(p => p.tutorialId === tutorial.id)
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const added = TutorialProgressTracker.toggleFavorite(tutorial.id, platform)
    setIsFavorite(added)
    onFavoriteToggle?.()
  }
  
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden border border-emerald-200 bg-white"
    >
      {/* Progress Status Badge */}
      {progress && progress.status !== 'not-started' && (
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-sm z-10 ${
          progress.status === 'completed' ? 'text-white shadow-emerald-200' :
          progress.status === 'in-progress' ? 'text-white shadow-emerald-200' :
          'bg-gray-100 text-gray-700'
        }`}
        style={progress.status === 'completed' || progress.status === 'in-progress' ? 
          { 
            backgroundColor: PRIMARY_COLOR,
            background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
          } : {}
        }
        >
          {progress.status === 'completed' ? '✅ Completed' : 
           progress.status === 'in-progress' ? `🎯 ${progress.progress}%` : '📝 Start'}
        </div>
      )}
      
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ 
                backgroundColor: platformData[platform as keyof typeof platformData].color,
                background: `linear-gradient(135deg, ${platformData[platform as keyof typeof platformData].color}, ${platformData[platform as keyof typeof platformData].color}dd)`
              }}
            >
              <i className={`${platformData[platform as keyof typeof platformData].icon} text-lg`}></i>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500">
                {platformData[platform as keyof typeof platformData].name}
              </span>
              <h3 className="font-bold text-lg text-gray-800 group-hover:text-emerald-700 transition-colors">
                {tutorial.title}
              </h3>
            </div>
          </div>
          
          <Button
            onClick={handleFavoriteClick}
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full"
          >
            {isFavorite ? (
              <Star className="h-5 w-5 fill-amber-500" />
            ) : (
              <Star className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-2">{tutorial.desc}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {Math.ceil(tutorial.duration / 60)} min
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              {tutorial.steps.length} steps
            </span>
          </div>
          
          {progress && progress.status !== 'not-started' && (
            <div className="w-24">
              <Progress 
                value={progress.progress} 
                className="h-2 bg-emerald-100" 
                style={{ backgroundColor: LIGHT_GREEN }}
              />
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Card>
  )
}

// Search Suggestions Component
function SearchSuggestions({ query, onSelect }: { query: string, onSelect: (suggestion: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }
    
    const lowerQuery = query.toLowerCase()
    const allTitles: string[] = []
    
    // Collect all tutorial titles
    for (const tutorials of Object.values(tutorialData)) {
      for (const tutorial of tutorials) {
        allTitles.push(tutorial.title)
      }
    }
    
    // Find titles that contain the query
    const matchingTitles = allTitles.filter(title => 
      title.toLowerCase().includes(lowerQuery)
    )
    
    // Remove duplicates and limit to 5
    const uniqueSuggestions = [...new Set(matchingTitles)].slice(0, 5)
    setSuggestions(uniqueSuggestions)
  }, [query])
  
  if (suggestions.length === 0) return null
  
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-emerald-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto backdrop-blur-sm">
      <div className="p-3 text-xs text-gray-500 font-medium border-b border-emerald-100 flex items-center gap-2">
        <Sparkles className="h-3 w-3" style={{ color: PRIMARY_COLOR }} />
        Tutorial Suggestions
      </div>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-sm text-gray-700 flex items-center gap-2 transition-colors"
        >
          <Search className="h-3 w-3" style={{ color: PRIMARY_COLOR }} />
          <span className="truncate">{suggestion}</span>
        </button>
      ))}
    </div>
  )
}

// TUTORIAL DATA with all added tutorials
const tutorialData = {
  messenger: [
    {
      id: "messenger-send",
      title: "How to Send a Message",
      desc: "Learn how to start conversations in Facebook Messenger",
      steps: [
        "Open Messenger or the Messenger section in Facebook",
        "Tap the pencil icon or 'New Message'",
        "Select a friend from your contacts",
        "Type your message in the text field",
        "Tap the send button to deliver your message",
      ],
      video: "/videos/messenger.messsage.mp4",
      duration: 110,
    },
    {
      id: "messenger-photo",
      title: "How to Send a Photo or Video",
      desc: "Share photos or videos through Messenger",
      steps: [
        "Open a chat with the person you want to send to",
        "Tap the photo or camera icon in the chat input",
        "Select or capture a photo/video",
        "Add a caption if desired, then tap Send",
        "Use the gallery to send multiple items at once",
      ],
      video: "/videos/messenger/messvid.mp4",
      duration: 90,
    },
    {
      id: "messenger-react",
      title: "How to React to a Message",
      desc: "Use quick reactions to respond to messages",
      steps: [
        "Long press (mobile) or hover (desktop) over the message",
        "Choose a reaction emoji from the popup",
        "Your reaction appears below the message",
        "Tap again to change your reaction",
      ],
      video: "/videos/messenger/messreact.mp4",
      duration: 60,
    },
    {
      id: "messenger-group",
      title: "How to Create a Group Chat",
      desc: "Create a group to message multiple people at once",
      steps: [
        "Open Messenger and tap 'New Message' or 'Create Group'",
        "Select multiple contacts to add",
        "Give the group a name and optional photo",
        "Tap Create to start chatting with the group",
      ],
      video: "/videos/messenger/messgc.mp4",
      duration: 80,
    },
    {
      id: "messenger-call",
      title: "How to Start a Voice/Video Call",
      desc: "Make voice or video calls in Messenger",
      steps: [
        "Open the chat with someone you want to call",
        "Tap the phone icon for voice call or the video icon for video call",
        "Wait for the other person to answer",
        "Use speaker or mute during the call as needed",
      ],
      video: "/videos/messenger/messcall.mp4",
      duration: 120,
    }
  ],
  facebook: [
    {
      id: "facebook-post",
      title: "How to Post a Status or Photo",
      desc: "Share updates with your friends on Facebook",
      steps: [
        "Tap 'What's on your mind?' at the top of your feed",
        "Type your status update or add a photo",
        "Choose audience (Public, Friends, Only me)",
        "Tap 'Post' to share",
        "Use the three-dot menu to edit or delete your post later",
      ],
      video: "/videos/facebook/poststatus.fb.mp4",
      duration: 100,
    },
    {
      id: "facebook-comment",
      title: "How to Comment on a Post",
      desc: "Add comments to posts from friends and pages",
      steps: [
        "Find the post you want to comment on",
        "Tap 'Comment' below the post",
        "Type your comment in the text box",
        "Tap 'Post' to submit your comment",
        "You can also like or reply to other comments",
      ],
      video: "/videos/facebook/commentpostfb.mp4",
      duration: 80,
    },
    {
      id: "facebook-react",
      title: "How to React to a Post",
      desc: "Use reactions like Like, Love, Haha, Wow, Sad, Angry",
      steps: [
        "Find the post you want to react to",
        "Press and hold the Like button on mobile or hover over it on desktop",
        "Select the reaction you want to use",
        "Your reaction will appear below the post",
        "Tap again to change or remove your reaction",
      ],
      video: "/videos/facebook/reactpost.mp4",
      duration: 70,
    },
    {
      id: "facebook-share",
      title: "How to Share a Post",
      desc: "Share interesting posts with your friends",
      steps: [
        "Find the post you want to share",
        "Tap 'Share' below the post",
        "Choose where to share: Your Story, Your Feed, or in a Message",
        "Add your own comment if you want",
        "Tap 'Post' or 'Send' to share",
      ],
      video: "/videos/facebook/fbshare.mp4",
      duration: 90,
    },
    {
      id: "facebook-profile-pic",
      title: "How to Update Your Profile Picture",
      desc: "Change your Facebook profile photo",
      steps: [
        "Go to your profile by tapping your name",
        "Tap on your current profile picture",
        "Select 'Update Profile Picture'",
        "Choose a photo from your gallery or take a new one",
        "Adjust the crop and tap 'Save'",
      ],
      video: "/videos/facebook/fbpic.mp4",
      duration: 120,
    }
  ],
  instagram: [
    {
      id: "instagram-post",
      title: "How to Post a Photo/Video",
      desc: "Share photos with your followers on Instagram",
      steps: [
        "Tap the '+' icon at the bottom center",
        "Choose a photo from your gallery",
        "Apply filters or edit the photo",
        "Add a caption and location",
        "Tap 'Share' to post to your profile",
      ],
      video: "/videos/insta/postinsta.mp4",
      duration: 140,
    },
    {
      id: "instagram-story",
      title: "How to Post a Story",
      desc: "Share temporary photos and videos that disappear after 24 hours",
      steps: [
        "Swipe right from your feed or tap your profile picture",
        "Capture a photo or video",
        "Add text, stickers, or drawings",
        "Tap 'Your Story' to share with all followers",
        "You can also send to specific friends",
      ],
      video: "/videos/insta/instastory.mp4",
      duration: 150,
    },
    {
      id: "instagram-comment",
      title: "How to Comment or Like a Post",
      desc: "Interact with posts from people you follow",
      steps: [
        "Find a post you want to interact with",
        "Tap the heart icon to like the post",
        "Tap the comment bubble to add a comment",
        "Type your comment and tap 'Post'",
        "You can also reply to other comments",
      ],
      video: "/videos/insta/comment.mp4",
      duration: 90,
    },
    {
      id: "instagram-dm",
      title: "How to Send a DM (Direct Message)",
      desc: "Chat privately with other Instagram users",
      steps: [
        "Tap the paper plane icon in the top right",
        "Tap the '+' icon to start a new message",
        "Select a user from your followers",
        "Type your message in the text field",
        "Tap send to deliver your message",
      ],
      video: "/videos/insta/d.mp4",
      duration: 120,
    },
    {
      id: "instagram-follow",
      title: "How to Follow or Unfollow Someone",
      desc: "Connect with other users on Instagram",
      steps: [
        "Search for a person or find them in your suggestions",
        "Go to their profile page",
        "Tap 'Follow' to start following them",
        "To unfollow, go to their profile and tap 'Following' then 'Unfollow'",
        "You can also mute or restrict accounts",
      ],
      video: "/videos/instafoll.mp4",
      duration: 100,
    }
  ],
  tiktok: [
    {
      id: "tiktok-record",
      title: "How to Record, Use a Filter and Post a Video",
      desc: "Create and share videos on TikTok",
      steps: [
        "Tap the '+' icon at the bottom center",
        "Record a video or upload from gallery",
        "Add effects, filters, and music",
        "Write a caption and add hashtags",
        "Tap 'Post' to share your video",
      ],
      video: "/videos/tiktok-record.mp4",
      duration: 160,
    },
    {
      id: "tiktok-interact",
      title: "How to Like, Comment, or Share Videos",
      desc: "Interact with TikTok videos",
      steps: [
        "Watch a video in your feed",
        "Tap the heart icon to like",
        "Tap the comment bubble to add a comment",
        "Tap the share arrow to share with friends",
        "You can also save or duet videos",
      ],
      video: "/videos/tiktok-interact.mp4",
      duration: 110,
    },
    {
      id: "tiktok-follow",
      title: "How to Follow a Creator",
      desc: "Follow your favorite TikTok creators",
      steps: [
        "Find a creator's video you enjoy",
        "Tap their username to go to their profile",
        "Tap the 'Follow' button",
        "Their videos will appear in your following feed",
        "You can also turn on notifications",
      ],
      video: "/videos/tiktok/follow.mp4",
      duration: 80,
    },
    {
      id: "tiktok-sounds",
      title: "How to Use Sounds",
      desc: "Add music and sounds to your TikTok videos",
      steps: [
        "When recording, tap 'Add sound'",
        "Browse popular sounds or search for specific ones",
        "Select a sound and adjust the timing",
        "You can also use original audio",
        "Save sounds to use later",
      ],
      video: "/videos/tiktok/sounds.mp4",
      duration: 130,
    },
    {
      id: "tiktok-upload",
      title: "How to Upload from Gallery",
      desc: "Upload existing videos from your phone",
      steps: [
        "Tap the '+' icon to create",
        "Select 'Upload' from the bottom right",
        "Choose videos from your gallery",
        "Edit and add effects as needed",
        "Post to share with your followers",
      ],
      video: "/videos/tiktok/upload.mp4",
      duration: 100,
    }
  ],
  twitter: [
    {
      id: "twitter-tweet",
      title: "How to Post a Tweet",
      desc: "Share your thoughts on X (Twitter)",
      steps: [
        "Tap the compose button (quill icon)",
        "Type your message (280 characters max)",
        "Add photos, videos, or GIFs if desired",
        "Choose your audience (everyone or only followers)",
        "Tap 'Tweet' to post",
      ],
      video: "/videos/twitter/tweet.mp4",
      duration: 110,
    },
    {
      id: "twitter-reply",
      title: "How to Reply to a Tweet",
      desc: "Join conversations on Twitter",
      steps: [
        "Find the tweet you want to reply to",
        "Tap the reply icon (speech bubble)",
        "Type your reply in the text box",
        "You can mention the original poster",
        "Tap 'Reply' to post your response",
      ],
      video: "/videos/twitter/reply.mp4",
      duration: 90,
    },
    {
      id: "twitter-retweet",
      title: "How to Retweet",
      desc: "Share other people's tweets with your followers",
      steps: [
        "Find a tweet you want to share",
        "Tap the retweet icon (two arrows)",
        "Choose 'Retweet' to share as is",
        "Or 'Quote Tweet' to add your comment",
        "The tweet will appear in your followers' feeds",
      ],
      video: "/videos/twitter/retweet.mp4",
      duration: 85,
    },
    {
      id: "twitter-follow",
      title: "How to Follow or Unfollow Users",
      desc: "Connect with people on Twitter",
      steps: [
        "Search for a user or find them in suggestions",
        "Go to their profile page",
        "Tap 'Follow' to follow them",
        "To unfollow, go to their profile and tap 'Following'",
        "You'll see their tweets in your timeline",
      ],
      video: "/videos/twitter/follow.mp4",
      duration: 95,
    },
    {
      id: "twitter-dm",
      title: "How to Send a Direct Message",
      desc: "Send private messages on Twitter",
      steps: [
        "Tap the envelope icon",
        "Tap the new message icon",
        "Select a user to message",
        "Type your message in the text field",
        "Tap send to deliver your message",
      ],
      video: "/videos/twitter/dm.mp4",
      duration: 100,
    }
  ],
  gmail: [
    {
      id: "gmail-compose",
      title: "How to Compose and Send an Email",
      desc: "Create and send emails in Gmail",
      steps: [
        "Tap the compose button (pencil icon)",
        "Enter recipient's email address",
        "Add a subject line",
        "Type your email message",
        "Tap send to deliver your email",
      ],
      video: "/videos/gmail/compose.mp4",
      duration: 120,
    },
    {
      id: "gmail-attach",
      title: "How to Attach Files",
      desc: "Add attachments to your emails",
      steps: [
        "While composing an email, tap the paperclip icon",
        "Choose the type of file: Photos, Documents, etc.",
        "Select the files you want to attach",
        "Wait for files to upload",
        "Tap send with attachments included",
      ],
      video: "/videos/gmail/attach.mp4",
      duration: 110,
    },
    {
      id: "gmail-search",
      title: "How to Search for Emails",
      desc: "Find specific emails in your inbox",
      steps: [
        "Tap the search bar at the top",
        "Type keywords, sender name, or subject",
        "Tap search or press enter",
        "Browse through search results",
        "Use filters to narrow your search",
      ],
      video: "/videos/gmail/search.mp4",
      duration: 95,
    },
    {
      id: "gmail-archive",
      title: "How to Archive or Delete an Email",
      desc: "Organize your Gmail inbox",
      steps: [
        "Swipe left on an email to archive",
        "Swipe right to delete",
        "Or tap the archive/trash icons",
        "Archived emails can be found in 'All Mail'",
        "Deleted emails go to trash for 30 days",
      ],
      video: "/videos/gmail/archive.mp4",
      duration: 105,
    }
  ],
  googlemeet: [
    {
      id: "meet-start",
      title: "How to Start a Meeting",
      desc: "Create a new video meeting in Google Meet",
      steps: [
        "Open Google Meet app or website",
        "Tap 'New Meeting'",
        "Choose 'Start an instant meeting'",
        "Get your meeting link to share",
        "Start the meeting when ready",
      ],
      video: "/videos/meet/start.mp4",
      duration: 90,
    },
    {
      id: "meet-join",
      title: "How to Join a Meeting",
      desc: "Join an existing Google Meet",
      steps: [
        "Open Google Meet",
        "Tap 'Join with a code'",
        "Enter the meeting code or use the link",
        "Allow camera and microphone access",
        "Tap 'Join now' to enter the meeting",
      ],
      video: "/videos/meet/join.mp4",
      duration: 80,
    },
    {
      id: "meet-captions",
      title: "How to Turn on Captions",
      desc: "Enable live captions during meetings",
      steps: [
        "Join a Google Meet",
        "Tap the three dots menu",
        "Select 'Turn on captions'",
        "Captions will appear at the bottom",
        "Adjust caption settings if needed",
      ],
      video: "/videos/meet/captions.mp4",
      duration: 70,
    },
    {
      id: "meet-share",
      title: "How to Share Your Screen",
      desc: "Share your screen during a meeting",
      steps: [
        "During a meeting, tap 'Present now'",
        "Choose what to share: Your entire screen, a window, or a tab",
        "Select the content and tap 'Share'",
        "Others can now see your screen",
        "Tap 'Stop sharing' when done",
      ],
      video: "/videos/meet/share.mp4",
      duration: 100,
    },
    {
      id: "meet-chat",
      title: "How to Send a Message in Chat",
      desc: "Use the chat feature during meetings",
      steps: [
        "During a meeting, tap the chat bubble icon",
        "Type your message in the chat box",
        "Tap send to post your message",
        "You can send to everyone or specific people",
        "Chats are saved until meeting ends",
      ],
      video: "/videos/meet/chat.mp4",
      duration: 75,
    }
  ],
  zoom: [
    {
      id: "zoom-start",
      title: "How to Start a Meeting",
      desc: "Host a new Zoom meeting",
      steps: [
        "Open the Zoom app",
        "Tap 'New Meeting'",
        "Choose your video and audio settings",
        "Tap 'Start a Meeting'",
        "Share the meeting ID with others",
      ],
      video: "/videos/zoom/start.mp4",
      duration: 95,
    },
    {
      id: "zoom-join",
      title: "How to Join a Meeting",
      desc: "Join an existing Zoom meeting",
      steps: [
        "Open the Zoom app",
        "Tap 'Join'",
        "Enter the meeting ID",
        "Enter your display name",
        "Tap 'Join Meeting'",
      ],
      video: "/videos/zoom/join.mp4",
      duration: 85,
    },
    {
      id: "zoom-share",
      title: "How to Share Screen",
      desc: "Share your screen in a Zoom meeting",
      steps: [
        "During a meeting, tap 'Share Content'",
        "Choose what to share: Screen, Whiteboard, or iPhone/iPad",
        "Select the screen you want to share",
        "Tap 'Start Broadcast'",
        "Others can now see your screen",
      ],
      video: "/videos/zoom/share.mp4",
      duration: 110,
    },
    {
      id: "zoom-mute",
      title: "How to Mute/Unmute Mic",
      desc: "Control your microphone during meetings",
      steps: [
        "During a meeting, find the microphone icon",
        "Tap it to mute your microphone",
        "Tap again to unmute",
        "You can also use spacebar as a push-to-talk shortcut",
        "Mute notifications when presenting",
      ],
      video: "/videos/zoom/mute.mp4",
      duration: 65,
    },
    {
      id: "zoom-record",
      title: "How to Record a Meeting",
      desc: "Record your Zoom meetings for later viewing",
      steps: [
        "Start or join a Zoom meeting",
        "Tap the 'More' button (three dots)",
        "Select 'Record to the Cloud' or 'Record to this Device'",
        "Recording will start - a red light appears",
        "Tap 'Stop Recording' when finished",
      ],
      video: "/videos/zoom/record.mp4",
      duration: 120,
    }
  ]
}

const platformData = {
  messenger: { icon: "fab fa-facebook-messenger", color: "#0084FF", name: "Messenger" },
  facebook: { icon: "fab fa-facebook", color: "#4267B2", name: "Facebook" },
  instagram: { icon: "fab fa-instagram", color: "#E1306C", name: "Instagram" },
  tiktok: { icon: "fab fa-tiktok", color: "#010101", name: "TikTok" },
  twitter: { icon: "fab fa-twitter", color: "#1DA1F2", name: "X (Twitter)" },
  gmail: { icon: "far fa-envelope", color: "#D44638", name: "Gmail" },
  googlemeet: { icon: "fab fa-google", color: "#34A853", name: "Google Meet" },
  zoom: { icon: "fab fa-zoom", color: "#2D8CFF", name: "Zoom" }
}

export default function ElderTutorialPage() {
  const [currentView, setCurrentView] = useState<"choices" | "platforms" | "tutorials" | "detail" | "language">("choices")
  const [currentPlatform, setCurrentPlatform] = useState("")
  const [currentTutorialIndex, setCurrentTutorialIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [greeting, setGreeting] = useState("Good Morning")
  const [favorites, setFavorites] = useState<FavoriteTutorial[]>([])
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const router = useRouter()
  const { isListening, transcript, startListening } = useVoiceRecognition()
  const [videoProgress, setVideoProgress] = useState(0)

  // --- added: print / export B&W helper ------------------------------------------------
  const injectPrintBWStyles = () => {
    if (typeof window === 'undefined') return
    if (document.getElementById('print-bw-styles')) return

    const style = document.createElement('style')
    style.id = 'print-bw-styles'
    style.innerHTML = `
      @media print {
        html, body {
          background: #fff !important;
          color: #000 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * {
          color: #000 !important;
          background: transparent !important;
          box-shadow: none !important;
          text-shadow: none !important;
        }
        /* hide UI elements not needed in print */
        video, img, .no-print, .fixed, .bot, .shadow-2xl, .animate-pulse {
          display: none !important;
        }
        /* ensure cards print as plain boxes */
        .rounded-2xl, .rounded-xl { border-radius: 0 !important; }
      }
    `
    document.head.appendChild(style)
  }

  const removePrintBWStyles = () => {
    if (typeof window === 'undefined') return
    const el = document.getElementById('print-bw-styles')
    if (el) el.remove()
  }

  const handlePrintBW = () => {
    if (typeof window === 'undefined') return
    injectPrintBWStyles()
    // print; afterprint listener will cleanup
    window.print()
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const cleanup = () => removePrintBWStyles()
    window.addEventListener('afterprint', cleanup)
    return () => {
      window.removeEventListener('afterprint', cleanup)
      removePrintBWStyles()
    }
  }, [])
  // -------------------------------------------------------------------------------------
  
  // Load favorites on mount
  useEffect(() => {
    setFavorites(TutorialProgressTracker.getFavorites())
    
    // Set greeting based on time of day
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 18) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")
  }, [])

  // Handle voice search
  useEffect(() => {
    if (transcript) {
      setSearchTerm(transcript)
      handleSearch(transcript)
    }
  }, [transcript])

  const handleSearch = (term: string) => {
    if (!term.trim()) return
    
    const lowerTerm = term.toLowerCase()
    
    // Search platforms
    const platformMatch = Object.keys(platformData).find(platform => 
      platformData[platform as keyof typeof platformData].name.toLowerCase().includes(lowerTerm)
    )
    
    if (platformMatch) {
      setCurrentPlatform(platformMatch)
      setCurrentView("tutorials")
      return
    }
    
    // Search tutorials across all platforms
    for (const [platform, tutorials] of Object.entries(tutorialData)) {
      for (let i = 0; i < tutorials.length; i++) {
        const tutorial = tutorials[i]
        if (tutorial.title.toLowerCase().includes(lowerTerm) || 
            tutorial.desc.toLowerCase().includes(lowerTerm)) {
          setCurrentPlatform(platform)
          setCurrentTutorialIndex(i)
          setCurrentView("detail")
          
          setTimeout(() => {
            videoRef.current?.play()
          }, 500)
          return
        }
      }
    }
    
    // Search language terms
    const languageMatch = languageTerms.find(term => 
      term.word.toLowerCase().includes(lowerTerm) || 
      term.meaning.toLowerCase().includes(lowerTerm)
    )
    
    if (languageMatch) {
      speakWord(languageMatch.word)
    }
  }

  const handleSearchSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion)
    handleSearch(suggestion)
    setShowSearchSuggestions(false)
  }

  const handleChatbotNavigation = (platform: string, tutorialIndex: number) => {
    setCurrentPlatform(platform)
    setCurrentTutorialIndex(tutorialIndex)
    setCurrentView("detail")
    
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => {
      videoRef.current?.play()
    }, 500)
  }

  const handleFavoriteToggle = () => {
    setFavorites(TutorialProgressTracker.getFavorites())
  }

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && currentTutorial) {
      const currentTime = videoRef.current.currentTime
      const duration = videoRef.current.duration
      if (duration > 0) {
        const progressPercent = (currentTime / duration) * 100
        setVideoProgress(progressPercent)
        
        // Update progress tracking every 5 seconds
        if (Math.floor(currentTime) % 5 === 0) {
          TutorialProgressTracker.updateVideoProgress(currentTutorial.id, currentTime, duration)
        }
      }
    }
  }

  const handleVideoEnded = () => {
    if (currentTutorial) {
      TutorialProgressTracker.markAsCompleted(currentTutorial.id)
      speakWord("Congratulations! You've completed this tutorial!")
    }
  }

  const currentTutorial = tutorialData[currentPlatform as keyof typeof tutorialData]?.[currentTutorialIndex]
  const stats = TutorialProgressTracker.getUserStats()

  const navItems = [
    { icon: Home, label: "Home", href: "/elder/home", active: false },
    { icon: BookOpen, label: "Tutorial", href: "/elder/tutorial", active: true },
    { icon: Calendar, label: "Event", href: "/elder/event", active: false },
    { icon: User, label: "Profile", href: "/elder/profile", active: false },
  ]

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50">
      {/* Mobile Header */}
      <div className="md:hidden text-white p-4 sticky top-0 z-20"
        style={{ 
          backgroundColor: PRIMARY_COLOR,
          background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <img src="/ease.jpg" alt="ElderEase Logo" className="w-8 h-8 rounded-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold">ElderEase</h2>
              <p className="text-xs text-emerald-100">
                {greeting}, User
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:bg-white/20 rounded-full"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Sidebar - Hidden on mobile unless menu is open */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:sticky md:top-0 inset-y-0 left-0 z-30
        w-64 md:w-72 text-white flex flex-col transition-transform duration-300 ease-in-out
        md:flex shadow-2xl h-screen
      `}
      style={{ 
        backgroundColor: DARK_GREEN,
        background: `linear-gradient(180deg, ${DARK_GREEN}, ${SECONDARY_COLOR})`
      }}
      >
        {/* Close button for mobile */}
        <div className="flex items-center justify-between p-4 border-b border-emerald-700 md:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <img src="/ease.jpg" alt="ElderEase Logo" className="w-8 h-8 rounded-lg" />
            </div>
            <h2 className="text-lg font-bold">ElderEase</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Desktop Logo Section */}
        <div className="hidden md:block p-6 border-b border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm ring-2 ring-white/20">
              <img src="/ease.jpg" alt="ElderEase Logo" className="w-10 h-10 rounded-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold">ElderEase</h2>
              <p className="text-sm text-emerald-200 mt-1">
                {greeting}, User
              </p>
            </div>
          </div>
          
          {/* Quick Stats in Sidebar */}
          <div className="mt-6 space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-600/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-200">Learning Progress</span>
                <span className="text-sm font-bold text-white">
                  {stats.totalTutorials > 0 ? Math.round((stats.completedTutorials / stats.totalTutorials) * 100) : 0}%
                </span>
              </div>
              <Progress 
                value={stats.totalTutorials > 0 ? Math.round((stats.completedTutorials / stats.totalTutorials) * 100) : 0} 
                className="h-2 mt-2 bg-emerald-700" 
              />
              <div className="flex items-center justify-between text-xs text-emerald-300 mt-2">
                <span>{stats.completedTutorials} completed</span>
                <span>{stats.inProgressTutorials} in progress</span>
              </div>
            </div>
            
            {/* Learning Streak */}
            <div className="bg-white/5 rounded-xl p-4 border border-emerald-600/20">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-amber-300" />
                <span className="text-sm font-medium text-emerald-200">Learning Streak</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-white">{stats.totalTimeSpent} min</div>
                  <div className="text-xs text-emerald-300">Time spent</div>
                </div>
                <Target className="h-8 w-8 text-emerald-300" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    item.active
                      ? "bg-white text-emerald-800 shadow-lg"
                      : "text-emerald-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.active && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  )}
                </Link>
              )
            })}
          </div>
          
          {/* Favorites Section in Sidebar */}
          {favorites.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 px-4 mb-3">
                <Bookmark className="h-4 w-4 text-amber-300" />
                <span className="text-sm font-medium text-emerald-200">Favorites ({favorites.length})</span>
              </div>
              <div className="space-y-1">
                {favorites.slice(0, 3).map((fav) => {
                  const platformTutorials = tutorialData[fav.platform as keyof typeof tutorialData]
                  const tutorial = platformTutorials?.find(t => t.id === fav.tutorialId)
                  if (!tutorial) return null
                  
                  return (
                    <div
                      key={fav.tutorialId}
                      className="px-4 py-2 rounded-lg hover:bg-white/5 cursor-pointer text-sm text-emerald-300 hover:text-white transition-colors group"
                      onClick={() => {
                        setCurrentPlatform(fav.platform)
                        setCurrentTutorialIndex(platformTutorials.findIndex(t => t.id === fav.tutorialId))
                        setCurrentView("detail")
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center text-xs text-white group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: platformData[fav.platform as keyof typeof platformData].color }}
                        >
                          <i className={platformData[fav.platform as keyof typeof platformData].icon}></i>
                        </div>
                        <span className="truncate">{tutorial.title}</span>
                        <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-emerald-700">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl backdrop-blur-sm border border-emerald-600/30">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center ring-2 ring-white/30">
              <span className="font-medium text-sm text-white">
                U
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                User
              </p>
              <p className="text-xs text-emerald-300 truncate">
                {stats.completedTutorials} tutorials completed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header with Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
                  {currentView === "choices" && "📚 Learning Center"}
                  {currentView === "platforms" && "📱 Social Media Tutorials"}
                  {currentView === "tutorials" && platformData[currentPlatform as keyof typeof platformData]?.name + " Tutorials"}
                  {currentView === "detail" && currentTutorial?.title}
                  {currentView === "language" && "💬 Language Guide"}
                </h1>
                <p className="text-gray-600 mt-2">
                  {currentView === "choices" && "Master social media and modern language at your own pace"}
                  {currentView === "language" && "Learn modern terms and their pronunciations"}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search Input with Voice */}
                <div className="relative flex-1 md:flex-none">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setShowSearchSuggestions(true)
                      }}
                      onFocus={() => setShowSearchSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
                      placeholder="Search tutorials..."
                      className="pl-10 w-full md:w-64 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 rounded-xl"
                    />
                    <Button
                      onClick={startListening}
                      variant="ghost"
                      size="icon"
                      className={`absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400'} rounded-full`}
                    >
                      <Mic className={`h-3.5 w-3.5`} />
                    </Button>
                  </div>
                  
                  {/* Search Suggestions */}
                  {showSearchSuggestions && searchTerm && (
                    <SearchSuggestions 
                      query={searchTerm} 
                      onSelect={handleSearchSuggestion}
                    />
                  )}
                </div>

                {/* Added: Print / Export B&W button */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handlePrintBW}
                    variant="outline"
                    size="sm"
                    className="hidden md:inline-flex gap-2 border-gray-300 hover:border-gray-400 rounded-xl"
                    title="Print / Export page in black & white"
                  >
                    Print B/W
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            {(currentView === "choices" || currentView === "platforms") && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-8">
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-4 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-emerald-700">{stats.completedTutorials}</div>
                      <div className="text-sm text-emerald-600">Completed</div>
                    </div>
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-4 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-emerald-700">{stats.inProgressTutorials}</div>
                      <div className="text-sm text-emerald-600">In Progress</div>
                    </div>
                    <Sparkles className="h-8 w-8 text-emerald-500" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-4 border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-amber-700">{favorites.length}</div>
                      <div className="text-sm text-amber-600">Favorites</div>
                    </div>
                    <Star className="h-8 w-8 text-amber-500 fill-amber-500" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-4 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-emerald-700">{stats.totalTimeSpent}</div>
                      <div className="text-sm text-emerald-600">Minutes</div>
                    </div>
                    <Clock className="h-8 w-8 text-emerald-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Choices View */}
            {currentView === "choices" && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card 
                    onClick={() => setCurrentView("platforms")} 
                    className="cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] group overflow-hidden border-2 border-transparent hover:border-emerald-300 bg-gradient-to-br from-white to-emerald-50"
                  >
                    <CardContent className="pt-8 pb-8 text-center space-y-4">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"
                        style={{ 
                          backgroundColor: PRIMARY_COLOR,
                          background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
                        }}
                      >
                        <Share2 className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">Social Media Tutorials</h3>
                      <p className="text-gray-600">Learn how to use Facebook, WhatsApp, Instagram, and more</p>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <span>{Object.keys(tutorialData).length} platforms</span>
                        <span>•</span>
                        <span>{Object.values(tutorialData).reduce((sum, tutorials) => sum + tutorials.length, 0)} tutorials</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    onClick={() => setCurrentView("language")} 
                    className="cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] group overflow-hidden border-2 border-transparent hover:border-emerald-300 bg-gradient-to-br from-white to-emerald-50"
                  >
                    <CardContent className="pt-8 pb-8 text-center space-y-4">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"
                        style={{ 
                          backgroundColor: SECONDARY_COLOR,
                          background: `linear-gradient(135deg, ${SECONDARY_COLOR}, ${PRIMARY_COLOR})`
                        }}
                      >
                        <Languages className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">Language & Pronunciation</h3>
                      <p className="text-gray-600">Understand internet slang and how to pronounce abbreviations</p>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <span>{languageTerms.length} terms</span>
                        <span>•</span>
                        <span>Audio pronunciations</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Language View */}
            {currentView === "language" && (
              <div className="space-y-8">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView("choices")} 
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-emerald-50 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Learning Center
                </Button>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {languageTerms.map((term, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow overflow-hidden group border-emerald-200 bg-gradient-to-b from-white to-emerald-50">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold"
                            style={{ color: PRIMARY_COLOR }}
                          >
                            {term.word}
                          </div>
                          <Button
                            onClick={() => speakWord(term.word)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 rounded-full border-emerald-300 hover:border-emerald-400"
                          >
                            <Volume2 className="h-4 w-4" style={{ color: PRIMARY_COLOR }} />
                          </Button>
                        </div>
                        <div className="text-lg font-mono text-gray-600 bg-emerald-100 px-3 py-1 rounded-lg inline-block">/{term.pronunciation}/</div>
                        <p className="text-gray-700 border-t pt-4 border-emerald-100">{term.meaning}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Platforms View */}
            {currentView === "platforms" && (
              <div className="space-y-8">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView("choices")} 
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-emerald-50 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.keys(platformData).map((platform) => {
                    const tutorials = tutorialData[platform as keyof typeof tutorialData] || []
                    const completed = TutorialProgressTracker.getProgress()
                      .filter(p => p.tutorialId && tutorials.some((t: any) => t.id === p.tutorialId) && p.status === 'completed').length
                    const total = tutorials.length
                    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0
                    
                    return (
                      <Card
                        key={platform}
                        onClick={() => {
                          setCurrentPlatform(platform)
                          setCurrentView("tutorials")
                        }}
                        className="cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] group overflow-hidden border-emerald-200 bg-gradient-to-b from-white to-emerald-50"
                      >
                        <CardContent className="p-6 text-center space-y-4">
                          <div className="relative">
                            <div
                              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-white text-2xl shadow-lg group-hover:scale-110 transition-transform"
                              style={{ 
                                backgroundColor: platformData[platform as keyof typeof platformData].color,
                                background: `linear-gradient(135deg, ${platformData[platform as keyof typeof platformData].color}, ${platformData[platform as keyof typeof platformData].color}dd)`
                              }}
                            >
                              <i className={platformData[platform as keyof typeof platformData].icon}></i>
                            </div>
                            {progressPercent > 0 && (
                              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-emerald-100 flex items-center justify-center text-xs font-bold shadow-sm"
                                style={{ color: PRIMARY_COLOR }}
                              >
                                {progressPercent}%
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">
                              {platformData[platform as keyof typeof platformData].name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {tutorials.length} tutorials
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Progress</span>
                              <span className="font-medium">{completed}/{total}</span>
                            </div>
                            <Progress value={progressPercent} className="h-1.5 bg-emerald-100" />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tutorials List */}
            {currentView === "tutorials" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    onClick={() => setCurrentView("platforms")} 
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-emerald-50 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Platforms
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {tutorialData[currentPlatform as keyof typeof tutorialData]?.length || 0} tutorials
                    </span>
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {tutorialData[currentPlatform as keyof typeof tutorialData]?.map((tutorial, index) => (
                    <TutorialCard
                      key={index}
                      tutorial={tutorial}
                      platform={currentPlatform}
                      index={index}
                      onClick={() => {
                        setCurrentTutorialIndex(index)
                        setCurrentView("detail")
                      }}
                      isFavorite={TutorialProgressTracker.isFavorite(tutorial.id)}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tutorial Detail */}
            {currentView === "detail" && currentTutorial && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    onClick={() => setCurrentView("tutorials")} 
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-emerald-50 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Tutorials
                  </Button>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => {
                        const added = TutorialProgressTracker.toggleFavorite(currentTutorial.id, currentPlatform)
                        handleFavoriteToggle()
                        if (added) {
                          speakWord("Added to favorites")
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="gap-2 border-amber-300 hover:border-amber-400 rounded-xl"
                    >
                      {TutorialProgressTracker.isFavorite(currentTutorial.id) ? (
                        <>
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                          Remove Favorite
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4" />
                          Add to Favorites
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => speakWord("Playing tutorial video")}
                      variant="outline"
                      size="sm"
                      className="gap-2 border-emerald-300 hover:border-emerald-400 rounded-xl"
                    >
                      <Volume2 className="h-4 w-4" />
                      Audio Guide
                    </Button>
                  </div>
                </div>

                {/* Tutorial Header with Progress */}
                <div className="bg-gradient-to-r from-emerald-50 to-white rounded-2xl p-6 border border-emerald-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                          style={{ 
                            backgroundColor: platformData[currentPlatform as keyof typeof platformData].color,
                            background: `linear-gradient(135deg, ${platformData[currentPlatform as keyof typeof platformData].color}, ${platformData[currentPlatform as keyof typeof platformData].color}dd)`
                          }}
                        >
                          <i className={`${platformData[currentPlatform as keyof typeof platformData].icon} text-lg`}></i>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-500">
                            {platformData[currentPlatform as keyof typeof platformData].name}
                          </span>
                          <h1 className="text-3xl font-bold text-gray-800 mt-1">{currentTutorial.title}</h1>
                        </div>
                      </div>
                      <p className="text-lg text-gray-600">{currentTutorial.desc}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-4xl font-bold text-gray-800">
                        {Math.ceil(currentTutorial.duration / 60)} min
                      </div>
                      <div className="text-sm text-gray-500">Duration</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Your Progress</span>
                      <span className="text-sm font-bold" style={{ color: PRIMARY_COLOR }}>
                        {TutorialProgressTracker.getProgress().find(p => p.tutorialId === currentTutorial.id)?.progress || 0}%
                      </span>
                    </div>
                    <Progress 
                      value={TutorialProgressTracker.getProgress().find(p => p.tutorialId === currentTutorial.id)?.progress || 0} 
                      className="h-3 rounded-full bg-emerald-100" 
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {TutorialProgressTracker.getProgress().find(p => p.tutorialId === currentTutorial.id)?.status === 'completed' 
                          ? '✅ Completed' 
                          : TutorialProgressTracker.getProgress().find(p => p.tutorialId === currentTutorial.id)?.status === 'in-progress'
                          ? '🎯 In Progress'
                          : '📝 Not Started'
                        }
                      </span>
                      <Button
                        onClick={() => {
                          TutorialProgressTracker.markAsCompleted(currentTutorial.id)
                          speakWord("Tutorial marked as completed!")
                        }}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-emerald-300 hover:border-emerald-400 rounded-lg"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Video Player */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                  <video
                    ref={videoRef}
                    src={currentTutorial.video}
                    controls
                    className="w-full rounded-t-2xl"
                    poster="/placeholder-video.jpg"
                    onTimeUpdate={handleVideoTimeUpdate}
                    onPlay={() => {
                      // Mark as in-progress when video starts playing
                      if (!TutorialProgressTracker.getProgress().find(p => p.tutorialId === currentTutorial.id)?.status) {
                        TutorialProgressTracker.markAsStarted(currentTutorial.id)
                      }
                    }}
                    onEnded={handleVideoEnded}
                  />
                  <div className="p-4 bg-gray-900/50 backdrop-blur-sm border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-300">
                        <PlayCircle className="h-5 w-5" />
                        <span className="text-sm">Interactive Tutorial</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Progress: {Math.round(videoProgress)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Steps Overview */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ 
                        backgroundColor: PRIMARY_COLOR,
                        background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
                      }}
                    >
                      <span className="text-white font-bold">✓</span>
                    </div>
                    What You'll Learn
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {currentTutorial.steps.map((step, index) => (
                      <Card key={index} className="border-l-4 border-emerald-500 hover:shadow-lg transition-shadow bg-gradient-to-r from-white to-emerald-50">
                        <CardContent className="py-4 flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0 border border-emerald-200">
                            {index + 1}
                          </div>
                          <p className="text-gray-700 pt-1">{step}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Enhanced AI Chatbot */}
      <AIChatbot 
        currentContext={currentView === "detail" && currentTutorial ? currentTutorial.title : currentView}
        onNavigate={handleChatbotNavigation}
      />
    </div>
  )
}