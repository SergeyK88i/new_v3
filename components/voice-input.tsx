"use client"

import { useState, useEffect, useCallback } from "react"
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VoiceInputProps {
  onTextReceived: (text: string) => void
  isDisabled?: boolean
  language?: string
}

export function VoiceInput({ onTextReceived, isDisabled = false, language = "ru-RU" }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<any>(null)
  const [isHttpsRequired, setIsHttpsRequired] = useState(false)

  // Проверка поддержки и безопасности
  const checkVoiceSupport = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setErrorMessage("Ваш браузер не поддерживает распознавание речи")
      return false
    }

    // Проверяем HTTPS
    const isSecure = window.location.protocol === "https:" || window.location.hostname === "localhost"
    if (!isSecure) {
      setIsHttpsRequired(true)
      setErrorMessage("Для работы микрофона требуется HTTPS соединение")
      return false
    }

    return true
  }, [])

  // Инициализация распознавания речи
  const initRecognition = useCallback(() => {
    if (!checkVoiceSupport()) return null

    setIsInitializing(true)

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognitionInstance = new SpeechRecognition()

    recognitionInstance.continuous = false
    recognitionInstance.interimResults = false
    recognitionInstance.lang = language

    recognitionInstance.onstart = () => {
      setIsListening(true)
      setErrorMessage(null)
      setIsInitializing(false)
    }

    recognitionInstance.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join("")

      onTextReceived(transcript)
      stopListening(recognitionInstance)
    }

    recognitionInstance.onerror = (event: any) => {
      console.error("Ошибка распознавания речи:", event.error)

      let userFriendlyMessage = "Произошла ошибка"

      switch (event.error) {
        case "not-allowed":
          userFriendlyMessage = "Доступ к микрофону запрещен. Разрешите использование микрофона в настройках браузера"
          break
        case "no-speech":
          userFriendlyMessage = "Речь не обнаружена. Попробуйте еще раз"
          break
        case "audio-capture":
          userFriendlyMessage = "Микрофон недоступен. Проверьте подключение"
          break
        case "network":
          userFriendlyMessage = "Ошибка сети. Проверьте интернет-соединение"
          break
        case "aborted":
          userFriendlyMessage = "Распознавание прервано"
          break
        default:
          userFriendlyMessage = `Ошибка: ${event.error}`
      }

      setErrorMessage(userFriendlyMessage)
      stopListening(recognitionInstance)
    }

    recognitionInstance.onend = () => {
      setIsListening(false)
      setIsInitializing(false)
    }

    return recognitionInstance
  }, [language, onTextReceived, checkVoiceSupport])

  // Остановка распознавания
  const stopListening = (recognitionInstance: any) => {
    if (recognitionInstance) {
      recognitionInstance.stop()
    }
    setIsListening(false)
  }

  // Переключение состояния распознавания
  const toggleListening = () => {
    if (isDisabled || isHttpsRequired) return

    if (isListening && recognition) {
      stopListening(recognition)
    } else {
      const recognitionInstance = recognition || initRecognition()
      if (recognitionInstance) {
        setRecognition(recognitionInstance)
        try {
          recognitionInstance.start()
        } catch (error) {
          console.error("Ошибка запуска распознавания:", error)
          setErrorMessage("Не удалось запустить распознавание речи")
        }
      }
    }
  }

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.abort()
      }
    }
  }, [recognition])

  // Проверяем поддержку при монтировании
  useEffect(() => {
    checkVoiceSupport()
  }, [checkVoiceSupport])

  if (isHttpsRequired) {
    return (
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={true}
          className="rounded-full opacity-50"
          title="Требуется HTTPS для работы микрофона"
        >
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </Button>

        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-64 z-10">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-xs text-orange-800">
              Микрофон работает только по HTTPS. Используйте localhost или настройте HTTPS.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          onClick={toggleListening}
          disabled={isDisabled || isInitializing}
          className={`rounded-full ${isListening ? "bg-red-500 hover:bg-red-600" : ""}`}
          title={isListening ? "Остановить запись" : "Голосовой ввод"}
        >
          {isInitializing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </motion.div>

      {/* Индикатор активности */}
      {isListening && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
        />
      )}

      {/* Визуализация звуковых волн */}
      {isListening && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-red-500"
              animate={{
                height: [3, 12, 5, 15, 3],
              }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}

      {/* Сообщение об ошибке */}
      {errorMessage && !isHttpsRequired && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap max-w-xs">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-xs text-red-800">{errorMessage}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
