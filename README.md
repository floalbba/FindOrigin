# FindOrigin

Telegram-бот для поиска источников информации. Поддерживает текстовый режим и Mini App (TMA).

## Возможности

- **Чат с ботом** — отправьте текст, получите 1–3 возможных источника с оценкой уверенности
- **Mini App** — веб-интерфейс с полем ввода и отображением результатов

## Mini App (TMA)

### Запуск

1. Задеплойте приложение на Vercel
2. Установите кнопку меню бота:

```powershell
.\scripts\set-menu-button.ps1 -BotToken "YOUR_BOT_TOKEN" -AppUrl "https://your-app.vercel.app/tma"
```

3. Пользователи увидят кнопку «Открыть FindOrigin» рядом с полем ввода при общении с ботом

### URL

- Mini App: `https://your-domain.vercel.app/tma`
- API поиска: `POST /api/find-sources` (body: `{ "text": "..." }`)
