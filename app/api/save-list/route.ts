export async function POST(req: Request) {
    try {
      const { sourceId, fields } = await req.json()
  
      console.log("Сохранение данных:", { sourceId, fields })
  
      // Если нет бекенда, имитируем успешное сохранение
      if (!process.env.BACKEND_URL) {
        // Имитируем задержку сети
        await new Promise((resolve) => setTimeout(resolve, 1500))
  
        return Response.json({
          success: true,
          message: "Данные успешно сохранены (тестовый режим)",
          saved_fields: Object.keys(fields).length,
        })
      }
  
      // Реальный запрос к бекенду (когда будет готов)
      const response = await fetch(`${process.env.BACKEND_URL}/save_list/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_id: sourceId,
          fields: fields,
        }),
      })
  
      if (!response.ok) {
        throw new Error("Backend save request failed")
      }
  
      const data = await response.json()
  
      return Response.json({
        success: data.success || true,
        message: data.message || "Данные успешно сохранены",
      })
    } catch (error) {
      console.error("Save list API error:", error)
  
      // Fallback при ошибке
      return Response.json(
        {
          success: false,
          message: "Ошибка при сохранении данных (проверьте консоль)",
        },
        { status: 500 },
      )
    }
  }
  