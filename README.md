
# 🍽️ Syra: AI-Powered Restaurant Ordering System

**Syra** is a production-ready, AI-powered restaurant ordering application that delivers a modern, conversational, and visually stunning user experience. It combines a sleek React frontend with a robust Supabase backend, leveraging OpenAI for intelligent food ordering and Stripe for seamless payments.

**Live Demo:** [https://978ckuukskur.space.minimax.io](https://978ckuukskur.space.minimax.io)

![Syra UI Showcase](browser/screenshots/final_ui_state.png)

## ✨ Key Features

- **🤖 AI Conversational Ordering**: An intelligent chatbot powered by OpenAI's GPT-4 that assists users in exploring the menu, creating orders, and handling customizations through natural language.
- **Modern UI/UX**: A beautiful, mobile-first interface built with React and Tailwind CSS, featuring glass-morphism, professional gradients, and smooth animations powered by Framer Motion.
- **🛒 Real-Time Cart Management**: A persistent shopping cart with real-time updates, supporting single items, complex meal deals, and customizations.
- **💳 Secure Stripe Payments**: Seamless and secure checkout experience integrated via Supabase Edge Functions and Stripe.
- **🍱 Dynamic Menu Display**: A real-time, categorized menu that is easy to browse and manage.
- ** responsive Design**: Fully responsive and optimized for a seamless experience on desktops, tablets, and mobile devices.
- **🔔 Instant Notifications**: Professional toast notifications for user actions like adding items to the cart, validation errors, and checkout status.
- **🎨 Dual-Theme Mode**: A sleek and modern interface with both light and dark modes.

## 📸 Screenshots & Demos

| AI Chat Interaction | Desktop Menu View |
| :---: | :---: |
| ![AI Chat Interaction](browser/screenshots/ai_chat_interaction.png) | ![Desktop Menu View](browser/screenshots/desktop_menu_view.png) |

| Cart with Item Added | Dark Mode |
| :---: | :---: |
| ![Cart with Item Added](browser/screenshoots/cart_item_added.png) | ![Dark Mode](browser/screenshots/final_dark_mode_state.png) |

## 🛠️ Technical Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast
- **Backend**: Supabase (PostgreSQL Database, Authentication, Storage)
- **Serverless Functions**: Supabase Edge Functions (Deno)
- **AI**: OpenAI API (GPT-4)
- **Payments**: Stripe

## 📋 Prerequisites & Requirements

- Node.js (v18.x or later)
- `pnpm` (or `npm`/`yarn`)
- A Supabase account
- A Stripe account
- An OpenAI API key

## 🚀 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd restaurant-app
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `restaurant-app` directory and add the following:

    ```env
    VITE_SUPABASE_URL="your-supabase-project-url"
    VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
    VITE_OPENAI_API_KEY="your-openai-api-key"
    ```

4.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:5173`.

## ⚙️ Environment Configuration

### Frontend (`.env`)

-   `VITE_SUPABASE_URL`: The URL of your Supabase project.
-   `VITE_SUPABASE_ANON_KEY`: The `anon` key for your Supabase project.
-   `VITE_OPENAI_API_KEY`: Your API key from OpenAI.

### Backend (Supabase Edge Functions)

You need to set the following secrets for the `create-checkout-session` edge function in your Supabase project dashboard:

-   `STRIPE_SECRET_KEY`: Your secret key from Stripe.
-   `SUPABASE_SERVICE_ROLE_KEY`: The `service_role` key for your Supabase project.
-   `SUPABASE_URL`: The URL of your Supabase project.

## 🏗️ Project Structure

```
/workspace/restaurant-app
├── public/
├── src/
│   ├── components/       # Reusable React components (ThemeToggle, Toast, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── App.css           # Main stylesheet
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   ├── menuData.ts       # Restaurant menu configuration
│   ├── openaiService.ts  # OpenAI API integration service
│   └── supabaseClient.ts # Supabase client initialization
├── supabase/
│   └── functions/
│       └── create-checkout-session/
│           └── index.ts  # Supabase Edge Function for Stripe checkout
├── .env                  # Environment variables
├── package.json
└── README.md
```

## 🤖 API Documentation

### OpenAI API

The conversational ordering is handled by the `openaiService.ts` file, which communicates with the OpenAI GPT-4 model. The service sends the user's input along with the conversation history and a system prompt that includes the restaurant's menu.

### Supabase

-   **Database**: The backend uses a Supabase PostgreSQL database to store `orders` and `order_items`.
-   **Edge Functions**: The `create-checkout-session` function is a Deno-based serverless function that securely communicates with the Stripe API to create payment sessions.

### Stripe API

Stripe is used for payment processing. The `create-checkout-session` edge function creates a new Stripe Checkout session and redirects the user to the Stripe-hosted payment page.

**Stripe Checkout Function (`create-checkout-session/index.ts`)**
This function is responsible for:
1.  Validating cart items and customer information.
2.  Creating line items for the Stripe session.
3.  Storing the order details in the Supabase database.
4.  Returning a secure checkout URL to the frontend.

```typescript
// supabase/functions/create-checkout-session/index.ts

Deno.serve(async (req) => {
    // 1. CORS and OPTIONS request handling
    // 2. Extract cartItems, customerInfo, etc. from request body
    // 3. Validate input
    // 4. Initialize Stripe and Supabase clients with environment variables
    // 5. Create line items for Stripe
    // 6. Create a Stripe checkout session
    // 7. Store the order in the 'orders' table in Supabase
    // 8. Return the checkout URL to the client
});
```

## ☁️ Deployment Guide

The application is designed for easy deployment on platforms like Vercel, Netlify, or AWS Amplify.

1.  **Connect your Git repository** to your chosen hosting provider.
2.  **Configure the build command:** `pnpm build` (or `npm run build`).
3.  **Set the publish directory:** `dist`.
4.  **Add the environment variables** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OPENAI_API_KEY`) to your deployment platform's settings.
5.  **Deploy!**

## 💡 Development Guidelines

-   **Styling**: Use Tailwind CSS for utility-first styling. Custom CSS and animations are located in `src/App.css`.
-   **Components**: Create reusable components in the `src/components` directory.
-   **State Management**: The main application state is managed using React's `useState` and `useRef` hooks in `App.tsx`.
-   **Animations**: Use the `framer-motion` library for all UI animations.
-   **Code Formatting**: Run `pnpm format` to format the code using Prettier.

## 🐛 Troubleshooting

-   **AI is not responding**: Ensure your `VITE_OPENAI_API_KEY` is correct and has sufficient credits.
-   **Checkout fails**: Verify that your `STRIPE_SECRET_KEY` and other Supabase secrets are correctly set in the Supabase dashboard for the edge function.
-   **Items not adding to cart**: The AI uses a conversational flow. You need to confirm your selections with the AI before it adds items to the cart.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

1.  Fork the repository.
2.  Create a new branch: `git checkout -b feature/your-feature-name`.
3.  Make your changes and commit them.
4.  Push to the branch: `git push origin feature/your-feature-name`.
5.  Open a pull request.

---

*This documentation was generated by an AI assistant.*
