# Technical Context

## Technology Stack

### Frontend Framework
- **Next.js 15**: React-based full-stack framework
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling framework

### UI Components & Design
- **shadcn/ui**: High-quality React component library built on Radix UI
- **Radix UI**: Accessible, unstyled UI primitives
- **Lucide React**: Icon library for consistent iconography
- **next-themes**: Dark/light mode theming

### Backend & API
- **Next.js API Routes**: Server-side API endpoints
- **Supabase**: Authentication and PostgreSQL database
- **OpenAI API**: AI-powered grammar checking (optional)

### Development Tools
- **pnpm**: Fast, efficient package manager
- **ESLint**: Code linting and quality
- **PostCSS**: CSS processing
- **Vercel**: Deployment platform

## Key Dependencies

### Core Framework
```json
{
  "next": "15.2.4",
  "react": "^19",
  "react-dom": "^19",
  "typescript": "^5"
}
```

### UI & Components
```json
{
  "@radix-ui/react-*": "latest",
  "lucide-react": "^0.454.0",
  "tailwindcss": "^3.4.17",
  "next-themes": "latest"
}
```

### Backend Services
```json
{
  "@supabase/supabase-js": "latest",
  "@ai-sdk/openai": "latest",
  "ai": "latest"
}
```

### Utilities
```json
{
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.5",
  "zod": "latest",
  "date-fns": "4.1.0"
}
```

## Environment Configuration

### Required Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (Optional)
OPENAI_API_KEY=your_openai_api_key
```

### Development Setup
1. **Prerequisites**: Node.js 18+, pnpm
2. **Installation**: `pnpm install`
3. **Development**: `pnpm dev`
4. **Build**: `pnpm build`
5. **Production**: `pnpm start`

## Database Schema (Supabase)

### Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security
- Users can only access their own documents
- Authentication handled by Supabase Auth

## API Architecture

### Grammar Checking Endpoints
- **POST /api/grammar-check**: Main grammar checking endpoint
- **GET /api/ai-status**: Check OpenAI API availability

### Client-Side Services
- **Grammar Checker Factory**: Determines which service to use
- **Suggestion Management**: Handles suggestion lifecycle
- **Document CRUD**: Supabase integration for documents

## Build & Deployment

### Build Configuration
- **Next.js Config**: Minimal configuration with future flags
- **TypeScript Config**: Strict mode enabled
- **Tailwind Config**: Extended with custom components

### Deployment Strategy
- **Platform**: Vercel (optimized for Next.js)
- **Environment**: Production builds with optimizations
- **Monitoring**: Built-in Vercel analytics and logging

## Performance Considerations

### Bundle Optimization
- **Tree Shaking**: Unused code elimination
- **Code Splitting**: Automatic route-based splitting
- **Dynamic Imports**: Lazy loading for heavy components

### Runtime Performance
- **React 19 Features**: Concurrent rendering
- **Next.js Optimizations**: Image optimization, font loading
- **Debounced Operations**: Grammar checking, auto-save

## Development Patterns

### Code Organization
```
/app             # Next.js app router
/components      # Reusable UI components
/lib             # Utility functions and services
/styles          # Global styles
/public          # Static assets
```

### Type Safety
- Comprehensive TypeScript coverage
- Shared type definitions in `/lib/types.ts`
- Zod schemas for runtime validation

### Component Patterns
- Compound components for complex UI
- Custom hooks for shared logic
- Props interfaces for all components

## Security Considerations

### Authentication
- Supabase handles OAuth flow
- JWTs for session management
- Row-level security for data access

### API Security
- Environment variables for secrets
- Input validation on all endpoints
- Rate limiting through Vercel

### Data Protection
- User data isolation
- HTTPS enforcement
- Secure cookie handling 