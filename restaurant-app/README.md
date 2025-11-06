# Syra Restaurant - AI-Powered Ordering

A modern React restaurant ordering application with AI chatbot integration.

## Features

- 🤖 **AI-Powered Ordering**: Chat with Syra AI to place orders
- 🛒 **Smart Cart Management**: Automatic meal deal bundling
- 💳 **Stripe Integration**: Secure payment processing
- 🌙 **Dark/Light Theme**: Professional theme system
- 📱 **Responsive Design**: Works on all devices
- ⚡ **Fast Performance**: Optimized with Vite

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file:

```env
VITE_OPENAI_API_KEY=your_openai_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom CSS
- **AI**: OpenAI GPT-4o-mini
- **Backend**: Supabase Edge Functions
- **Payments**: Stripe
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
├── App.tsx        # Main application component
├── main.tsx       # Application entry point
├── menuData.ts    # Restaurant menu configuration
├── openaiService.ts # AI service integration
└── supabaseClient.ts # Supabase client setup
```

## License

MIT