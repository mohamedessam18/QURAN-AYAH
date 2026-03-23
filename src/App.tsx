import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { 
  Heart, 
  Copy, 
  Settings, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX,
  RefreshCw,
  BookOpen,
  Globe,
  ChevronDown,
  ChevronUp,
  Zap,
  Image as ImageIcon,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

// Types
interface Ayah {
  number: number
  text: string
  surah: {
    number: number
    name: string
    englishName: string
  }
  juz: number
  page: number
}

interface Reciter {
  identifier: string
  name: string
  language: string
}

interface Favorite {
  ayah: Ayah
  timestamp: number
}

interface Translation {
  text: string
  language: string
}

// Reciters list (20+ reciters)
const RECITERS: Reciter[] = [
  { identifier: 'ar.alafasy', name: 'مشاري العفاسي', language: 'ar' },
  { identifier: 'ar.abdulbasitmurattal', name: 'عبد الباسط عبد الصمد (مرتل)', language: 'ar' },
  { identifier: 'ar.abdullahbasfar', name: 'عبد الله بصفر', language: 'ar' },
  { identifier: 'ar.abdurrahmaansudais', name: 'عبد الرحمن السديس', language: 'ar' },
  { identifier: 'ar.ahmedajamy', name: 'أحمد بن علي العجمي', language: 'ar' },
  { identifier: 'ar.ahmedneana', name: 'أحمد نعينع', language: 'ar' },
  { identifier: 'ar.akhdar', name: 'إبراهيم الأخضر', language: 'ar' },
  { identifier: 'ar.alfasy', name: 'مشاري العفاسي', language: 'ar' },
  { identifier: 'ar.aymanswoaid', name: 'أيمن سويد', language: 'ar' },
  { identifier: 'ar.banna', name: 'محمود علي البنا', language: 'ar' },
  { identifier: 'ar.basfar', name: 'عبد الله بصفر', language: 'ar' },
  { identifier: 'ar.bukhatir', name: 'سعد الغامدي', language: 'ar' },
  { identifier: 'ar.faresabbad', name: 'فارس عباد', language: 'ar' },
  { identifier: 'ar.ghamadi', name: 'سعد الغامدي', language: 'ar' },
  { identifier: 'ar.haniarrifai', name: 'هاني الرفاعي', language: 'ar' },
  { identifier: 'ar.hudhaify', name: 'علي الحذيفي', language: 'ar' },
  { identifier: 'ar.husary', name: 'محمود خليل الحصري', language: 'ar' },
  { identifier: 'ar.jazairi', name: 'محمد الأنصاري', language: 'ar' },
  { identifier: 'ar.juhany', name: 'عبد الله الجهني', language: 'ar' },
  { identifier: 'ar.kanoo', name: 'محمد كانو', language: 'ar' },
  { identifier: 'ar.mahermuaiqly', name: 'ماهر المعيقلي', language: 'ar' },
  { identifier: 'ar.matroud', name: 'عبد الله المطرود', language: 'ar' },
  { identifier: 'ar.minshawi', name: 'محمد صديق المنشاوي', language: 'ar' },
  { identifier: 'ar.mohsinharthi', name: 'محسن الحارثي', language: 'ar' },
  { identifier: 'ar.muammar', name: 'ياسر الدوسري', language: 'ar' },
]

// Reflection prompts
const REFLECTION_PROMPTS = [
  'ماذا تفهم من هذه الآية؟',
  'كيف تطبق هذه الآية في حياتك؟',
  'ما الدرس الذي يمكنك استخلاصه من هذه الآية؟',
  'كيف تؤثر هذه الآية في قلبك؟',
  'ما العمل الذي يمكنك أن تبدأ به بناءً على هذه الآية؟',
  'كيف يمكنك مشاركة هذه الآية مع الآخرين؟',
  'ما المعنى العميق لهذه الآية في حياتك الشخصية؟',
  'كيف تساعدك هذه الآية في التعامل مع تحدياتك؟',
]

function App() {
  // State
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [currentAyah, setCurrentAyah] = useState<Ayah | null>(null)
  const [currentReciter, setCurrentReciter] = useState<Reciter>(RECITERS[0])
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [audioErrorMessage, setAudioErrorMessage] = useState('')
  
  // Feature states
  const [autoMode, setAutoMode] = useState(false)
  const [autoInterval, setAutoInterval] = useState(15)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [quranFont, setQuranFont] = useState<'amiri' | 'scheherazade'>('amiri')
  const [showTafsir, setShowTafsir] = useState(false)
  const [translation, setTranslation] = useState<Translation | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [muted, setMuted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [usedReciters, setUsedReciters] = useState<string[]>([])
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null)
  const autoModeRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const versePanelRef = useRef<HTMLDivElement>(null)
  const verseTextRef = useRef<HTMLParagraphElement>(null)
  const [versePanelHeightPx, setVersePanelHeightPx] = useState<number>(220)
  
  // Load preferences from localStorage
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('quran-welcome-seen')
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true)
    }
    
    const savedDarkMode = localStorage.getItem('quran-dark-mode')
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true')
    }
    
    const savedFontSize = localStorage.getItem('quran-font-size')
    if (savedFontSize) {
      setFontSize(savedFontSize as 'small' | 'medium' | 'large')
    }
    
    const savedFont = localStorage.getItem('quran-font')
    if (savedFont) {
      setQuranFont(savedFont as 'amiri' | 'scheherazade')
    }
    
    const savedFavorites = localStorage.getItem('quran-favorites')
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch (e) {
        console.error('Error parsing favorites:', e)
      }
    }
    
    const savedAutoInterval = localStorage.getItem('quran-auto-interval')
    if (savedAutoInterval) {
      setAutoInterval(Number(savedAutoInterval))
    }
  }, [])
  
  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('quran-dark-mode', String(darkMode))
  }, [darkMode])
  
  useEffect(() => {
    localStorage.setItem('quran-font-size', fontSize)
  }, [fontSize])
  
  useEffect(() => {
    localStorage.setItem('quran-font', quranFont)
  }, [quranFont])
  
  useEffect(() => {
    localStorage.setItem('quran-favorites', JSON.stringify(favorites))
  }, [favorites])
  
  useEffect(() => {
    localStorage.setItem('quran-auto-interval', String(autoInterval))
  }, [autoInterval])
  
  // Handle welcome modal close
  const handleWelcomeClose = () => {
    localStorage.setItem('quran-welcome-seen', 'true')
    setShowWelcomeModal(false)
    fetchRandomAyah()
  }

  const getAyahAudioUrl = useCallback(async (ayahNumber: number, reciterId: string) => {
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${ayahNumber}/${reciterId}`)
    if (!response.ok) {
      throw new Error(`API_ERROR_${response.status}`)
    }

    const data = await response.json()
    if (data.code !== 200 || !data.data?.audio) {
      throw new Error('VOICE_NOT_FOUND')
    }

    return data.data.audio as string
  }, [])

  const resolveAudioSource = useCallback(async (ayahNumber: number, preferredReciter?: Reciter, excludedReciterId?: string) => {
    const remaining = RECITERS.filter(
      (reciter) =>
        reciter.identifier !== preferredReciter?.identifier &&
        reciter.identifier !== excludedReciterId
    )
    const shuffled = [...remaining].sort(() => Math.random() - 0.5)
    const orderedReciters = preferredReciter && preferredReciter.identifier !== excludedReciterId
      ? [preferredReciter, ...shuffled]
      : shuffled

    for (const reciter of orderedReciters) {
      try {
        const url = await getAyahAudioUrl(ayahNumber, reciter.identifier)
        return { url, reciter }
      } catch {
        continue
      }
    }

    return null
  }, [getAyahAudioUrl])
  
  // Fetch random ayah
  const fetchRandomAyah = useCallback(async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setAudioError(false)
    setAudioErrorMessage('')
    
    try {
      const randomAyahNumber = Math.floor(Math.random() * 6236) + 1
      
      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahNumber}`)
      const data = await response.json()
      
      if (data.code === 200 && data.data) {
        const ayah: Ayah = {
          number: data.data.number,
          text: data.data.text,
          surah: {
            number: data.data.surah.number,
            name: data.data.surah.name,
            englishName: data.data.surah.englishName,
          },
          juz: data.data.juz,
          page: data.data.page,
        }
        
        setCurrentAyah(ayah)
        
        let availableReciters = RECITERS.filter(r => !usedReciters.includes(r.identifier))
        if (availableReciters.length === 0) {
          setUsedReciters([])
          availableReciters = RECITERS
        }
        const randomReciter = availableReciters[Math.floor(Math.random() * availableReciters.length)]
        const resolvedAudio = await resolveAudioSource(ayah.number, randomReciter)
        if (resolvedAudio) {
          setCurrentReciter(resolvedAudio.reciter)
          setUsedReciters(prev => [...prev, resolvedAudio.reciter.identifier])
          setAudioUrl(resolvedAudio.url)
          setAudioError(false)
          setAudioErrorMessage('')
        } else {
          setAudioUrl('')
          setAudioError(true)
          setAudioErrorMessage('تعذر تحميل الصوت من API لهذه الآية حاليًا')
          toast.error('تعذر تحميل الصوت من API لهذه الآية حاليًا')
        }
        
        const transResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/en.sahih`)
        const transData = await transResponse.json()
        if (transData.code === 200 && transData.data) {
          setTranslation({
            text: transData.data.text,
            language: 'en'
          })
        }
        
        setCurrentPrompt(REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)])
        
        setTimeout(() => {
          if (audioRef.current && !muted && resolvedAudio) {
            audioRef.current.play().catch(() => {})
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error fetching ayah:', error)
      toast.error('حدث خطأ أثناء جلب الآية')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, muted, resolveAudioSource, usedReciters])

  // Fit the ايه placeholder height so the full verse is visible without scrolling.
  useEffect(() => {
    if (!currentAyah) return
    if (!verseTextRef.current) return

    const base = fontSize === 'small' ? 200 : fontSize === 'large' ? 280 : 240
    const min = 180
    const max = 560

    let cancelled = false

    const runFit = () => {
      if (cancelled) return

      const textEl = verseTextRef.current
      const panelEl = versePanelRef.current
      if (!textEl || !panelEl) return

      // scrollHeight is the full height of the text as it wraps (even if the panel is smaller).
      const needed = textEl.scrollHeight
      // Add extra space so lines never get clipped (prevents "overlap" look).
      const next = Math.max(min, Math.min(max, Math.ceil(needed + 18)))
      setVersePanelHeightPx(next)
    }

    // Fonts can change metrics; wait for them to load to compute a correct height.
    const fontsReady = (document as any).fonts?.ready
    if (fontsReady && typeof fontsReady.then === 'function') {
      void fontsReady.then(runFit)
    } else {
      runFit()
    }

    // Also fit immediately for responsiveness.
    setVersePanelHeightPx(base)

    const onResize = () => {
      setVersePanelHeightPx(base)
      runFit()
    }

    window.addEventListener('resize', onResize)
    return () => {
      cancelled = true
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAyah?.number, fontSize, quranFont])
  
  // Handle audio error - fallback to another reciter
  const handleAudioError = useCallback(async () => {
    if (!currentAyah || audioError) return
    
    setAudioError(true)
    setAudioErrorMessage('')

    const fallbackAudio = await resolveAudioSource(currentAyah.number, undefined, currentReciter.identifier)
    if (fallbackAudio) {
      setCurrentReciter(fallbackAudio.reciter)
      setAudioUrl(fallbackAudio.url)
      setAudioError(false)
      setAudioErrorMessage('')
      toast.success(`تم التبديل إلى ${fallbackAudio.reciter.name}`)
      return
    }

    setAudioErrorMessage('تعذر تحميل الصوت من API. يرجى المحاولة بآية أخرى')
    toast.error('تعذر تحميل الصوت من API. يرجى المحاولة بآية أخرى')
  }, [audioError, currentAyah, currentReciter.identifier, resolveAudioSource])
  
  // Auto mode effect
  useEffect(() => {
    if (autoMode) {
      autoModeRef.current = setInterval(() => {
        fetchRandomAyah()
      }, autoInterval * 1000)
    } else {
      if (autoModeRef.current) {
        clearInterval(autoModeRef.current)
        autoModeRef.current = null
      }
    }
    
    return () => {
      if (autoModeRef.current) {
        clearInterval(autoModeRef.current)
      }
    }
  }, [autoMode, autoInterval, fetchRandomAyah])
  
  // Audio event handlers
  const handleAudioEnded = () => {
    if (autoMode) {
      fetchRandomAyah()
    }
  }
  
  // Toggle favorite
  const toggleFavorite = () => {
    if (!currentAyah) return
    
    const exists = favorites.some(f => f.ayah.number === currentAyah.number)
    
    if (exists) {
      setFavorites(prev => prev.filter(f => f.ayah.number !== currentAyah.number))
      toast.success('تمت الإزالة من المفضلة')
    } else {
      setFavorites(prev => [...prev, { ayah: currentAyah, timestamp: Date.now() }])
      toast.success('تمت الإضافة إلى المفضلة')
    }
  }
  
  const isFavorite = currentAyah ? favorites.some(f => f.ayah.number === currentAyah.number) : false
  
  // Share functions
  const shareText = currentAyah 
    ? `${currentAyah.text}\n\n${currentAyah.surah.name} - الآية ${currentAyah.number}\n#QuranAyahExperience`
    : ''
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      toast.success('تم النسخ إلى الحافظة')
    })
  }
  
  // Generate ayah image
  const generateAyahImage = () => {
    if (!currentAyah || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = 1080
    canvas.height = 1920
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#3F7D7B')
    gradient.addColorStop(1, '#2B5554')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.beginPath()
    ctx.arc(540, 400, 300, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 2
    ctx.stroke()
    
    ctx.beginPath()
    ctx.arc(540, 400, 250, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 3
    ctx.stroke()
    
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '500 32px "Noto Sans Arabic"'
    ctx.textAlign = 'center'
    ctx.fillText('آية من القرآن الكريم', 540, 200)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 48px "${quranFont === 'amiri' ? 'Amiri' : 'Scheherazade New'}"`
    
    const words = currentAyah.text.split(' ')
    let line = ''
    let y = 500
    const lineHeight = 80
    const maxWidth = 900
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' '
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, 540, y)
        line = words[i] + ' '
        y += lineHeight
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, 540, y)
    
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '500 36px "Noto Sans Arabic"'
    ctx.fillText(`${currentAyah.surah.name} - الآية ${currentAyah.number}`, 540, y + 100)
    
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '400 28px "Inter"'
    ctx.fillText('Quran Ayah Experience', 540, 1800)
    
    const link = document.createElement('a')
    link.download = `ayah-${currentAyah.number}.png`
    link.href = canvas.toDataURL()
    link.click()
    
    toast.success('تم تحميل الصورة')
  }
  
  // Get tafsir
  const getTafsir = () => {
    if (!currentAyah) return 'جاري تحميل التفسير...'
    return `تفسير الآية ${currentAyah.number} من سورة ${currentAyah.surah.name}. هذه الآية تحمل معانٍ عميقة في القرآن الكريم، ويُستحسن الرجوع إلى كتب التفسير المعتمدة مثل تفسير ابن كثير أو تفسير السعدي للمزيد من التفاصيل.`
  }
  
  // Font size classes
  const fontSizeClasses = {
    small: 'text-xl md:text-2xl',
    medium: 'text-2xl md:text-3xl lg:text-4xl',
    large: 'text-3xl md:text-4xl lg:text-5xl',
  }
  
  // Remove from favorites
  const removeFromFavorites = (ayahNumber: number) => {
    setFavorites(prev => prev.filter(f => f.ayah.number !== ayahNumber))
    toast.success('تمت الإزالة من المفضلة')
  }
  
  return (
    <div dir="rtl" className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-offwhite dark:bg-gray-900 transition-colors duration-300">
        <div className="grain-overlay" />
        <Toaster position="top-center" richColors />
        
        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Welcome Modal */}
        <Dialog open={showWelcomeModal} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-0 rounded-3xl shadow-card">
            <div className="text-center py-8">
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="w-full h-full glow-ring animate-pulse-ring" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="#3F7D7B" strokeWidth="2" />
                  <circle cx="100" cy="100" r="75" fill="none" stroke="#3F7D7B" strokeWidth="1" strokeOpacity="0.5" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-teal-600 dark:text-teal-400 text-6xl font-amiri">ﷺ</span>
                </div>
              </div>
              
              <p className="heading-en text-xs text-gray-500 dark:text-gray-400 mb-4 tracking-widest">QURAN AYAH</p>
              
              <h2 className="text-3xl font-amiri text-gray-900 dark:text-white mb-4 leading-relaxed">
                صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ
              </h2>
              
              <p className="arabic-ui text-gray-600 dark:text-gray-300 mb-8">
                اضغط للسماح بالصوت ثم ابدأ
              </p>
              
              <div className="flex flex-col gap-3">
                <Button onClick={handleWelcomeClose} className="btn-pill bg-teal-600 hover:bg-teal-700 text-white">
                  ابدأ
                </Button>
                <Button variant="ghost" onClick={handleWelcomeClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                  لاحقًا
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Main Content */}
        {!showWelcomeModal && (
          <div className="min-h-screen flex flex-col relative">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <span className="heading-en text-xs text-teal-700/80 dark:text-teal-300/80 tracking-widest bg-white/70 dark:bg-gray-800/70 px-3 py-1.5 rounded-full border border-teal-100 dark:border-gray-700 backdrop-blur-sm">
                  QURAN AYAH
                </span>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMuted(!muted)}
                    className="rounded-full bg-white/85 dark:bg-gray-800/85 backdrop-blur-sm shadow-sm hover:shadow-md"
                  >
                    {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDarkMode(!darkMode)}
                    className="rounded-full bg-white/85 dark:bg-gray-800/85 backdrop-blur-sm shadow-sm hover:shadow-md"
                  >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(true)}
                    className="rounded-full bg-white/85 dark:bg-gray-800/85 backdrop-blur-sm shadow-sm hover:shadow-md"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </header>
            
            {/* Main Card */}
            <main className="flex-1 flex items-center justify-center px-4 py-20">
              <div className="w-full max-w-3xl">
                <div className="bg-gradient-to-b from-white/95 to-white dark:from-gray-800/95 dark:to-gray-800 rounded-[28px] card-shadow p-8 md:p-12 border border-white/70 dark:border-gray-700/70">
                  {/* ايه Panel (banner placeholder like your screenshot) */}
                  <div
                    ref={versePanelRef}
                    className="mb-8 mx-auto w-full rounded-2xl border border-white/70 dark:border-gray-700/70 bg-white/60 dark:bg-gray-900/40 shadow-inner backdrop-blur-sm px-4 py-5 md:px-6 md:py-7"
                    style={{ height: versePanelHeightPx }}
                  >
                    <div className="flex items-start justify-end mb-2">
                      {currentAyah ? (
                        <span className="text-xs md:text-sm text-gray-500 dark:text-gray-300 arabic-ui">
                          {currentAyah.number} - {currentAyah.surah.englishName || currentAyah.surah.name}
                        </span>
                      ) : null}
                    </div>

                    <div className="h-full overflow-visible">
                      {currentAyah ? (
                        <p
                          ref={verseTextRef}
                          className={`${fontSizeClasses[fontSize]} ${quranFont === 'amiri' ? 'font-amiri' : 'font-scheherazade'} text-gray-900 dark:text-white leading-[1.95] break-normal text-center`}
                        >
                          {currentAyah.text}
                        </p>
                      ) : (
                        <p className="text-gray-400 arabic-ui">اضغط على الزر لعرض آية</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Reciter Info */}
                  {currentAyah && (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6 arabic-ui">
                      القارئ: {currentReciter.name}
                    </p>
                  )}
                  
                  {/* Audio Player */}
                  {audioUrl && (
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onEnded={handleAudioEnded}
                      onError={handleAudioError}
                      muted={muted}
                      className="w-full mb-6"
                      controls
                    />
                  )}
                  {audioErrorMessage && (
                    <p className="text-center text-sm text-red-500 dark:text-red-400 mb-6 arabic-ui">
                      {audioErrorMessage}
                    </p>
                  )}
                  
                  {/* Main Controls */}
                  <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                    <Button
                      onClick={fetchRandomAyah}
                      disabled={isLoading}
                      className="btn-pill bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-5 h-5 ml-2" />
                          إظهار آية جديدة
                        </>
                      )}
                    </Button>
                    
                    {currentAyah && (
                      <>
                        <Button
                          onClick={toggleFavorite}
                          variant="outline"
                          className={`btn-pill ${isFavorite ? 'bg-red-50 text-red-500 border-red-200 dark:bg-red-500/10 dark:border-red-500/30' : ''}`}
                        >
                          <Heart className={`w-5 h-5 ml-2 ${isFavorite ? 'fill-current' : ''}`} />
                          {isFavorite ? 'محفوظ' : 'حفظ'}
                        </Button>
                        
                        <Button
                          onClick={() => setShowFavorites(true)}
                          variant="outline"
                          className="btn-pill"
                        >
                          <BookOpen className="w-5 h-5 ml-2" />
                          المفضلة ({favorites.length})
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {/* Secondary Controls */}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {/* Auto Mode */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-full">
                      <Zap className="w-4 h-4 text-teal-600" />
                      <span className="text-sm arabic-ui">تلقائي</span>
                      <Switch checked={autoMode} onCheckedChange={setAutoMode} />
                    </div>
                    
                    {/* Tafsir */}
                    {currentAyah && (
                      <Button
                        onClick={() => setShowTafsir(!showTafsir)}
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                      >
                        <BookOpen className="w-4 h-4 ml-1" />
                        تفسير
                        {showTafsir ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                      </Button>
                    )}
                    
                    {/* Translation */}
                    {currentAyah && (
                      <Button
                        onClick={() => setShowTranslation(!showTranslation)}
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                      >
                        <Globe className="w-4 h-4 ml-1" />
                        ترجمة
                        {showTranslation ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                      </Button>
                    )}
                    
                    {/* Share */}
                    {currentAyah && (
                      <Button
                        onClick={copyToClipboard}
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                      >
                        <Copy className="w-4 h-4 ml-1" />
                        نسخ
                      </Button>
                    )}
                    
                    {/* Generate Image */}
                    {currentAyah && (
                      <Button
                        onClick={generateAyahImage}
                        variant="ghost"
                        size="sm"
                        className="rounded-full"
                      >
                        <ImageIcon className="w-4 h-4 ml-1" />
                        صورة
                      </Button>
                    )}
                  </div>
                  
                  {/* Tafsir Section */}
                  {showTafsir && currentAyah && (
                    <div className="mt-6 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl animate-fade-in">
                      <h3 className="text-teal-700 dark:text-teal-400 font-semibold mb-2 arabic-ui flex items-center">
                        <BookOpen className="w-5 h-5 ml-2" />
                        التفسير
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 arabic-ui leading-relaxed">
                        {getTafsir()}
                      </p>
                    </div>
                  )}
                  
                  {/* Translation Section */}
                  {showTranslation && translation && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl animate-fade-in">
                      <h3 className="text-blue-700 dark:text-blue-400 font-semibold mb-2 flex items-center">
                        <Globe className="w-5 h-5 ml-2" />
                        Translation
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {translation.text}
                      </p>
                    </div>
                  )}
                  
                  {/* Reflection Prompt */}
                  {currentAyah && currentPrompt && (
                    <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
                      <p className="text-purple-700 dark:text-purple-400 text-sm mb-2 arabic-ui">تدبر</p>
                      <p className="text-gray-800 dark:text-gray-200 arabic-ui text-lg">
                        {currentPrompt}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </main>
            
            {/* Footer */}
            <footer className="py-8 px-4 border-t border-gray-200 dark:border-gray-800">
              <div className="max-w-7xl mx-auto text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 arabic-ui">
                  تجربة آية قرآنية — لحظة هدوء وتدبر
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Quran Ayah Experience — a quiet moment of reflection
                </p>
              </div>
            </footer>
          </div>
        )}
        
        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 rounded-3xl">
            <DialogHeader>
              <DialogTitle className="arabic-ui text-right">الإعدادات</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Font Size */}
              <div>
                <Label className="arabic-ui mb-2 block">حجم الخط</Label>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <Button
                      key={size}
                      onClick={() => setFontSize(size)}
                      variant={fontSize === size ? 'default' : 'outline'}
                      className="flex-1"
                    >
                      {size === 'small' && 'صغير'}
                      {size === 'medium' && 'متوسط'}
                      {size === 'large' && 'كبير'}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Quran Font */}
              <div>
                <Label className="arabic-ui mb-2 block">خط القرآن</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setQuranFont('amiri')}
                    variant={quranFont === 'amiri' ? 'default' : 'outline'}
                    className="flex-1 font-amiri"
                  >
                    عمري
                  </Button>
                  <Button
                    onClick={() => setQuranFont('scheherazade')}
                    variant={quranFont === 'scheherazade' ? 'default' : 'outline'}
                    className="flex-1 font-scheherazade"
                  >
                    شهرزاد
                  </Button>
                </div>
              </div>
              
              {/* Auto Interval */}
              <div>
                <Label className="arabic-ui mb-2 block">
                  فترة التشغيل التلقائي: {autoInterval} ثانية
                </Label>
                <Slider
                  value={[autoInterval]}
                  onValueChange={(v) => setAutoInterval(v[0])}
                  min={10}
                  max={60}
                  step={5}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Favorites Dialog */}
        <Dialog open={showFavorites} onOpenChange={setShowFavorites}>
          <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 rounded-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="arabic-ui text-right">الآيات المحفوظة</DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="h-[50vh]">
              {favorites.length === 0 ? (
                <div className="text-center py-8 text-gray-500 arabic-ui">
                  لا توجد آيات محفوظة
                </div>
              ) : (
                <div className="space-y-4">
                  {favorites.map((fav) => (
                    <div
                      key={fav.ayah.number}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-teal-600 dark:text-teal-400 mb-1 arabic-ui">
                            {fav.ayah.surah.name} — الآية {fav.ayah.number}
                          </p>
                          <p className={`${quranFont === 'amiri' ? 'font-amiri' : 'font-scheherazade'} text-lg text-gray-900 dark:text-white leading-relaxed`}>
                            {fav.ayah.text}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromFavorites(fav.ayah.number)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default App
