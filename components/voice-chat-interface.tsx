"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Volume2, VolumeX, Send, X, History, EyeOff, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TalkingAvatar } from "@/components/talking-avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VoiceChatInterfaceProps {
  messages: any[]
  isListening: boolean
  isSpeaking: boolean
  isMuted: boolean
  onStartListening: () => void
  onStopListening: () => void
  onToggleMute: () => void
  onSendMessage: (text: string) => void
  hasSpokenWelcome: boolean
  onWelcomeSpoken: () => void
  isLoading: boolean
}

export function VoiceChatInterface({
  messages,
  isListening,
  isSpeaking,
  isMuted,
  onStartListening,
  onStopListening,
  onToggleMute,
  onSendMessage,
  hasSpokenWelcome,
  onWelcomeSpoken,
  isLoading,
}: VoiceChatInterfaceProps) {
  const [recordedText, setRecordedText] = useState("")
  const [showConfirmButtons, setShowConfirmButtons] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [microphoneError, setMicrophoneError] = useState<string | null>(null)
  const [isHttpsRequired, setIsHttpsRequired] = useState(false)

  // Проверка поддержки и безопасности при загрузке
  useEffect(() => {
    const checkSupport = () => {
      // Проверяем поддержку Speech Recognition
      if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
        setMicrophoneError("Ваш браузер не поддерживает распознавание речи")
        return
      }

      // Проверяем HTTPS
      const isSecure =
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"

      if (!isSecure) {
        setIsHttpsRequired(true)
        setMicrophoneError("Для работы микрофона требуется HTTPS соединение")
        return
      }

      // Проверяем доступ к микрофону
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(() => {
            setMicrophoneError(null)
          })
          .catch((error) => {
            console.error("Ошибка доступа к микрофону:", error)
            setMicrophoneError("Доступ к микрофону запрещен. Разрешите использование микрофона в настройках браузера")
          })
      }
    }

    checkSupport()
  }, [])

  // Визуализация аудио
  const AudioVisualizer = ({ isActive }: { isActive: boolean }) => (
    <div className="flex items-center justify-center gap-1 h-24">
      {[...Array(9)].map((_, i) => (
        <motion.div
          key={i}
          className={`rounded-full ${
            isActive ? (isListening || isRecording ? "bg-blue-500" : "bg-green-500") : "bg-gray-300"
          }`}
          style={{ width: "5px" }}
          animate={{
            height: isActive ? [8, 16 + Math.random() * 24, 8] : 8,
            opacity: isActive ? [0.4, 1, 0.4] : 0.3,
          }}
          transition={{
            duration: 0.5,
            repeat: isActive ? Number.POSITIVE_INFINITY : 0,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  )

  // Получаем последнее сообщение ассистента для озвучки
  const lastAssistantMessage = messages.filter((m) => m.role === "assistant").pop()?.content || ""

  const initVoiceSpeechRecognition = () => {
    if (microphoneError) {
      console.error("Микрофон недоступен:", microphoneError)
      return null
    }

    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setMicrophoneError("Ваш браузер не поддерживает распознавание речи")
      return null
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "ru-RU"

      recognition.onstart = () => {
        setIsRecording(true)
        setMicrophoneError(null)
      }

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript
        console.log("Распознанный текст:", transcript)

        setRecordedText(transcript)
        setShowConfirmButtons(true)
        setIsRecording(false)
        onStopListening()
      }

      recognition.onerror = (event: any) => {
        console.error("Ошибка распознавания речи:", event.error)

        let errorMessage = "Произошла ошибка"
        switch (event.error) {
          case "not-allowed":
            errorMessage = "Доступ к микрофону запрещен. Разрешите использование микрофона в настройках браузера"
            break
          case "no-speech":
            errorMessage = "Речь не обнаружена. Попробуйте еще раз"
            break
          case "audio-capture":
            errorMessage = "Микрофон недоступен. Проверьте подключение"
            break
          case "network":
            errorMessage = "Ошибка сети. Проверьте интернет-соединение"
            break
          default:
            errorMessage = `Ошибка: ${event.error}`
        }

        setMicrophoneError(errorMessage)
        onStopListening()
        setIsRecording(false)
        setShowConfirmButtons(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
        if (!showConfirmButtons) {
          onStopListening()
        }
      }

      return recognition
    } catch (error) {
      console.error("Ошибка создания распознавания речи:", error)
      setMicrophoneError("Не удалось инициализировать распознавание речи")
      return null
    }
  }

  // Обработчики кликов с логированием
  const handleMicClick = () => {
    console.log("Клик по микрофону, состояние:", { isListening, isRecording, microphoneError })

    if (microphoneError) {
      console.error("Попытка запуска с ошибкой:", microphoneError)
      return
    }

    if (isListening || isRecording) {
      console.log("Останавливаем прослушивание")
      onStopListening()
      setIsRecording(false)
    } else {
      console.log("Запускаем прослушивание")
      if (isSpeaking) {
        window.speechSynthesis?.cancel()
      }

      const recognition = initVoiceSpeechRecognition()
      if (recognition) {
        onStartListening()
        try {
          recognition.start()
        } catch (error) {
          console.error("Ошибка запуска распознавания:", error)
          setMicrophoneError("Не удалось запустить распознавание речи")
          onStopListening()
        }
      }
    }
  }

  const handleMuteClick = () => {
    console.log("Клик по кнопке звука, текущее состояние:", isMuted)
    onToggleMute()
  }

  const handleHistoryClick = () => {
    console.log("Клик по истории, текущее состояние:", showHistory)
    setShowHistory(!showHistory)
  }

  const handleSendMessage = () => {
    console.log("Отправка сообщения:", recordedText)
    if (recordedText.trim()) {
      onSendMessage(recordedText)
    }
    setRecordedText("")
    setShowConfirmButtons(false)
  }

  const handleCancelMessage = () => {
    console.log("Отмена сообщения")
    setRecordedText("")
    setShowConfirmButtons(false)
  }

  const getStatusText = () => {
    if (microphoneError) return microphoneError
    if (isLoading) return "Анализирую ваш запрос..."
    if (isRecording) return "Слушаю вас внимательно..."
    if (showConfirmButtons) return "Отправить сообщение?"
    if (isSpeaking) return "Отвечаю на ваш вопрос..."
    return "Готова к голосовому общению"
  }

  const getStatusColor = () => {
    if (microphoneError) return "text-red-500"
    if (isLoading) return "text-orange-500"
    if (isRecording) return "text-blue-500"
    if (showConfirmButtons) return "text-purple-500"
    if (isSpeaking) return "text-green-500"
    return "text-gray-500"
  }

  return (
    <div className="flex-1 flex flex-col relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Фоновые эффекты */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-green-900/20 pointer-events-none"></div>

      {/* Ошибка микрофона */}
      {microphoneError && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {microphoneError}
              {isHttpsRequired && (
                <div className="mt-2 text-sm">
                  <strong>Решения:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li>
                      Используйте HTTPS: <code>npm run dev -- --experimental-https</code>
                    </li>
                    <li>Или используйте ngrok для туннелирования</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* История чата - выдвижная панель */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="absolute top-0 right-0 w-80 h-full bg-slate-800/95 backdrop-blur-xl border-l border-slate-700 z-30 shadow-2xl"
          >
            <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-green-600 to-emerald-600">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">История разговора</h3>
                <Button variant="ghost" size="sm" onClick={handleHistoryClick} className="text-white hover:bg-white/20">
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4 h-[calc(100%-60px)]">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="flex gap-2 max-w-[90%]">
                      {message.role === "assistant" && (
                        <Avatar className="h-6 w-6 border border-slate-600">
                          <AvatarImage src="/anna-avatar.jpg" alt="Анна" />
                          <AvatarFallback className="bg-green-600 text-white text-xs">А</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`rounded-xl p-3 text-sm backdrop-blur-sm ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                            : "bg-slate-700/80 text-slate-100 border border-slate-600"
                        }`}
                      >
                        {message.content}
                      </div>
                      {message.role === "user" && (
                        <Avatar className="h-6 w-6 border border-slate-600">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">Вы</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Основной интерфейс с аватаром */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative pointer-events-none">
        {/* Аватар с эффектами */}
        <motion.div
          className="relative z-10 w-full max-w-lg pointer-events-auto"
          animate={{
            scale: isListening || isSpeaking || isRecording ? [1, 1.02, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: isListening || isSpeaking || isRecording ? Number.POSITIVE_INFINITY : 0,
          }}
        >
          <div className="relative">
            {/* Светящийся ореол */}
            {(isListening || isSpeaking || isRecording) && (
              <motion.div
                className={`absolute inset-0 rounded-lg pointer-events-none ${
                  isListening || isRecording ? "shadow-blue-500/50" : "shadow-green-500/50"
                }`}
                animate={{
                  boxShadow: [
                    "0 0 20px 5px rgba(59, 130, 246, 0.5)",
                    "0 0 40px 10px rgba(59, 130, 246, 0.3)",
                    "0 0 20px 5px rgba(59, 130, 246, 0.5)",
                  ],
                }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              />
            )}

            <TalkingAvatar
              text={hasSpokenWelcome ? (messages.length > 1 ? lastAssistantMessage : "") : messages[0]?.content || ""}
              isActive={true}
              isMuted={isMuted}
              onToggleMute={handleMuteClick}
              onSpeakingStart={() => console.log("Начал говорить")}
              onSpeakingEnd={() => {
                if (!hasSpokenWelcome) {
                  onWelcomeSpoken()
                }
              }}
              avatarImage="/anna-avatar.jpg"
            />
          </div>
        </motion.div>

        {/* Визуализация аудио */}
        <div className="mt-8 w-full max-w-md pointer-events-none">
          <AudioVisualizer isActive={isListening || isSpeaking || isRecording} />
        </div>

        {/* Статус */}
        <motion.div
          className="mt-6 text-center pointer-events-none"
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
          }}
        >
          <p className={`text-lg font-medium ${getStatusColor()}`}>{getStatusText()}</p>
        </motion.div>

        {/* Показываем распознанный текст */}
        <AnimatePresence>
          {showConfirmButtons && recordedText && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 p-6 bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-600 max-w-md shadow-xl pointer-events-auto"
            >
              <div className="text-center">
                <p className="text-slate-300 text-sm mb-2 font-medium">Распознанный текст:</p>
                <p className="text-white text-base leading-relaxed">"{recordedText}"</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Контролы - ВАЖНО: убираем все анимации motion и делаем кнопки простыми */}
      <div className="p-8 bg-gradient-to-t from-slate-900/90 to-transparent relative z-40">
        <AnimatePresence mode="wait">
          {showConfirmButtons ? (
            // Кнопки подтверждения
            <div key="confirm" className="flex justify-center gap-6">
              <Button
                size="lg"
                onClick={handleSendMessage}
                className="rounded-full w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
                disabled={isLoading}
              >
                <Send className="w-6 h-6" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleCancelMessage}
                className="rounded-full w-16 h-16 border-2 border-red-400/50 text-red-400 hover:bg-red-500/20"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          ) : (
            // Основные контролы - убираем motion.div обертки
            <div key="main" className="flex justify-center gap-6">
              <Button
                size="lg"
                variant={isListening || isRecording ? "destructive" : "default"}
                onClick={handleMicClick}
                className={`rounded-full w-16 h-16 ${
                  isListening || isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                }`}
                disabled={isLoading || !!microphoneError}
              >
                {isListening || isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleMuteClick}
                className="rounded-full w-16 h-16 border-2 border-slate-400/50 text-slate-300 hover:bg-slate-700/50"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleHistoryClick}
                className="rounded-full w-16 h-16 border-2 border-green-400/50 text-green-400 hover:bg-green-500/20"
              >
                {showHistory ? <EyeOff className="w-6 h-6" /> : <History className="w-6 h-6" />}
              </Button>
            </div>
          )}
        </AnimatePresence>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-400">
            {microphoneError
              ? "Исправьте ошибку микрофона для продолжения"
              : showConfirmButtons
                ? "Зеленая кнопка - отправить, красная - отменить"
                : isListening || isRecording
                  ? "Говорите сейчас, система вас слушает"
                  : "Нажмите микрофон и начните говорить"}
          </p>
        </div>
      </div>
    </div>
  )
}
