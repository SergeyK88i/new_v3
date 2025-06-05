"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface SurveyMessageProps {
  missingFieldsCount: number
  missingFieldNames: string[]
  sourceName: string
  onAccept: () => void
  onDecline: () => void
}

export function SurveyMessage({
  missingFieldsCount,
  missingFieldNames,
  sourceName,
  onAccept,
  onDecline,
}: SurveyMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-lg">
        <CardContent className="p-6">
          {/* Заголовок */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Обнаружены незаполненные поля</h3>
              <p className="text-sm text-gray-600">
                Для источника "{sourceName}" не заполнено {missingFieldsCount} обязательных полей
              </p>
            </div>

            {/* Кнопка закрытия */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDecline}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title="Закрыть уведомление"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Детали с названиями полей */}
          <motion.div initial={false} animate={{ height: isExpanded ? "auto" : 0 }} className="overflow-hidden">
            <div className="bg-white/60 rounded-lg p-4 mb-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">Незаполненные поля:</span>
              </div>

              <ul className="text-sm text-gray-600 space-y-1">
                {missingFieldNames.map((fieldName, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>{fieldName}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Кнопка развернуть/свернуть */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mb-4 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
          >
            <span className="text-sm">{isExpanded ? "Скрыть детали" : "Показать детали"}</span>
            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="h-4 w-4 ml-1" />
            </motion.div>
          </Button>

          {/* Кнопки действий */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onDecline}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Пропустить
            </Button>

            <Button
              onClick={onAccept}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
            >
              Заполнить
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
