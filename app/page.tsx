"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AIAssistantCard } from "@/components/ai-assistant-card"
import { IntegratedChat } from "@/components/integrated-chat"

// Демо данные для примера
const mockDataSources = [
  { id: "source1", name: "ООО Зеленый Мир", index: 78 },
  { id: "source2", name: "АО ЭкоТех", index: 45 },
  { id: "source3", name: "ПАО ГорСтрой", index: 62 },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

export default function Dashboard() {
  const [isChatActive, setIsChatActive] = useState(false)
  const [chatMode, setChatMode] = useState<"text" | "voice" | "video">("text")
  const [selectedSource] = useState(mockDataSources[0]) // Имитируем выбранный источник

  const handleOpenChat = (mode: "text" | "voice" | "video") => {
    setChatMode(mode)
    setIsChatActive(true)
  }

  const handleCloseChat = () => {
    setIsChatActive(false)
  }

  const handleModeChange = (mode: "text" | "voice" | "video") => {
    setChatMode(mode)
  }

  return (
    <motion.div className="min-h-screen bg-gray-50 p-4" variants={containerVariants} initial="hidden" animate="visible">
      {/* Демо интерфейс основного сайта */}
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Система ИЗИ</h1>
          <p className="text-gray-600">Индекс Зеленых Инициатив</p>
        </div>

        {/* Основные блоки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AnimatePresence mode="wait">
            {!isChatActive ? (
              <>
                {/* Источник данных */}
                <motion.div
                  key="source"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white"
                  variants={itemVariants}
                >
                  <h2 className="text-lg font-semibold mb-2">Источник данных</h2>
                  <p className="text-sm opacity-90 mb-4">Выберите источник для анализа</p>
                  <div className="bg-white/20 rounded-lg p-3">
                    <p className="font-medium">{selectedSource.name}</p>
                    <p className="text-xs opacity-75">ID: {selectedSource.id}</p>
                  </div>
                </motion.div>

                {/* ИЗИ Индекс */}
                <motion.div
                  key="index"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg p-6 text-white"
                  variants={itemVariants}
                >
                  <h2 className="text-lg font-semibold mb-2">ИЗИ Индекс</h2>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{selectedSource.index}%</div>
                    <p className="text-sm opacity-90">Прогресс выполнения: 1 из 6 критериев</p>
                  </div>
                </motion.div>
              </>
            ) : (
              /* Интегрированный чат */
              <motion.div
                key="chat"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="col-span-2"
                variants={itemVariants}
              >
                <IntegratedChat mode={chatMode} onModeChange={handleModeChange} selectedSource={selectedSource} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ИИ-Ассистент - всегда на месте */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isChatActive ? 0 : 0.2 }}
            variants={itemVariants}
          >
            <AIAssistantCard onOpenChat={handleOpenChat} onCloseChat={handleCloseChat} isChatActive={isChatActive} />
          </motion.div>
        </div>

        {/* Демо секции критериев и рекомендаций */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-6 shadow-sm"
            variants={itemVariants}
          >
            <h3 className="text-lg font-semibold mb-4">ИЗИ Критерии</h3>
            <p className="text-gray-600 text-sm">Статус выполнения критериев зрелости источника</p>
            {/* Здесь будет список критериев */}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg p-6 text-white"
            variants={itemVariants}
          >
            <h3 className="text-lg font-semibold mb-4">Рекомендации</h3>
            <p className="text-sm opacity-90">Детальный анализ выбранного критерия</p>
            {/* Здесь будут рекомендации */}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
