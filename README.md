# Claudia Agente 3.0 🤖

Bot de Telegram con IA para Tiempo Propiedades - Villarrica

## Estructura
```
/
├── api/
│   ├── index.ts      # Handler principal
│   ├── config.ts    # System Prompt
│   ├── firebase.ts # Firebase SDK
│   └── ai.ts      # OpenRouter
├── vercel.json
└── package.json
```

## Stack
- Grammy (Telegram Bot)
- OpenRouter (google/gemini-2.0-flash-lite)
- Firebase Admin SDK
- Vercel (Serverless)

## Deploy
1. Importar en Vercel
2. Configurar Environment Variables
3. Configurar Webhook en Telegram

## Environment Variables
- TELEGRAM_BOT_TOKEN
- OPENROUTER_API_KEY
- FIREBASE_SERVICE_ACCOUNT

## Webhook URL
```
https://tu-proyecto.vercel.app/api/index
```