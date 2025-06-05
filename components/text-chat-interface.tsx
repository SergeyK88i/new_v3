"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Lightbulb, TrendingUp, HelpCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VoiceInput } from "@/components/voice-input"
import { SurveyMessage } from "@/components/survey-message"
import { SurveyForm } from "@/components/survey-form"

interface TextChatInterfaceProps {
  messages: any[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  setInput: (text: string) => void
  selectedSource?: any
  onAddMessage: (message: any) => void
}

export function TextChatInterface({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  setInput,
  selectedSource,
  onAddMessage,
}: TextChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showSurvey, setShowSurvey] = useState(false)
  const [surveyData, setSurveyData] = useState<any>(null)
  const [isSurveyLoading, setIsSurveyLoading] = useState(false)
  const [hasCheckedFields, setHasCheckedFields] = useState(false)
  const [surveyCompleted, setSurveyCompleted] = useState(false)
  const [showQuickQuestionsManual, setShowQuickQuestionsManual] = useState(false) // Новое состояние
  const [hiddenSurveyMessages, setHiddenSurveyMessages] = useState<Set<string>>(new Set()) // Скрытые уведомления

  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, showSurvey])

  // Проверяем обязательные поля после приветственного сообщения
  useEffect(() => {
    const checkRequiredFields = async () => {
      console.log("checkRequiredFields вызван:", {
        selectedSource: selectedSource?.id,
        hasCheckedFields,
        messagesLength: messages.length,
        surveyCompleted,
      })

      if (!selectedSource || hasCheckedFields || messages.length < 1 || surveyCompleted) {
        console.log("Пропускаем проверку полей")
        return
      }

      try {
        console.log("Отправляем запрос на проверку полей для источника:", selectedSource.id)

        const response = await fetch("/api/scanning", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceId: selectedSource.id }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("Получен ответ от API:", data)

        if (!data.hasRequiredFields && data.missingFields?.length > 0) {
          console.log("Найдены незаполненные поля, добавляем сообщение")

          // Добавляем сообщение о незаполненных полях
          const surveyMessage = {
            id: `survey-${Date.now()}`,
            role: "assistant",
            type: "survey-prompt",
            content: "survey-prompt",
            missingFields: data.missingFields,
            missingFieldsCount: data.missingFields.length,
            missingFieldNames: data.missingFields.map((field: any) => field.name),
          }

          console.log("Добавляем сообщение о незаполненных полях:", surveyMessage)
          onAddMessage(surveyMessage)
        } else {
          console.log("Все поля заполнены или нет незаполненных полей")
        }

        setHasCheckedFields(true)
      } catch (error) {
        console.error("Ошибка при проверке обязательных полей:", error)

        // Добавляем тестовое сообщение при ошибке
        const testSurveyMessage = {
          id: `survey-error-${Date.now()}`,
          role: "assistant",
          type: "survey-prompt",
          content: "survey-prompt",
          missingFields: [
            {
              id: "test_error_field",
              name: "Тестовое поле (ошибка)",
              type: "text",
              required: true,
              comment: "Это поле появилось из-за ошибки API",
            },
          ],
          missingFieldsCount: 1,
          missingFieldNames: ["Тестовое поле (ошибка)"],
        }

        console.log("Добавляем тестовое сообщение из-за ошибки")
        onAddMessage(testSurveyMessage)
        setHasCheckedFields(true)
      }
    }

    // Увеличиваем задержку для лучшей видимости
    const timer = setTimeout(checkRequiredFields, 3000)
    return () => clearTimeout(timer)
  }, [selectedSource, messages.length, hasCheckedFields, onAddMessage, surveyCompleted])

  const handleVoiceText = (text: string) => {
    setInput(text)
  }

  const handleSurveyAccept = () => {
    console.log("Пользователь принял заполнение опроса")
    setShowSurvey(true)
  }

  const handleSurveyDecline = (messageId: string) => {
    console.log("Пользователь отклонил заполнение опроса, messageId:", messageId)

    // Добавляем ID сообщения в список скрытых
    setHiddenSurveyMessages((prev) => new Set([...prev, messageId]))

    // Добавляем сообщение о том, что пользователь пропустил заполнение
    const declineMessage = {
      id: `decline-${Date.now()}`,
      role: "assistant",
      content: "Понятно! Вы можете заполнить обязательные поля позже для более точного анализа. Чем еще могу помочь?",
    }
    onAddMessage(declineMessage)
  }

  const handleSurveySave = async (formData: { [key: string]: string }) => {
    setIsSurveyLoading(true)

    try {
      console.log("Сохраняем данные опроса:", formData)

      const response = await fetch("/api/save-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: selectedSource?.id,
          fields: formData,
        }),
      })

      const data = await response.json()
      console.log("Результат сохранения:", data)

      if (data.success) {
        setShowSurvey(false)
        setSurveyCompleted(true) // Помечаем что опрос завершен

        // Добавляем сообщение об успешном сохранении
        const successMessage = {
          id: `success-${Date.now()}`,
          role: "assistant",
          content: `Отлично! Данные успешно сохранены (${data.saved_fields || Object.keys(formData).length} полей). Теперь я могу предоставить более точный анализ вашего источника. Чем могу помочь?`,
        }
        onAddMessage(successMessage)
      } else {
        throw new Error(data.message || "Ошибка сохранения")
      }
    } catch (error) {
      console.error("Error saving survey:", error)

      // Добавляем сообщение об ошибке
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Произошла ошибка при сохранении данных. Попробуйте еще раз или обратитесь к администратору.",
      }
      onAddMessage(errorMessage)
    } finally {
      setIsSurveyLoading(false)
    }
  }

  const handleSurveyCancel = () => {
    setShowSurvey(false)

    // Добавляем сообщение об отмене
    const cancelMessage = {
      id: `cancel-${Date.now()}`,
      role: "assistant",
      content: "Заполнение отменено. Вы можете вернуться к этому позже. Чем еще могу помочь?",
    }
    onAddMessage(cancelMessage)
  }

  // Заготовленные вопросы
  const quickQuestions = [
    {
      id: "improve-index",
      text: "Как мне улучшить мой индекс?",
      icon: TrendingUp,
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "recommendations",
      text: "Дай рекомендацию по улучшению критериев",
      icon: Lightbulb,
      color: "from-green-500 to-green-600",
    },
  ]

  const handleQuickQuestion = (questionText: string) => {
    setInput(questionText)
    setShowQuickQuestionsManual(false) // Скрываем после выбора
    const syntheticEvent = {
      preventDefault: () => {},
    } as React.FormEvent

    setTimeout(() => {
      handleSubmit(syntheticEvent)
    }, 100)
  }

  // Показываем популярные вопросы автоматически или по кнопке
  const showQuickQuestions =
    (messages.length <= 1 && !input.trim() && !isLoading && !showSurvey) || showQuickQuestionsManual

  // Если показываем форму опроса
  if (showSurvey && surveyData) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <SurveyForm
          fields={surveyData.missingFields}
          sourceId={selectedSource?.id || ""}
          sourceName={selectedSource?.name || ""}
          onSave={handleSurveySave}
          onCancel={handleSurveyCancel}
          isLoading={isSurveyLoading}
        />
      </div>
    )
  }

  return (
    <>
      {/* Сообщения с фиксированной высотой и скроллом */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          <AnimatePresence>
            {messages
              .filter((message) => {
                // Скрываем сообщения о незаполненных полях если опрос завершен или сообщение скрыто
                if (surveyCompleted && message.type === "survey-prompt") {
                  return false
                }
                if (hiddenSurveyMessages.has(message.id)) {
                  return false
                }
                return true
              })
              .map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.type === "survey-prompt" ? (
                    // Специальное сообщение с предложением заполнить опрос
                    <div className="flex gap-3 max-w-[90%]">
                      <Avatar className="h-8 w-8 border border-gray-200">
                        <AvatarImage src="/anna-avatar.jpg" alt="ESG Consultant" />
                        <AvatarFallback className="bg-blue-100 text-blue-600">АП</AvatarFallback>
                      </Avatar>
                      <SurveyMessage
                        missingFieldsCount={message.missingFieldsCount}
                        missingFieldNames={message.missingFieldNames || []}
                        sourceName={selectedSource?.name || ""}
                        onAccept={() => {
                          setSurveyData(message)
                          handleSurveyAccept()
                        }}
                        onDecline={() => handleSurveyDecline(message.id)}
                      />
                    </div>
                  ) : (
                    // Обычные сообщения
                    <div className="flex gap-3 max-w-[80%]">
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 border border-gray-200">
                          <AvatarImage src="/anna-avatar.jpg" alt="ESG Consultant" />
                          <AvatarFallback className="bg-blue-100 text-blue-600">АП</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`rounded-lg p-4 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                            : "bg-gray-50 border border-gray-200 text-gray-900"
                        }`}
                      >
                        {message.content}
                      </div>
                      {message.role === "user" && (
                        <Avatar className="h-8 w-8 border border-gray-200">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                          <AvatarFallback className="bg-green-100 text-green-600">П</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <Avatar className="h-8 w-8 border border-gray-200">
                  <AvatarImage src="/anna-avatar.jpg" alt="ESG Consultant" />
                  <AvatarFallback className="bg-blue-100 text-blue-600">АП</AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
                  <div className="flex space-x-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-2 w-2 bg-blue-400 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Быстрые вопросы */}
      <AnimatePresence>
        {showQuickQuestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 pb-2"
          >
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-gray-600 mb-3 text-center font-medium">
                💡 Популярные вопросы для начала диалога:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                {quickQuestions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex-1"
                  >
                    <Button
                      onClick={() => handleQuickQuestion(question.text)}
                      variant="outline"
                      className={`w-full h-auto p-3 text-left bg-gradient-to-r ${question.color} text-white border-0 hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md`}
                    >
                      <div className="flex items-center gap-2">
                        <question.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{question.text}</span>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Поле ввода */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex w-full gap-3 items-center">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Напишите ваш вопрос Анне..."
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
              disabled={showSurvey}
            />

            {/* Кнопка вопроса в поле ввода */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickQuestionsManual(!showQuickQuestionsManual)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-blue-500 hover:bg-blue-50"
              title="Показать популярные вопросы"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>

          {input.trim() ? (
            <Button
              type="submit"
              disabled={isLoading || showSurvey}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <VoiceInput onTextReceived={handleVoiceText} isDisabled={isLoading || showSurvey} language="ru-RU" />
          )}
        </form>
      </div>
    </>
  )
}
