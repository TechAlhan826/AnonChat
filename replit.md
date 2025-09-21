# AnonChat - Anonymous Real-Time Chat Application

## Overview

AnonChat is a real-time anonymous chat application built with a modern full-stack architecture. The application allows users to create and join chat rooms using 6-character room codes, supporting both authenticated users and anonymous guests. It features real-time messaging, typing indicators, and a responsive UI built with React and shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The client-side is built with **React 18** using TypeScript and follows a modern component-based architecture:

- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Real-time Communication**: Custom WebSocket client for bidirectional communication
- **Theme System**: Dark/light mode support with system preference detection
- **Form Handling**: React Hook Form with Zod validation

Key architectural decisions:
- Component composition pattern using shadcn/ui for consistent design system
- Custom hooks (useAuth, useSocket, useToast) for business logic separation
- Responsive design with mobile-first approach
- Progressive Web App (PWA) capabilities with service worker

### Backend Architecture

The server-side uses **Express.js** with TypeScript in an ESM environment:

- **API Design**: RESTful endpoints with WebSocket support for real-time features
- **Authentication**: JWT-based authentication with support for guest sessions
- **Password Security**: bcryptjs for password hashing
- **Validation**: Zod schemas for request/response validation
- **Session Management**: In-memory storage with extensible interface for future database integration

Key architectural decisions:
- Modular route organization with centralized error handling
- Type-safe request/response handling with Express type extensions
- Memory-based storage abstraction (IStorage interface) for easy database migration
- WebSocket integration for real-time messaging and presence indicators

### Data Storage Solutions

Currently implements **in-memory storage** with a well-defined interface:

- **Database Schema**: Drizzle ORM with PostgreSQL schema definitions ready for production
- **Data Models**: Users, rooms, messages, room members, and guest sessions
- **Storage Abstraction**: IStorage interface allows switching from memory to database without code changes
- **Migration Ready**: Drizzle configuration and schemas prepared for PostgreSQL deployment

The application is designed to easily transition from development (memory storage) to production (PostgreSQL) by swapping the storage implementation.

### Authentication and Authorization

Dual authentication system supporting both registered users and anonymous guests:

- **User Authentication**: JWT tokens with email/password login and registration
- **Guest Sessions**: Anonymous access with session tokens and optional display names
- **Authorization Middleware**: Express middleware for protecting authenticated routes
- **Role-based Access**: Room creation requires authentication, joining rooms supports both user types

### Real-time Communication

WebSocket-based real-time messaging system:

- **Message Broadcasting**: Real-time message delivery to all room participants
- **Typing Indicators**: Live typing status updates
- **Presence Management**: User join/leave notifications
- **Connection Resilience**: Automatic reconnection with exponential backoff
- **Message Types**: Support for text messages and system notifications

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL database connector (prepared for production)
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web application framework
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **ws**: WebSocket server implementation

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **wouter**: Lightweight React router
- **tailwindcss**: Utility-first CSS framework
- **date-fns**: Date manipulation library
- **class-variance-authority**: Component variant management

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety
- **drizzle-kit**: Database migrations and schema management
- **esbuild**: Server-side bundling for production

### Replit-Specific Integrations
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Code mapping for debugging
- **@replit/vite-plugin-dev-banner**: Development environment indicator

The application is structured for easy deployment and scaling, with clear separation of concerns and modern development practices throughout the stack.