# Serenify Frontend Application

![Next.js](https://img.shields.io/badge/Next.js-15.4.10-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-06B6D4?style=flat&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

## 📖 Overview

The **Serenify Frontend** is a modern, responsive single-page application built to provide an intuitive and calming user experience for mental health support. Developed with **Next.js 15 (App Router)** and **React 19**, it ensures blazing-fast performance, server-side rendering specific for SEO, and a seamless client-side navigation experience. The UI is crafted with **Tailwind CSS** and **Radix UI** primitives for accessible and customizable components.

Key features include:
- **Responsive Design:** Optimized for all devices (desktop, tablet, mobile).
- **Real-Time Communication:** Integrated WebSockets (coming soon) for instant chat functionality.
- **Accessible UI:** built on top of unstyled, accessible components from Radix UI.
- **Form Management:** robust form validation using `React Hook Form` and `Zod`.
- **Modern State Management:** Efficient client-state handling with React Context and Hooks.

## 🏗️ Architecture

The project utilizes the Next.js App Router for simplified routing and layout management:

```
serenify-frontend/
├── src/
│   ├── app/          # App Router: Pages, Layouts, Loading states
│   ├── components/   # Reusable UI components (Buttons, Modals, etc.)
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions and shared libraries
│   └── styles/       # Global styles (Tailwind directives)
├── public/           # Static assets (Images, Fonts)
└── package.json      # Project dependencies and scripts
```

## 🛠️ Technology Stack

| Category | Technology | Description |
|----------|------------|-------------|
| **Framework** | [Next.js 15](https://nextjs.org/) | React framework for production-grade applications. |
| **UI Library** | [React 19](https://react.dev/) | JavaScript library for building user interfaces. |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS framework for rapid UI development. |
| | [Sass](https://sass-lang.com/) | CSS preprocessor for advanced styling needs. |
| **Components** | [Radix UI](https://www.radix-ui.com/) | Unstyled, accessible component primitives. |
| **Icons** | [Lucide React](https://lucide.dev/) | Beautiful & consistent icon set. |
| **Forms** | [React Hook Form](https://react-hook-form.com/) | Performance-focused form validation library. |
| **Validation** | [Zod](https://zod.dev/) | TypeScript-first schema declaration and validation. |
| **Toast** | [Sonner](https://sonner.emilkowal.ski/) | An opinionated toast component for React. |

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v20 or higher)
- **npm** (v10+), **yarn**, or **pnpm**

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/AnshRaj112/serenify-frontend.git
    cd serenify-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Environment Configuration:**
    Create a `.env.local` file in the root directory:

    ```env
    # URL of the backend API
    NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
    ```

### Running the Application

To start the development server with **Turbopack** (for faster HMR):

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The page auto-updates as you edit `src/app/page.tsx`.

## 📜 Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev --turbopack` | Starts the development server with Turbo. |
| `build` | `next build` | Builds the application for production deployment. |
| `start` | `next start` | Starts the production server (requires build first). |
| `lint` | `next lint` | Runs ESLint to identify and fix code quality issues. |

## 🎨 Styling & Theming

The application uses a custom Tailwind configuration (`tailwind.config.js`) to define the color palette, typography, and spacing. Global styles are located in `src/app/globals.css`.

- **Dark Mode:** Support is built-in via the `next-themes` (if applicable) or manual CSS variables.
- **Components:** Found in `src/components/ui`, these are built using `shadcn/ui` patterns (Radix + Tailwind).

## 🧪 Testing & Linting

To ensure code quality, run the linter before committing:

```bash
npm run lint
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Documentation maintained by the SALVIORIS Development Team.*
