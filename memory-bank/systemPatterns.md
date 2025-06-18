# System Patterns & Architecture

## Overall Architecture
WordWise follows a modern Next.js full-stack architecture with clear separation of concerns:

```
Frontend (React/Next.js) → API Routes → External Services
                      ↓
                   Supabase (Auth + DB)
                      ↓
                   OpenAI API (optional)
```

## Key Design Patterns

### 1. Component Architecture
- **Atomic Design**: UI components built with shadcn/ui primitives
- **Compound Components**: Complex interactions like `TextEditor` + `SuggestionsPanel`
- **Custom Hooks**: Logic extraction for reusability (e.g., `useSuggestionsPanelProps`)

### 2. State Management
- **React State**: Local component state for UI interactions
- **Prop Drilling**: Managed through strategic component composition
- **Client-Side Caching**: Suggestions cached to avoid duplicate API calls

### 3. Data Flow Patterns
```
User Input → Debounced Check → Grammar Service → Suggestions → UI Update
         ↓
    Document Save → Supabase → Optimistic UI Update
```

### 4. Error Handling Strategy
- **Graceful Degradation**: AI fails → Basic rules-based checking
- **User Feedback**: Clear error states and loading indicators
- **Retry Logic**: Automatic retries for transient failures

## Core Components

### TextEditor Component
- **Responsibility**: Main editing interface and orchestration
- **Key Features**: 
  - Debounced grammar checking
  - Document management integration
  - Suggestion application/dismissal
  - Auto-save functionality

### Suggestion System
- **SuggestionCard**: Individual suggestion presentation
- **SuggestionsPanel**: Aggregated suggestion management
- **Grammar Checker**: Core logic for text analysis

### Document Management
- **DocumentManager**: CRUD operations for user documents
- **Supabase Integration**: Authentication and data persistence

## Service Layer Architecture

### Grammar Checking Services
1. **client-grammar-checker.ts**: Client-side orchestration
2. **grammar-checker.ts**: Basic rule-based checking
3. **openai-grammar-checker.ts**: AI-powered analysis
4. **API Routes**: Server-side endpoints for grammar checking

### Data Services
- **Supabase Client**: Authentication and database operations
- **Type Definitions**: Centralized TypeScript interfaces
- **Utility Functions**: Shared logic for suggestions and text manipulation

## Key Technical Decisions

### 1. Hybrid Grammar Checking
**Decision**: Implement both AI and rule-based checking
**Rationale**: Ensures functionality regardless of API availability
**Implementation**: Fallback pattern with client-side detection

### 2. Debounced API Calls
**Decision**: 1.5-second delay before grammar checking
**Rationale**: Reduce API costs and improve user experience
**Implementation**: useEffect with timeout cleanup

### 3. Suggestion Filtering
**Decision**: Filter out recently acted-upon suggestions
**Rationale**: Avoid suggestion fatigue and improve UX
**Implementation**: Time-based action tracking with cleanup

### 4. Real-time Auto-save
**Decision**: Automatic document saving with optimistic updates
**Rationale**: Prevent data loss and improve user confidence
**Implementation**: Debounced save with loading states

## Performance Optimizations

### 1. Suggestion Caching
- Cache suggestions for unchanged text
- Cleanup invalid suggestions periodically
- Filter suggestions based on user actions

### 2. Component Optimization
- Debounced text analysis
- Memoized heavy computations
- Strategic re-rendering prevention

### 3. API Efficiency
- Batch suggestion requests
- Avoid duplicate checks
- Intelligent retry strategies

## Security Patterns

### 1. Authentication Flow
- Supabase handles OAuth and session management
- Client-side session validation
- Protected API routes with user verification

### 2. Data Protection
- User documents isolated by user_id
- API keys stored securely as environment variables
- Input sanitization for grammar checking

## Extensibility Patterns

### 1. Plugin Architecture
- Modular grammar checker services
- Configurable suggestion types
- Extensible settings system

### 2. Theme System
- shadcn/ui theme integration
- Dark/light mode support
- Customizable UI components 