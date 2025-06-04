"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2, VolumeX, Sliders } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TalkingAvatarProps {
  text: string
  isActive: boolean
  isMuted: boolean
  onToggleMute: () => void
  onSpeakingStart?: () => void
  onSpeakingEnd?: () => void
  avatarImage?: string
}

export function TalkingAvatar({
  text,
  isActive,
  isMuted,
  onToggleMute,
  onSpeakingStart,
  onSpeakingEnd,
  avatarImage = "/anna-avatar.jpg",
}: TalkingAvatarProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentSentence, setCurrentSentence] = useState("")
  const [mouthOpenness, setMouthOpenness] = useState(0)
  const [blinkState, setBlinkState] = useState(0)
  const [audioVolume, setAudioVolume] = useState(0.8)
  const [speechRate, setSpeechRate] = useState(1)
  const [speechPitch, setSpeechPitch] = useState(1)
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [showControls, setShowControls] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastProcessedText, setLastProcessedText] = useState("")
  const [currentEmotion, setCurrentEmotion] = useState<"neutral" | "happy" | "concerned" | "thinking">("neutral")

  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Инициализация синтеза речи
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      speechSynthesisRef.current = window.speechSynthesis

      const loadVoices = () => {
        const voices = speechSynthesisRef.current?.getVoices() || []
        setAvailableVoices(voices)

        const russianVoice = voices.find((voice) => voice.lang.includes("ru"))
        const defaultVoice = russianVoice || voices.find((voice) => voice.default) || voices[0]
        setSelectedVoice(defaultVoice || null)
        setIsInitialized(true)
      }

      if (speechSynthesisRef.current.onvoiceschanged !== undefined) {
        speechSynthesisRef.current.onvoiceschanged = loadVoices
      }

      loadVoices()
    }

    // Настройка моргания
    const blinkInterval = setInterval(
      () => {
        setBlinkState(1)
        setTimeout(() => setBlinkState(0), 150)
      },
      3000 + Math.random() * 2000,
    )

    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      clearInterval(blinkInterval)
    }
  }, [])

  // Анализ эмоционального контекста текста
  useEffect(() => {
    if (!text) return

    const lowerText = text.toLowerCase()

    if (
      lowerText.includes("отлично") ||
      lowerText.includes("хорошо") ||
      lowerText.includes("прекрасно") ||
      lowerText.includes("поздравляю")
    ) {
      setCurrentEmotion("happy")
    } else if (
      lowerText.includes("проблема") ||
      lowerText.includes("низкий") ||
      lowerText.includes("плохо") ||
      lowerText.includes("внимание")
    ) {
      setCurrentEmotion("concerned")
    } else if (
      lowerText.includes("анализирую") ||
      lowerText.includes("рассмотрим") ||
      lowerText.includes("изучаю") ||
      lowerText.includes("думаю")
    ) {
      setCurrentEmotion("thinking")
    } else {
      setCurrentEmotion("neutral")
    }
  }, [text])

  // Обработка изменения текста
  useEffect(() => {
    if (!isInitialized || !text || !isActive || text === lastProcessedText) return

    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel()
    }

    setLastProcessedText(text)

    const sentences = text
      .replace(/([.?!])\s*(?=[A-ZА-Я])/g, "$1|")
      .split("|")
      .filter((s) => s.trim().length > 0)

    if (sentences.length === 0) return

    const speakSentences = async (index = 0) => {
      if (index >= sentences.length) {
        setIsSpeaking(false)
        setCurrentSentence("")
        setMouthOpenness(0)
        onSpeakingEnd?.()
        return
      }

      const sentence = sentences[index].trim()
      setCurrentSentence(sentence)

      const utterance = new SpeechSynthesisUtterance(sentence)
      utteranceRef.current = utterance

      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
      utterance.volume = isMuted ? 0 : audioVolume
      utterance.rate = speechRate
      utterance.pitch = speechPitch

      utterance.onstart = () => {
        setIsSpeaking(true)
        if (index === 0) {
          onSpeakingStart?.()
        }
      }

      utterance.onend = () => {
        setTimeout(() => speakSentences(index + 1), 300)
      }

      utterance.onerror = (event) => {
        console.error("Ошибка синтеза речи:", event)
        speakSentences(index + 1)
      }

      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.speak(utterance)
      }
    }

    speakSentences()
  }, [
    text,
    isActive,
    isInitialized,
    isMuted,
    audioVolume,
    speechRate,
    speechPitch,
    selectedVoice,
    lastProcessedText,
    onSpeakingStart,
    onSpeakingEnd,
  ])

  // Анимация рта на основе речи
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpenness(0)
      return
    }

    const animateMouth = () => {
      if (!isSpeaking) {
        setMouthOpenness(0)
        return
      }

      const time = Date.now() * 0.01
      const baseOpenness = Math.sin(time) * 0.3 + 0.5
      const randomVariation = Math.random() * 0.4
      const newOpenness = Math.max(0, Math.min(1, baseOpenness + randomVariation))

      setMouthOpenness(newOpenness)

      animationFrameRef.current = requestAnimationFrame(animateMouth)
    }

    animationFrameRef.current = requestAnimationFrame(animateMouth)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isSpeaking])

  // Получение стилей для эмоций
  const getEmotionStyles = () => {
    switch (currentEmotion) {
      case "happy":
        return {
          eyebrows: "translate-y-[-3px] scale-x-[1.1]",
          eyes: "scale-y-[0.85]",
          mouth: "scale-[1.15]",
          cheeks: "bg-pink-200/30",
        }
      case "concerned":
        return {
          eyebrows: "translate-y-[3px] rotate-[3deg] scale-x-[0.9]",
          eyes: "scale-y-[1.15]",
          mouth: "scale-y-[0.7] scale-x-[0.85]",
          cheeks: "bg-gray-200/20",
        }
      case "thinking":
        return {
          eyebrows: "translate-y-[2px] rotate-[-3deg] scale-x-[0.95]",
          eyes: "scale-y-[0.9]",
          mouth: "scale-x-[0.75]",
          cheeks: "bg-blue-200/20",
        }
      default:
        return {
          eyebrows: "",
          eyes: "",
          mouth: "",
          cheeks: "bg-transparent",
        }
    }
  }

  const emotionStyles = getEmotionStyles()

  return (
    <div
      className="relative w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Фон аватара */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Аватар */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-2xl"
          animate={{
            scale: isSpeaking ? [1, 1.03, 1] : 1,
            boxShadow: isSpeaking
              ? [
                  "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  "0 25px 50px -12px rgba(59, 130, 246, 0.4)",
                  "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                ]
              : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
          transition={{
            duration: isSpeaking ? 1.5 : 0.3,
            repeat: isSpeaking ? Number.POSITIVE_INFINITY : 0,
          }}
        >
          {/* Основное изображение аватара */}
          <img
            src={avatarImage || "/placeholder.svg"}
            alt="ESG Consultant Avatar"
            className="w-full h-full object-cover"
          />

          {/* Эмоциональные щеки */}
          <motion.div
            className={`absolute inset-0 ${emotionStyles.cheeks} rounded-full`}
            animate={{ opacity: currentEmotion !== "neutral" ? 0.6 : 0 }}
            transition={{ duration: 0.5 }}
          />

          {/* Анимация глаз (моргание) */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-transparent ${emotionStyles.eyes}`}
            animate={{
              background:
                blinkState > 0
                  ? "linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.9) 45%, rgba(0,0,0,0.9) 55%, transparent 65%)"
                  : "linear-gradient(to bottom, transparent 100%, transparent 100%)",
            }}
            transition={{ duration: 0.1 }}
          />

          {/* Брови (для эмоций) */}
          <motion.div
            className={`absolute top-[28%] left-[25%] right-[25%] h-2 bg-gradient-to-r from-transparent via-black/40 to-transparent rounded-full ${emotionStyles.eyebrows}`}
            animate={{ opacity: currentEmotion !== "neutral" ? 0.7 : 0 }}
            transition={{ duration: 0.5 }}
          />

          {/* Улучшенная анимация губ при говорении */}
          <motion.div
            className="absolute bottom-[22%] left-1/2 transform -translate-x-1/2"
            animate={{
              scale: isSpeaking ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 0.3,
              repeat: isSpeaking ? Number.POSITIVE_INFINITY : 0,
            }}
          >
            <motion.div
              className="bg-red-400 rounded-full"
              animate={{
                width: isSpeaking ? `${25 + mouthOpenness * 15}px` : "18px",
                height: isSpeaking ? `${8 + mouthOpenness * 12}px` : "3px",
                opacity: isSpeaking ? 0.8 : 0.4,
              }}
              transition={{ duration: 0.1 }}
            />

            {/* Дополнительные элементы рта для реалистичности */}
            {isSpeaking && (
              <>
                <motion.div
                  className="absolute top-1 left-1/2 transform -translate-x-1/2 bg-red-300 rounded-full"
                  animate={{
                    width: `${15 + mouthOpenness * 8}px`,
                    height: `${4 + mouthOpenness * 6}px`,
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 0.15,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                />
                <motion.div
                  className="absolute -top-1 left-1/2 transform -translate-x-1/2 bg-red-500 rounded-full"
                  animate={{
                    width: `${10 + mouthOpenness * 5}px`,
                    height: `${2 + mouthOpenness * 3}px`,
                    opacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{
                    duration: 0.2,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                />
              </>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Текущее предложение - показываем только в режиме видео */}
      <AnimatePresence>
        {currentSentence && isSpeaking && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/80 rounded-lg px-4 py-3 text-white max-w-[85%] backdrop-blur-sm border border-white/20"
          >
            <p className="text-sm text-center leading-relaxed">{currentSentence}</p>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-black/80"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Контролы */}
      <motion.div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleMute}
          className="rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <Sliders className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-black/90 border-white/20 text-white backdrop-blur-sm">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm">Громкость</label>
                  <span className="text-xs">{Math.round(audioVolume * 100)}%</span>
                </div>
                <Slider
                  value={[audioVolume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(value) => setAudioVolume(value[0])}
                  className="[&>span]:bg-blue-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm">Скорость речи</label>
                  <span className="text-xs">x{speechRate.toFixed(1)}</span>
                </div>
                <Slider
                  value={[speechRate]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={(value) => setSpeechRate(value[0])}
                  className="[&>span]:bg-green-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm">Тон голоса</label>
                  <span className="text-xs">{speechPitch.toFixed(1)}</span>
                </div>
                <Slider
                  value={[speechPitch]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={(value) => setSpeechPitch(value[0])}
                  className="[&>span]:bg-purple-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm">Голос</label>
                <select
                  value={selectedVoice?.voiceURI || ""}
                  onChange={(e) => {
                    const voice = availableVoices.find((v) => v.voiceURI === e.target.value) || null
                    setSelectedVoice(voice)
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-md p-2 text-sm text-white"
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI} className="bg-black text-white">
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </motion.div>

      {/* Индикатор активности */}
      {isActive && (
        <motion.div
          className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 rounded-lg px-3 py-1 backdrop-blur-sm"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-green-500" : "bg-blue-500"}`} />
          <p className="text-white text-xs">{isSpeaking ? "Говорю" : "Готова"}</p>
        </motion.div>
      )}

      {/* Индикатор эмоции */}
      <div className="absolute top-4 left-4 bg-black/60 rounded-lg px-3 py-1 backdrop-blur-sm">
        <Badge variant="outline" className="border-white/30 text-white bg-transparent">
          {currentEmotion === "happy"
            ? "😊 Позитивно"
            : currentEmotion === "concerned"
              ? "😟 Обеспокоенно"
              : currentEmotion === "thinking"
                ? "🤔 Задумчиво"
                : "😐 Нейтрально"}
        </Badge>
      </div>
    </div>
  )
}
