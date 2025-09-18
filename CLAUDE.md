# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (uses Next.js with Turbopack)
- **Build**: `npm run build` (production build with Turbopack)
- **Start production**: `npm start`
- **Lint**: `npm run lint` (ESLint with Next.js TypeScript config)

## Architecture Overview

This is an e-commerce application built with Next.js 15, featuring:

### Frontend Stack
- **Next.js 15** with App Router and React 19
- **Tailwind CSS v4** for styling
- **shadcn/ui** components (New York style) with Radix UI primitives
- **TypeScript** with strict configuration
- **Lucide React** for icons

### Backend/Database
- **Drizzle ORM** with PostgreSQL
- Database schema located at `app/src/db/schema.ts`
- Drizzle config: `drizzle.config.ts` (schema migrations output to `./drizzle`)
- Uses environment variable `DATABASE_URL` for database connection

### Database Schema
Core entities include:
- `users` (id, email, passwordHash, role, createdAt)
- `products` (id, name, description, price, imageUrl, inStock, createdAt)
- `orders` (id, userId, total, status, createdAt) with enum status: pending/shipped/delivered/cancelled
- `orderItems` (id, orderId, productId, quantity)

### Component Structure
- **UI Components**: Located in `components/ui/` (shadcn/ui components)
- **AI Elements**: Located in `components/ai-elements/` (AI SDK components)
- **Path Aliases**: Uses `@/*` for root-level imports configured in `tsconfig.json`

### API Structure
API routes are organized in `/api` directory with folders for:
- `auth/` (login, register)
- `orders/`
- `products/`

### Authentication & Security
- Uses JWT tokens via `@elysiajs/jwt`
- Password hashing with `bcryptjs`
- Zod for schema validation

### Development Notes
- Uses Bun as package manager (bun.lock present)
- ESLint configured with Next.js core-web-vitals and TypeScript rules
- AI SDK integration for AI-powered features
- Environment requires `DATABASE_URL` for database connection