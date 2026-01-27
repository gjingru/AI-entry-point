# Test Skeleton Web App

A modern, beautiful web application built with React, TypeScript, Vite, and Tailwind CSS.

## What's this for?

This repository is a minimal React + Vite + TypeScript skeleton to kickstart new projects quickly. It includes Tailwind for styling, a simple project structure, and is set up for rapid local development and easy deployment.

### Live deployment

Production on Vercel: `https://r-skeleton-m604ecw8b-jguo-7861s-projects.vercel.app`

## Features

- ⚡️ **Vite** - Lightning-fast build tool and dev server
- ⚛️ **React 18** - Modern React with hooks
- 📘 **TypeScript** - Type-safe development
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🎯 **Modern UI** - Beautiful, responsive design

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm
- OpenAI API key (for chat functionality)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up OpenAI API key:
   - Create a `.env` file in the root directory
   - Add your OpenAI API key:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```
   - Get your API key from: https://platform.openai.com/api-keys
   - **Note**: For production, use a backend proxy to keep your API key secure

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
.
├── src/
│   ├── App.tsx          # Main app component
│   ├── main.tsx          # Entry point
│   ├── index.css        # Global styles with Tailwind
│   └── vite-env.d.ts    # Vite type definitions
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── postcss.config.js     # PostCSS configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Customization

The app is ready for you to customize:

1. Edit `src/App.tsx` to modify the main component
2. Update styles in `src/index.css` or add Tailwind classes
3. Add new components in the `src/` directory
4. Modify Tailwind theme in `tailwind.config.js`

Enjoy building! 🚀
