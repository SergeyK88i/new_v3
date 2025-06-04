export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Получаем последнее сообщение пользователя
    const lastMessage = messages[messages.length - 1]?.content || ""

    // Отправляем запрос на ваш бекенд
    const response = await fetch(`${process.env.BACKEND_URL}/ask/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Добавьте нужные заголовки авторизации если нужно
      },
      body: JSON.stringify({
        message: lastMessage,
        // Добавьте другие нужные параметры
      }),
    })

    if (!response.ok) {
      throw new Error("Backend request failed")
    }

    const data = await response.json()

    // Возвращаем ответ в формате, ожидаемом фронтендом
    return Response.json({
      content: data.response || data.message || "Извините, произошла ошибка",
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json({ content: "Извините, сервис временно недоступен" }, { status: 500 })
  }
}
