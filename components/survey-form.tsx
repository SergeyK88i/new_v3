"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Save, X, AlertCircle, CheckCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SurveyField {
  id: string
  name: string
  type: "text" | "number" | "textarea" | "select"
  required: boolean
  comment?: string
  options?: string[]
}

interface SurveyFormProps {
  fields: SurveyField[]
  sourceId: string
  sourceName: string
  onSave: (data: { [key: string]: string }) => void
  onCancel: () => void
  isLoading?: boolean
}

export function SurveyForm({ fields, sourceId, sourceName, onSave, onCancel, isLoading = false }: SurveyFormProps) {
  const [formData, setFormData] = useState<{ [key: string]: string }>({})
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))

    // Убираем ошибку при заполнении поля
    if (errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    fields.forEach((field) => {
      if (field.required && (!formData[field.id] || formData[field.id].trim() === "")) {
        newErrors[field.id] = "Это поле обязательно для заполнения"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData)
    }
  }

  const getFieldInput = (field: SurveyField) => {
    const value = formData[field.id] || ""
    const hasError = !!errors[field.id]

    switch (field.type) {
      case "textarea":
        

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={`w-full p-2 border rounded-md ${hasError ? "border-red-300" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Выберите значение</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Введите ${field.name.toLowerCase()}`}
            className={hasError ? "border-red-300 focus:border-red-500" : ""}
          />
        )

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={`Введите ${field.name.toLowerCase()}`}
            className={hasError ? "border-red-300 focus:border-red-500" : ""}
          />
        )
    }
  }

  const filledFields = Object.keys(formData).filter((key) => formData[key]?.trim()).length
  const totalFields = fields.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <div>
                <CardTitle className="text-xl">Заполнение обязательных полей</CardTitle>
                <p className="text-sm opacity-90">Источник: {sourceName}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {filledFields}/{totalFields}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                {/* Всегда вертикальное расположение */}
                <div className="space-y-3">
                  {/* Название поля */}
                  <div>
                    <h3 className="font-medium text-gray-900 text-lg">{field.name}</h3>
                    {field.comment && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{field.comment}</p>}
                  </div>

                  {/* Поле ввода */}
                  <div className="space-y-2">
                    {getFieldInput(field)}

                    {/* Ошибка валидации */}
                    <AnimatePresence>
                      {errors[field.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-2 text-red-600 text-sm"
                        >
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors[field.id]}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Индикатор заполнения */}
                    {formData[field.id]?.trim() && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 text-green-600 text-sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Поле заполнено</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Кнопки действий */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onCancel} disabled={isLoading} className="px-6">
              <X className="h-4 w-4 mr-2" />
              Отмена
            </Button>

            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Сохранение..." : "Сохранить и выйти"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
