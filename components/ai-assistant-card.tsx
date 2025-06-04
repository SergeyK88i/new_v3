"use client"
import { useState, useEffect, useRef } from "react"
import { MessageSquare, Video, Phone, X, Play, HelpCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

interface AIAssistantCardProps {
  onOpenChat: (mode: "text" | "voice" | "video") => void
  onCloseChat?: () => void
  isChatActive?: boolean
}

export function AIAssistantCard({ onOpenChat, onCloseChat, isChatActive = false }: AIAssistantCardProps) {
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [showTutorialVideo, setShowTutorialVideo] = useState(false)
  const [showHelpAnimation, setShowHelpAnimation] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [showPlayButton, setShowPlayButton] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)

  // Проверяем первое посещение
  useEffect(() => {
    const hasVisited = localStorage.getItem("izi-system-visited")
    if (!hasVisited) {
      setIsFirstVisit(true)
      setShowTutorialVideo(true)
      localStorage.setItem("izi-system-visited", "true")
    }
  }, [])

  // Пытаемся автоматически запустить видео
  useEffect(() => {
    if (showTutorialVideo && videoRef.current && videoLoaded) {
      // Сначала пытаемся запустить со звуком
      const playPromise = videoRef.current.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Автовоспроизведение началось успешно
            console.log("Видео запущено автоматически со звуком")
          })
          .catch((error) => {
            console.log("Ошибка автовоспроизведения со звуком:", error)
            // Если не получилось со звуком, пытаемся без звука
            if (videoRef.current) {
              videoRef.current.muted = true
              videoRef.current
                .play()
                .then(() => {
                  console.log("Видео запущено без звука")
                  setShowPlayButton(true) // Показываем кнопку для включения звука
                })
                .catch(() => {
                  setShowPlayButton(true)
                })
            }
          })
      }
    }
  }, [showTutorialVideo, videoLoaded])

  const handleVideoLoaded = () => {
    setVideoLoaded(true)
  }

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.muted = false // Включаем звук при ручном запуске
      videoRef.current
        .play()
        .then(() => {
          setShowPlayButton(false)
        })
        .catch((error) => {
          console.log("Ошибка при ручном запуске видео:", error)
        })
    }
  }

  const handleVideoEnd = () => {
    setVideoEnded(true)
    setTimeout(() => {
      setShowTutorialVideo(false)
    }, 2000) // Показываем галочку 2 секунды
  }

  const handleVideoError = () => {
    setVideoError(true)
    console.log("Видео не найдено или не может быть воспроизведено")
  }

  const handleSkipVideo = () => {
    setShowTutorialVideo(false)
  }

  const handleShowHelp = () => {
    setShowHelpAnimation(true)
  }

  const handleCloseHelp = () => {
    setShowHelpAnimation(false)
  }

  // Имитация диалога с аватаром
  const welcomeMessages = [
    "Добро пожаловать в систему ИЗИ!",
    "Я - Анна, ваш цифровой помощник.",
    "Я помогу вам разобраться с Индексом Зеленых Инициатив.",
    "Вы можете общаться со мной текстом, голосом или видео.",
    "Давайте начнем работу!",
  ]

  // Компонент анимации приветствия
  const WelcomeAnimation = ({ onClose }: { onClose: () => void }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4"
    >
      {/* Кнопка закрытия */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full text-sm hover:bg-black/70 transition-colors"
      >
        <X className="h-4 w-4" />
      </motion.button>

      {/* Контент анимации */}
      <div className="w-full max-w-md">
        {/* Аватар с правильным позиционированием */}
        <div className="relative mb-8 flex-shrink-0">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/30 mx-auto">
            <img src="/anna-avatar.jpg" alt="AI Agent ИЗИкс" className="w-full h-full object-cover" />
          </div>
          <motion.div
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-full h-1"
            animate={{
              boxShadow: [
                "0 0 10px 5px rgba(59, 130, 246, 0.5)",
                "0 0 20px 10px rgba(59, 130, 246, 0.7)",
                "0 0 10px 5px rgba(59, 130, 246, 0.5)",
              ],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>

        {/* Анимированные сообщения с адаптивным размером текста */}
        <div className="space-y-4">
          {welcomeMessages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 1.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white"
            >
              <p
                className="text-center leading-relaxed"
                style={{
                  fontSize: message.length > 50 ? "0.875rem" : message.length > 30 ? "0.9375rem" : "1rem",
                  lineHeight: "1.5",
                }}
              >
                {message}
              </p>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: welcomeMessages.length * 1.5 }}
            className="pt-2"
          >
            <Button onClick={onClose} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
              Я готов начать работу
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <Card className="h-full shadow-lg border-0 bg-white relative overflow-hidden">
      {/* Обучающее видео при первом входе */}
      <AnimatePresence>
        {showTutorialVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center"
          >
            <div className="relative w-full h-full">
              {/* Скрытое видео (без UI элементов) */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                onLoadedData={handleVideoLoaded}
                onEnded={handleVideoEnd}
                onError={handleVideoError}
                controlsList="nodownload nofullscreen noremoteplaybook"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                style={{ opacity: videoError ? 0 : 1 }}
              >
                <source src="/tutorial-video.mp4" type="video/mp4" />
              </video>

              {/* Кнопка ручного запуска, если автозапуск не сработал */}
              {showPlayButton && !videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <Button
                    onClick={handleManualPlay}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center"
                  >
                    <Play className="h-8 w-8" />
                  </Button>
                </div>
              )}

              {/* Fallback с эффектом общения с аватаром */}
              {videoError && <WelcomeAnimation onClose={handleVideoEnd} />}

              {/* Кнопка пропуска */}
              {!videoEnded && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3 }}
                  onClick={handleSkipVideo}
                  className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm hover:bg-black/70 transition-colors"
                >
                  Пропустить
                </motion.button>
              )}

              {/* Индикатор завершения */}
              {videoEnded && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-black/80 flex items-center justify-center"
                >
                  <div className="text-center text-white">
                    <div className="w-16 h-16 border-4 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-green-500 text-2xl"
                      >
                        ✓
                      </motion.div>
                    </div>
                    <p className="text-lg font-semibold">Обучение завершено!</p>
                    <p className="text-sm opacity-80">Теперь вы готовы к работе с системой ИЗИ</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Анимация помощи */}
      <AnimatePresence>{showHelpAnimation && <WelcomeAnimation onClose={handleCloseHelp} />}</AnimatePresence>

      {/* Основной контент карточки */}
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-900">Анна ИИ-помощник</h3>

          {/* Кнопка помощи */}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowHelp}
              className="ml-1 p-1 h-6 w-6 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
              title="Показать приветствие"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </motion.div>

          {isChatActive && onCloseChat && (
            <Button variant="ghost" size="sm" onClick={onCloseChat} className="ml-auto">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Аватар */}
        <div className="relative mx-auto mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-blue-100 mx-auto">
            <img src="/anna-avatar.jpg" alt="AI Agent ИЗИкс" className="w-full h-full object-cover" />
          </div>
          {isFirstVisit && !showTutorialVideo && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-xs">✓</span>
            </motion.div>
          )}
        </div>

        <div className="space-y-1">
          <h4 className="font-semibold text-gray-900">AI Agent ИЗИкс</h4>
          <Badge variant="outline" className="border-gray-200 text-gray-700">
            Эксперт
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Специализация */}
        <div className="text-center mb-6">
          <h5 className="font-medium text-gray-900 mb-2">Специализация</h5>
          <p className="text-xs text-gray-600 leading-relaxed">
            Расчет Индекса зрелости источника и предоставление рекомендаций по его улучшению.
          </p>
        </div>

        {!isChatActive ? (
          <>
            {/* Основная кнопка чата */}
            <div className="mb-4">
              <Button
                onClick={() => onOpenChat("text")}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                disabled={showTutorialVideo}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Открыть чат
              </Button>
            </div>

            {/* Дополнительные режимы */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-3 text-center">Дополнительные режимы общения</p>
              <div className="space-y-2">
                <Button
                  onClick={() => onOpenChat("voice")}
                  variant="outline"
                  className="w-full justify-start gap-3 h-10 border-gray-200 hover:bg-gray-50"
                  disabled={showTutorialVideo}
                >
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">Голосовая консультация</span>
                </Button>

                <Button
                  onClick={() => onOpenChat("video")}
                  variant="outline"
                  className="w-full justify-start gap-3 h-10 border-gray-200 hover:bg-gray-50"
                  disabled={showTutorialVideo}
                >
                  <Video className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">Видео-звонок</span>
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Режимы переключения в активном чате
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3 text-center">Режимы общения</p>
            <div className="space-y-2">
              <Button
                onClick={() => onOpenChat("text")}
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-start gap-2 h-auto py-2 hover:bg-blue-50"
              >
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-700">Текстовый чат</span>
              </Button>

              <Button
                onClick={() => onOpenChat("voice")}
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-start gap-2 h-auto py-2 hover:bg-green-50"
              >
                <Phone className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-700">Голосовой чат</span>
              </Button>

              <Button
                onClick={() => onOpenChat("video")}
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-start gap-2 h-auto py-2 hover:bg-purple-50"
              >
                <Video className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-700">Видео-звонок</span>
              </Button>
            </div>
          </div>
        )}

        {/* Показываем статус обучения */}
        {isFirstVisit && !showTutorialVideo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200"
          >
            <p className="text-xs text-green-700 text-center">
              ✓ Обучение завершено! Теперь вы готовы к работе с системой ИЗИ
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
