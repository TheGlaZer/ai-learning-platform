# AI Learning Platform: System Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architectural Principles](#architectural-principles)
3. [System Components](#system-components)
4. [Vector Database Integration](#vector-database-integration)
5. [Code Organization](#code-organization)
6. [Implementation Guidelines](#implementation-guidelines)

## Overview

This document outlines the architecture for the AI Learning Platform, focusing on modularity, separation of concerns, and the integration of vector database capabilities with PostgreSQL. The platform is built using Next.js with TypeScript, leveraging Supabase for backend services.

## Architectural Principles

### Single Responsibility Principle (SRP)

Each module, class, or function should have one and only one reason to change, meaning it should have only one job or responsibility. This is the foundational principle guiding our system design.

Key applications:
- Separate UI components from business logic
- Divide backend services by domain functionality
- Create specialized utility functions for common operations

### Modularity

The system is organized into cohesive modules that encapsulate related functionality. This approach:
- Improves code maintainability
- Enables parallel development
- Facilitates testing and debugging
- Allows for easier system evolution

### Separation of Concerns

Different aspects of the system are handled by distinct components:
- **Frontend**: User interface presentation and client-side logic
- **Backend**: Business logic and data processing
- **Data Layer**: Data persistence and retrieval
- **AI Services**: AI model integration and processing

## System Components

### Client-Side Architecture

1. **Components**
   - UI components (React components)
   - Custom hooks for state management
   - Context providers for shared state
   - Client-side services for API communication

2. **Organization**
   - Components follow a hierarchical structure
   - Sub-components handle specific UI elements
   - Components should not exceed 20-30 lines of code
   - Styled components for consistent styling

### Server-Side Architecture

1. **API Routes**
   - Endpoint handlers for client requests
   - Authentication and authorization validation
   - Request validation and error handling

2. **Services**
   - Business logic implementation
   - Database operations
   - External API integrations

3. **AI Module**
   - AI service interfaces
   - Provider-specific implementations
   - Model management
   - AI feature configuration

4. **Database Layer**
   - Data models
   - Query functions
   - Schema management

## Vector Database Integration

### Overview

The vector database integration leverages PostgreSQL with the pgvector extension to enable semantic search and similarity matching for content. This allows for more intelligent retrieval of learning materials based on semantic meaning rather than just keyword matching.

### Architecture Components

1. **Vector Embedding Service**
   ```
   src/app/lib-server/vectorEmbedding/
   ├── VectorEmbeddingService.ts       # Interface for embedding generation
   ├── OpenAIEmbeddingService.ts       # OpenAI-specific implementation
   ├── EmbeddingCache.ts               # Caching for embeddings
   ├── EmbeddingManager.ts             # Centralized embedding management
   └── index.ts                        # Service exports
   ```

2. **Database Schema Extensions**
   ```sql
   -- Enable pgvector extension
   CREATE EXTENSION IF NOT EXISTS vector;

   -- Add embedding column to relevant tables
   ALTER TABLE subjects ADD COLUMN IF NOT EXISTS embedding vector(1536);
   ALTER TABLE files ADD COLUMN IF NOT EXISTS embedding vector(1536);
   ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS embedding vector(1536);
   
   -- Create indexes for vector similarity search
   CREATE INDEX IF NOT EXISTS idx_subjects_embedding ON subjects USING ivfflat (embedding vector_cosine_ops);
   CREATE INDEX IF NOT EXISTS idx_files_embedding ON files USING ivfflat (embedding vector_cosine_ops);
   CREATE INDEX IF NOT EXISTS idx_quiz_questions_embedding ON quiz_questions USING ivfflat (embedding vector_cosine_ops);
   ```

3. **Vector Search Service**
   ```
   src/app/lib-server/vectorSearch/
   ├── VectorSearchService.ts          # Interface for vector search operations
   ├── PostgresVectorSearch.ts         # Postgres-specific implementation
   ├── SearchQueryBuilder.ts           # Builder for search queries
   └── index.ts                        # Service exports
   ```

4. **Content Processing Pipeline**
   ```
   src/app/lib-server/contentProcessing/
   ├── ContentProcessor.ts             # Base content processing interface
   ├── TextProcessor.ts                # Text content processing
   ├── FileProcessor.ts                # File content processing
   ├── ProcessingPipeline.ts           # Pipeline orchestration
   └── index.ts                        # Processor exports
   ```

### Implementation Steps

1. **Setup pgvector in PostgreSQL**
   - Install pgvector extension in Supabase PostgreSQL instance
   - Create or modify database tables to include vector embedding columns
   - Create appropriate indexes for vector similarity search

2. **Embedding Generation**
   - Implement embedding generation service using AI providers (OpenAI, etc.)
   - Add embedding generation to content creation/update workflows
   - Implement caching for frequently used embeddings

3. **Vector Search Implementation**
   - Develop vector search service using SQL queries with vector operations
   - Create utility functions for common search patterns
   - Implement similarity thresholds and ranking

4. **API Integration**
   - Create API endpoints for vector search operations
   - Integrate vector search with existing search functionality
   - Add filtering capabilities to combine semantic and traditional search

## Code Organization

The system follows a clear and consistent organization pattern:

```
src/
├── app/                                # Next.js app directory
│   ├── api/                            # API routes
│   ├── [routes]/                       # Page routes
│   └── lib-server/                     # Server-side only code
│       ├── ai/                         # AI service implementations
│       ├── vectorEmbedding/            # Vector embedding services
│       ├── vectorSearch/               # Vector search services
│       └── contentProcessing/          # Content processing pipeline
├── components/                         # React components
│   ├── common/                         # Shared components
│   └── [feature]/                      # Feature-specific components
├── hooks/                              # Custom React hooks
├── utils/                              # Utility functions
│   ├── client/                         # Client-side utilities
│   ├── server/                         # Server-side utilities
│   └── shared/                         # Shared utilities
├── services/                           # Client-side services
│   ├── api/                            # API communication
│   └── [domain]/                       # Domain-specific services
├── types/                              # TypeScript type definitions
├── contexts/                           # React context providers
└── database/                           # Database migrations and types
    └── migrations/                     # SQL migration files
```

## Implementation Guidelines

### Component Development

1. **Component Structure**
   - Keep components focused on a single responsibility
   - Extract reusable parts into separate components
   - Use custom hooks for complex state management
   - Limit component size to 20-30 lines of code

2. **Styling Approach**
   - Use Emotion styled components for styling
   - Follow naming conventions for styled components
   - Avoid inline styles
   - Reference theme colors from colors.ts

### Services Implementation

1. **Service Interfaces**
   - Define clear interfaces for all services
   - Implement concrete service classes
   - Use dependency injection for service dependencies
   - Follow consistent error handling patterns

2. **AI Integration**
   - Use AIServiceFactory for service creation
   - Configure services through AIConfig
   - Implement provider-specific functionality in dedicated classes
   - Use appropriate model selection based on feature requirements

### Vector Database Integration

1. **Code Examples**

   **Embedding Generation**
   ```typescript
   // VectorEmbeddingService.ts
   export interface VectorEmbeddingService {
     generateEmbedding(text: string): Promise<number[]>;
     generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
   }

   // OpenAIEmbeddingService.ts
   export class OpenAIEmbeddingService implements VectorEmbeddingService {
     private openai: OpenAI;
     private model: string = 'text-embedding-ada-002';

     constructor(apiKey?: string) {
       this.openai = new OpenAI({
         apiKey: apiKey || process.env.OPENAI_API_KEY
       });
     }

     async generateEmbedding(text: string): Promise<number[]> {
       const response = await this.openai.embeddings.create({
         model: this.model,
         input: text
       });
       return response.data[0].embedding;
     }

     async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
       const response = await this.openai.embeddings.create({
         model: this.model,
         input: texts
       });
       return response.data.map(item => item.embedding);
     }
   }
   ```

   **Vector Search**
   ```typescript
   // PostgresVectorSearch.ts
   export class PostgresVectorSearch implements VectorSearchService {
     private supabase: SupabaseClient;

     constructor(supabase: SupabaseClient) {
       this.supabase = supabase;
     }

     async searchSubjects(query: string, options?: SearchOptions): Promise<Subject[]> {
       // Get embedding for query
       const embeddingService = new OpenAIEmbeddingService();
       const embedding = await embeddingService.generateEmbedding(query);
       
       // Perform vector search
       const { data, error } = await this.supabase
         .rpc('match_subjects', {
           query_embedding: embedding,
           match_threshold: options?.threshold || 0.7,
           match_count: options?.limit || 10
         });
         
       if (error) throw error;
       return data;
     }
   }
   ```

   **Database Functions**
   ```sql
   -- Function to perform vector similarity search on subjects
   CREATE OR REPLACE FUNCTION match_subjects(
     query_embedding vector(1536),
     match_threshold float,
     match_count int
   )
   RETURNS TABLE (
     id uuid,
     name text,
     description text,
     similarity float
   )
   LANGUAGE plpgsql
   AS $$
   BEGIN
     RETURN QUERY
     SELECT
       s.id,
       s.name,
       s.description,
       1 - (s.embedding <=> query_embedding) AS similarity
     FROM
       subjects s
     WHERE
       1 - (s.embedding <=> query_embedding) > match_threshold
     ORDER BY
       similarity DESC
     LIMIT match_count;
   END;
   $$;
   ```

2. **Integration Best Practices**
   - Generate embeddings at content creation/update time
   - Store embeddings in database for efficient retrieval
   - Implement caching for frequently accessed embeddings
   - Use batch operations for processing multiple items
   - Add background jobs for processing large content collections
   - Implement fallback search methods for robustness

### Error Handling

Implement consistent error handling across all layers:
- Use custom error classes for different error types
- Provide meaningful error messages for debugging
- Implement appropriate error recovery strategies
- Log errors with relevant context information

### Security Considerations

- Implement proper authentication and authorization
- Validate all user inputs
- Use parameterized queries to prevent SQL injection
- Apply row-level security policies in Supabase
- Follow least privilege principle for service accounts 