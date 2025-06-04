"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Lightbulb, TrendingUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VoiceInput } from "@/components/voice-input"

interface TextChatInterfaceProps {
  messages: any[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  setInput: (text: string) => void
}

export function TextChatInterface({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  setInput,
}: TextChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleVoiceText = (text: string) => {
    setInput(text)
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
    // Автоматически отправляем вопрос
    const syntheticEvent = {
      preventDefault: () => {},
    } as React.FormEvent

    // Устанавливаем текст и отправляем через небольшую задержку
    setTimeout(() => {
      handleSubmit(syntheticEvent)
    }, 100)
  }

  const showQuickQuestions = messages.length <= 1 && !input.trim() && !isLoading

  return (
    <>
      {/* Сообщения с фиксированной высотой и скроллом */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
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
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Условная кнопка: отправка или голос */}
          {input.trim() ? (
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <VoiceInput onTextReceived={handleVoiceText} isDisabled={isLoading} language="ru-RU" />
          )}
        </form>
      </div>
    </>
  )
}
