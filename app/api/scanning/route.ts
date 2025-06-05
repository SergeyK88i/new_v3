export async function POST(req: Request) {
    try {
      const { sourceId } = await req.json()
  
      console.log("Scanning API вызван для sourceId:", sourceId)
  
      // Моковые данные для тестирования
      const mockData = {
        source1: {
          has_required_fields: false,
          missing_fields: [
            {
              id: "company_size",
              name: "Размер компании",
              type: "select",
              required: true,
              comment: "Укажите количество сотрудников в вашей организации",
              options: ["1-10", "11-50", "51-200", "201-500", "500+"],
            },
            {
              id: "annual_revenue",
              name: "Годовая выручка",
              type: "number",
              required: true,
              comment: "Укажите годовую выручку компании в миллионах рублей",
            },
            {
              id: "industry_sector",
              name: "Отрасль деятельности",
              type: "text",
              required: true,
              comment: "Основная сфера деятельности вашей компании",
            },
            {
              id: "environmental_policy",
              name: "Экологическая политика",
              type: "textarea",
              required: true,
              comment: "Опишите экологическую политику вашей компании (если есть)",
            },
            {
              id: "energy_consumption",
              name: "Потребление энергии",
              type: "number",
              required: true,
              comment: "Годовое потребление электроэнергии в кВт⋅ч",
            },
          ],
          message: "Обнаружены незаполненные обязательные поля",
        },
        source2: {
          has_required_fields: false,
          missing_fields: [
            {
              id: "waste_management",
              name: "Управление отходами",
              type: "select",
              required: true,
              comment: "Как организовано управление отходами в компании",
              options: ["Переработка", "Утилизация", "Смешанный подход", "Не организовано"],
            },
            {
              id: "carbon_footprint",
              name: "Углеродный след",
              type: "number",
              required: true,
              comment: "Оценочный углеродный след компании в тоннах CO2 в год",
            },
            {
              id: "social_programs",
              name: "Социальные программы",
              type: "textarea",
              required: true,
              comment: "Опишите социальные программы для сотрудников",
            },
          ],
          message: "Требуется дополнительная информация",
        },
        source3: {
          has_required_fields: false, // Изменено на false для тестирования
          missing_fields: [
            {
              id: "test_field",
              name: "Тестовое поле",
              type: "text",
              required: true,
              comment: "Это тестовое поле для демонстрации",
            },
          ],
          message: "Тестовые незаполненные поля",
        },
      }
  
      // Всегда используем моковые данные для тестирования
      const data = mockData[sourceId as keyof typeof mockData] || {
        has_required_fields: false,
        missing_fields: [
          {
            id: "default_test_field",
            name: "Тестовое поле по умолчанию",
            type: "text",
            required: true,
            comment: "Это поле появляется для любого источника",
          },
          {
            id: "another_test_field",
            name: "Еще одно тестовое поле",
            type: "select",
            required: true,
            comment: "Выберите один из вариантов",
            options: ["Вариант 1", "Вариант 2", "Вариант 3"],
          },
        ],
        message: "Тестовые данные для неизвестного источника",
      }
  
      console.log("Возвращаем данные:", {
        hasRequiredFields: data.has_required_fields,
        missingFields: data.missing_fields,
        message: data.message,
      })
  
      return Response.json({
        hasRequiredFields: data.has_required_fields,
        missingFields: data.missing_fields,
        message: data.message,
      })
    } catch (error) {
      console.error("Scanning API error:", error)
  
      // Fallback к тестовым данным при ошибке
      return Response.json({
        hasRequiredFields: false,
        missingFields: [
          {
            id: "error_test_field",
            name: "Поле при ошибке",
            type: "text",
            required: true,
            comment: "Это поле появляется при ошибке API",
          },
        ],
        message: "Тестовые данные (произошла ошибка)",
      })
    }
  }
  