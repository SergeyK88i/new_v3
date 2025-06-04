"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MessageSquare, Mic, Video } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RealTimeAvatar } from "@/components/realtime-avatar"
import { TextChatInterface } from "@/components/text-chat-interface"
import { VoiceChatInterface } from "@/components/voice-chat-interface"

interface IntegratedChatProps {
  mode: "text" | "voice" | "video"
  onModeChange: (mode: "text" | "voice" | "video") => void
  selectedSource?: {
    id: string
    name: string
    index: number
  }
}

// Разделенные истории для каждого режима
interface ChatHistory {
  text: any[]
  voice: any[]
  video: any[]
}

export function IntegratedChat({ mode, onModeChange, selectedSource }: IntegratedChatProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Разделенные истории чатов
  const [chatHistory, setChatHistory] = useState<ChatHistory>({
    text: [
      {
        id: "welcome-text",
        role: "assistant",
        content: selectedSource
          ? `Здравствуйте! Я проанализировала данные "${selectedSource.name}". Текущий индекс ИЗИ составляет ${selectedSource.index}/100. Чем могу помочь?`
          : "Здравствуйте! Я AI Agent ИЗИкс. Готова помочь с расчетом Индекса зрелости источника и предоставить рекомендации по его улучшению.",
      },
    ],
    voice: [
      {
        id: "welcome-voice",
        role: "assistant",
        content: selectedSource
          ? `Привет! Я Анна, ваш ESG-консультант. Проанализировала ${selectedSource.name} - индекс ${selectedSource.index} из 100. О чем поговорим?`
          : "Привет! Я Анна, ваш голосовой ESG-консультант. Готова обсудить зеленые инициативы. О чем поговорим?",
      },
    ],
    video: [
      {
        id: "welcome-video",
        role: "assistant",
        content: selectedSource
          ? `Добро пожаловать на видео-консультацию! Я Анна Петрова, ваш ESG-эксперт. Данные по ${selectedSource.name} уже загружены. Давайте обсудим ваши вопросы лично.`
          : "Добро пожаловать на персональную видео-консультацию! Я Анна Петрова, готова помочь с ESG-стратегией вашей компании.",
      },
    ],
  })

  // Разделенные состояния для каждого режима
  const [textInput, setTextInput] = useState("")
  const [isTextLoading, setIsTextLoading] = useState(false)
  const [isVoiceLoading, setIsVoiceLoading] = useState(false)
  const [isVideoLoading, setIsVideoLoading] = useState(false)

  const [hasSpokenWelcome, setHasSpokenWelcome] = useState<{ [key: string]: boolean }>({
    text: false,
    voice: false,
    video: false,
  })

  // Получаем сообщения для текущего режима
  const currentMessages = chatHistory[mode]

  // Приветствие только при первом входе в режим
  useEffect(() => {
    if (!hasSpokenWelcome[mode] && currentMessages.length > 0) {
      setHasSpokenWelcome((prev) => ({ ...prev, [mode]: true }))
    }
  }, [mode, hasSpokenWelcome, currentMessages.length])

  // Обработчик для текстового чата
  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value)
  }

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim() || isTextLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textInput.trim(),
    }

    // Добавляем сообщение в историю ТЕКСТОВОГО чата
    setChatHistory((prev) => ({
      ...prev,
      text: [...prev.text, userMessage],
    }))

    setTextInput("")
    setIsTextLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatHistory.text, userMessage],
          mode: "text",
        }),
      })

      const data = await response.json()

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
      }

      // Добавляем ответ в историю ТЕКСТОВОГО чата
      setChatHistory((prev) => ({
        ...prev,
        text: [...prev.text, assistantMessage],
      }))
    } catch (error) {
      console.error("Text chat error:", error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Извините, произошла ошибка. Попробуйте еще раз.",
      }
      setChatHistory((prev) => ({
        ...prev,
        text: [...prev.text, errorMessage],
      }))
    } finally {
      setIsTextLoading(false)
    }
  }

  // Обработчик для голосового чата
  const handleVoiceMessage = async (voiceText: string) => {
    if (!voiceText.trim() || isVoiceLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: voiceText.trim(),
    }

    // Добавляем сообщение в историю ГОЛОСОВОГО чата
    setChatHistory((prev) => ({
      ...prev,
      voice: [...prev.voice, userMessage],
    }))

    setIsVoiceLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatHistory.voice, userMessage],
          mode: "voice",
        }),
      })

      const data = await response.json()

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
      }

      // Добавляем ответ в историю ГОЛОСОВОГО чата
      setChatHistory((prev) => ({
        ...prev,
        voice: [...prev.voice, assistantMessage],
      }))
    } catch (error) {
      console.error("Voice chat error:", error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Извините, произошла ошибка. Попробуйте еще раз.",
      }
      setChatHistory((prev) => ({
        ...prev,
        voice: [...prev.voice, errorMessage],
      }))
    } finally {
      setIsVoiceLoading(false)
    }
  }

  // Обработчик для видео чата
  const handleVideoMessage = async (videoText: string) => {
    if (!videoText.trim() || isVideoLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: videoText.trim(),
    }

    // Добавляем сообщение в историю ВИДЕО чата
    setChatHistory((prev) => ({
      ...prev,
      video: [...prev.video, userMessage],
    }))

    setIsVideoLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatHistory.video, userMessage],
          mode: "video",
        }),
      })

      const data = await response.json()

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
      }

      // Добавляем ответ в историю ВИДЕО чата
      setChatHistory((prev) => ({
        ...prev,
        video: [...prev.video, assistantMessage],
      }))
    } catch (error) {
      console.error("Video chat error:", error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Извините, произошла ошибка. Попробуйте еще раз.",
      }
      setChatHistory((prev) => ({
        ...prev,
        video: [...prev.video, errorMessage],
      }))
    } finally {
      setIsVideoLoading(false)
    }
  }

  const modeConfig = {
    text: {
      title: "Текстовый чат",
      icon: MessageSquare,
      color: "from-blue-500 to-blue-600",
      description: "Детальный анализ и рекомендации",
    },
    voice: {
      title: "Голосовой чат",
      icon: Mic,
      color: "from-green-500 to-green-600",
      description: "Быстрые консультации голосом",
    },
    video: {
      title: "Видео-звонок",
      icon: Video,
      color: "from-purple-500 to-purple-600",
      description: "Персональная консультация",
    },
  }

  const currentMode = modeConfig[mode]

  if (mode === "video") {
    // Полноэкранный видео режим
    return (
      <div className="col-span-2 h-full">
        <Card className="h-full shadow-lg border-0 bg-white">
          <CardHeader className={`p-4 bg-gradient-to-r ${currentMode.color} text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <currentMode.icon className="h-5 w-5" />
                <div>
                  <CardTitle className="text-lg">{currentMode.title}</CardTitle>
                  <p className="text-sm opacity-90">{currentMode.description}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Видео
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-80px)]">
            <RealTimeAvatar
              text={
                hasSpokenWelcome.video
                  ? chatHistory.video[chatHistory.video.length - 1]?.content || ""
                  : chatHistory.video[0]?.content || ""
              }
              isActive={true}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
              onSpeakingStart={() => setIsSpeaking(true)}
              onSpeakingEnd={() => setIsSpeaking(false)}
              onUserSpeechStart={() => setIsListening(true)}
              onUserSpeechEnd={(text) => {
                handleVideoMessage(text)
                setIsListening(false)
              }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Текстовый и голосовой режимы
  return (
    <div className="col-span-2 h-full">
      <Card className="h-full shadow-lg border-0 bg-white">
        <CardHeader className={`p-4 bg-gradient-to-r ${currentMode.color} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <currentMode.icon className="h-5 w-5" />
              <div>
                <CardTitle className="text-lg">{currentMode.title}</CardTitle>
                <p className="text-sm opacity-90">{currentMode.description}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {mode === "text" ? "Текст" : "Голос"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 h-[calc(100%-80px)]">
          <div className="h-full flex flex-col">
            {mode === "text" ? (
              <TextChatInterface
                messages={chatHistory.text}
                input={textInput}
                handleInputChange={handleTextInputChange}
                handleSubmit={handleTextSubmit}
                isLoading={isTextLoading}
                setInput={setTextInput}
              />
            ) : (
              <VoiceChatInterface
                messages={chatHistory.voice}
                isListening={isListening}
                isSpeaking={isSpeaking}
                isMuted={isMuted}
                onStartListening={() => setIsListening(true)}
                onStopListening={() => setIsListening(false)}
                onToggleMute={() => setIsMuted(!isMuted)}
                onSendMessage={handleVoiceMessage}
                hasSpokenWelcome={hasSpokenWelcome.voice}
                onWelcomeSpoken={() => setHasSpokenWelcome((prev) => ({ ...prev, voice: true }))}
                isLoading={isVoiceLoading}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
