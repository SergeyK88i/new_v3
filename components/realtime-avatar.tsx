"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2, VolumeX, Sliders, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface RealTimeAvatarProps {
  text: string
  isActive: boolean
  isMuted: boolean
  onToggleMute: () => void
  onSpeakingStart?: () => void
  onSpeakingEnd?: () => void
  onUserSpeechStart?: () => void
  onUserSpeechEnd?: (text: string) => void
}

export function RealTimeAvatar({
  text,
  isActive,
  isMuted,
  onToggleMute,
  onSpeakingStart,
  onSpeakingEnd,
  onUserSpeechStart,
  onUserSpeechEnd,
}: RealTimeAvatarProps) {
  // Состояния
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [currentSentence, setCurrentSentence] = useState("")
  const [audioVolume, setAudioVolume] = useState(0.8)
  const [speechRate, setSpeechRate] = useState(1)
  const [speechPitch, setSpeechPitch] = useState(1)
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastProcessedText, setLastProcessedText] = useState("")
  const [currentEmotion, setCurrentEmotion] = useState<"neutral" | "happy" | "concerned" | "thinking">("neutral")
  const [lipSyncData, setLipSyncData] = useState<number[]>([])

  // Refs
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const recognitionRef = useRef<any>(null)

  // Инициализация синтеза речи
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.speechSynthesis) {
        speechSynthesisRef.current = window.speechSynthesis

        const loadVoices = () => {
          const voices = speechSynthesisRef.current?.getVoices() || []
          setAvailableVoices(voices)

          const russianVoice = voices.find((voice) => voice.lang.includes("ru"))
          const defaultVoice = russianVoice || voices.find((voice) => voice.default) || voices[0]
          setSelectedVoice(defaultVoice || null)
        }

        if (speechSynthesisRef.current.onvoiceschanged !== undefined) {
          speechSynthesisRef.current.onvoiceschanged = loadVoices
        }

        loadVoices()
      }

      setIsInitialized(true)
    }

    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.error("Ошибка при остановке распознавания речи:", e)
        }
      }
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

  // Обработка изменения текста - синтез речи
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
        startAudioAnalysis()
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

  // Функция для анализа аудио и синхронизации губ
  const startAudioAnalysis = () => {
    const analyzeAudio = () => {
      if (!isSpeaking) {
        setLipSyncData([])
        return
      }

      const time = Date.now() * 0.01
      const baseValue = Math.sin(time) * 0.3 + 0.5
      const randomVariation = Math.random() * 0.4

      const newLipSyncData = Array(5)
        .fill(0)
        .map((_, i) => {
          return Math.max(0, Math.min(1, baseValue + randomVariation * (i % 3 === 0 ? 1 : 0.5)))
        })

      setLipSyncData(newLipSyncData)

      animationFrameRef.current = requestAnimationFrame(analyzeAudio)
    }

    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }

  // Инициализация распознавания речи
  const initSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.error("Ваш браузер не поддерживает распознавание речи")
      return null
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "ru-RU"

    recognition.onstart = () => {
      setIsListening(true)
      onUserSpeechStart?.()
    }

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join("")

      if (event.results[0].isFinal) {
        onUserSpeechEnd?.(transcript)
        stopListening()
      }
    }

    recognition.onerror = (event: any) => {
      console.error("Ошибка распознавания речи:", event.error)
      stopListening()
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    return recognition
  }

  // Начало прослушивания
  const startListening = () => {
    if (isSpeaking) {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel()
      }
      setIsSpeaking(false)
    }

    const recognition = recognitionRef.current || initSpeechRecognition()
    if (recognition) {
      recognitionRef.current = recognition
      try {
        recognition.start()
      } catch (error) {
        console.error("Ошибка запуска распознавания:", error)
      }
    }
  }

  // Остановка прослушивания
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error("Ошибка остановки распознавания:", error)
      }
    }
    setIsListening(false)
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg overflow-hidden">
      {/* Фон */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Улучшенный видео аватар */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative w-80 h-80 rounded-full overflow-hidden border-4 border-white shadow-2xl"
          animate={{
            scale: isSpeaking ? [1, 1.02, 1] : 1,
            boxShadow: isSpeaking
              ? ["0 0 0 0 rgba(59, 130, 246, 0.4)", "0 0 0 20px rgba(59, 130, 246, 0)", "0 0 0 0 rgba(59, 130, 246, 0)"]
              : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
          transition={{
            duration: isSpeaking ? 1.5 : 0.3,
            repeat: isSpeaking ? Number.POSITIVE_INFINITY : 0,
          }}
        >
          <img src="/anna-avatar.jpg" alt="ESG Consultant Avatar" className="w-full h-full object-cover" />

          {/* Улучшенная анимация губ */}
          <motion.div
            className="absolute bottom-[25%] left-1/2 transform -translate-x-1/2"
            animate={{
              scale: isSpeaking ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 0.3,
              repeat: isSpeaking ? Number.POSITIVE_INFINITY : 0,
            }}
          >
            {/* Основные губы */}
            <motion.div
              className="bg-red-400 rounded-full relative"
              animate={{
                width: isSpeaking ? `${30 + Math.sin(Date.now() * 0.01) * 10}px` : "20px",
                height: isSpeaking ? `${12 + Math.sin(Date.now() * 0.015) * 6}px` : "4px",
                opacity: isSpeaking ? 0.8 : 0.5,
              }}
              transition={{ duration: 0.1 }}
            />

            {/* Дополнительные элементы для реалистичности */}
            {isSpeaking &&
              lipSyncData.map((value, index) => (
                <motion.div
                  key={index}
                  className="absolute bg-red-300 rounded-full"
                  style={{
                    width: `${15 + value * 8}px`,
                    height: `${3 + value * 4}px`,
                    left: `${index * 3 - 6}px`,
                    top: `${index % 2 === 0 ? -2 : 2}px`,
                  }}
                  animate={{
                    opacity: [0.3, 0.7, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 0.2 + index * 0.05,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                />
              ))}
          </motion.div>

          {/* Индикатор эмоции на аватаре */}
          <motion.div
            className="absolute top-4 right-4 bg-black/60 rounded-full px-2 py-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="text-white text-xs">
              {currentEmotion === "happy"
                ? "😊"
                : currentEmotion === "concerned"
                  ? "😟"
                  : currentEmotion === "thinking"
                    ? "🤔"
                    : "😐"}
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Текущее предложение */}
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
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
          {/* Кнопка микрофона */}
          <Button
            size="lg"
            variant={isListening ? "destructive" : "default"}
            onClick={isListening ? stopListening : startListening}
            className="rounded-full"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {/* Кнопка звука */}
          <Button
            size="lg"
            variant="outline"
            onClick={onToggleMute}
            className="rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>

          {/* Настройки */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Sliders className="w-5 h-5" />
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
      </div>

      {/* Индикатор активности */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 rounded-lg px-3 py-1 backdrop-blur-sm">
        <div
          className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-green-500" : isListening ? "bg-blue-500" : "bg-gray-500"}`}
        />
        <p className="text-white text-xs">{isSpeaking ? "Говорю" : isListening ? "Слушаю" : "Готова"}</p>
      </div>

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
