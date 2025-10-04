# Premium Travel Booking Platform

A modern, full-featured travel booking platform built with Next.js 15, TypeScript, and Supabase.

## ✨ Features

- ✅ **Next.js 15** with App Router and Server Actions
- ✅ **TypeScript** with strict mode and comprehensive type checking
- ✅ **Tailwind CSS 4.0** with custom components and utilities
- ✅ **Supabase** for backend services (auth, database, storage)
- ✅ **Form Handling** with React Hook Form and Zod validation
- ✅ **Premium UI Components** with Lucide React icons
- ✅ **Smooth Animations** with Framer Motion
- ✅ **Advanced Features**: Drag & drop, file uploads, charts, command palette
- ✅ **Mobile-Optimized** drawers and responsive design
- ✅ **Cross-platform** compatibility (Windows, macOS, Linux)

## 🚀 Tech Stack

### Core Framework
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4.0** - Utility-first CSS framework

### Backend & Database
- **Supabase** - Backend-as-a-Service (auth, database, storage)
- **@supabase/ssr** - Server-side rendering support

### Forms & Validation
- **React Hook Form** - Performant forms with easy validation
- **Zod** - TypeScript-first schema validation
- **@hookform/resolvers** - Validation resolvers

### UI & Icons
- **Lucide React** - Beautiful, customizable icons
- **Framer Motion** - Production-ready motion library
- **Class Variance Authority** - Component variant management
- **clsx & tailwind-merge** - Conditional classnames

### Advanced Components
- **React Beautiful DnD** - Drag and drop functionality
- **React Dropzone** - File upload handling
- **React Day Picker** - Date selection components
- **Recharts** - Beautiful charts and data visualization
- **Sonner** - Toast notifications
- **Vaul** - Mobile-optimized drawers
- **CMDK** - Command palette component

### Utilities
- **date-fns** - Modern JavaScript date utility library

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/        # Reusable React components
│   └── Button.tsx    # Enhanced button component
├── context/          # React context providers
│   └── ThemeContext.tsx
├── hooks/            # Custom React hooks
│   └── useLocalStorage.ts
├── lib/              # Utilities, services, and types
│   ├── supabase.ts   # Supabase configuration
│   ├── types.ts      # TypeScript type definitions
│   ├── utils.ts      # Utility functions
│   └── validations.ts # Zod validation schemas
├── styles/           # Additional stylesheets
│   └── components.css
└── types/            # TypeScript declaration files
    └── css.d.ts

public/
├── fonts/            # Custom fonts
└── images/           # Optimized images
```

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for backend services)

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## 🔧 Configuration

### TypeScript
- **Strict mode** enabled with comprehensive type checking
- **Path aliases** configured (`@/*` → `src/*`)
- **Cross-platform** compatibility

### Tailwind CSS
- **Version 4.0** with custom theme and utilities
- **Prettier plugin** for automatic class sorting
- **Component variants** with Class Variance Authority

### Supabase
- **Client-side** and **server-side** configurations
- **Type-safe** database operations
- **Authentication** helpers for Next.js

### Development Tools
- **ESLint** with Next.js recommended rules
- **Prettier** with Tailwind CSS plugin
- **TypeScript** strict mode

## 🌍 Cross-Platform Compatibility

This project is configured to work seamlessly across:
- **Windows** (PowerShell/CMD)
- **macOS** (Terminal)
- **Linux** (Bash/Zsh)

All configurations, scripts, and dependencies are tested for cross-platform compatibility.

## 🚀 Deployment

The project is configured for easy deployment to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Docker** containers

## 📚 Key Features for Travel Booking

### User Management
- User authentication and profiles
- Booking history and preferences
- Passenger information management

### Search & Filtering
- Advanced destination search
- Date range selection
- Price and amenity filtering
- Real-time search results

### Booking System
- Hotel reservations
- Flight bookings
- Package deals
- Multi-passenger support

### Payment Integration
- Secure payment processing
- Multiple currency support
- Booking confirmations

### Admin Dashboard
- Analytics and reporting
- Content management
- User management
- Booking oversight

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.