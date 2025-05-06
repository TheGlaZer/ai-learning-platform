# Embedding-Based Quiz Generation Feature

## Overview

This document outlines the implementation plan for adding embedding-based quiz generation to the learning platform. This feature will leverage vector embeddings to find the most relevant content for quiz questions based on user input, filtering by selected subjects, and using custom instructions.

## Current Implementation

Currently, the quiz generation process:
1. Takes a file ID and loads the entire file content
2. Filters content based on selected subjects (if any)
3. Sends the filtered content to an AI model for quiz generation
4. Stores the generated quiz

This approach has limitations:
- Sends large amounts of text to the AI model, potentially hitting token limits
- Lacks semantic understanding of content relevance to user queries
- May include irrelevant content sections in the generation prompt

## Proposed Implementation

### 1. Feature Goals

- Use vector embeddings to find the most relevant content for each quiz question
- Filter content based on selected subjects and user instructions
- Reduce the amount of text sent to the AI model
- Improve the relevance and quality of generated questions

### 2. Implementation Steps

#### 2.1 New API for Embedding-Based Quiz Generation

Create a new server function `generateQuizWithEmbeddings` in `src/app/lib-server/quiz/quizGenerationService.ts` that will:

1. Accept the same parameters as the existing `generateQuiz` function
2. Use embeddings to find relevant content chunks instead of loading the full file
3. Leverage the existing AI service for quiz generation

#### 2.2 Content Matching Algorithm

The core of this feature will be a content matching algorithm that:

1. Converts user topic, selected subjects, and instructions into embeddings
2. Retrieves relevant content chunks from the file based on embedding similarity
3. Selects the most relevant chunks to send to the AI model

#### 2.3 Technical Approach

```
User Input
  |
  ↓
Generate embeddings for:
  - Quiz topic
  - Selected subjects (IMPORTANT: Each subject as separate embedding)
  - Custom instructions
  |
  ↓
Filter content chunks:
  - Primary filter: Workspace or specific file(s)
  - Secondary filter: Selected subjects
  |
  ↓
Match against file chunk embeddings
  |
  ↓
Select top N chunks per question
  |
  ↓
Send to AI model for quiz generation
```

### 3. Data Flow

1. **User Input**:
   - File ID (or workspace ID if selecting from all workspace)
   - Topic/quiz subject
   - Number of questions
   - Difficulty level
   - Selected subjects
   - Custom instructions
   - Exam patterns (if enabled)

2. **Processing**:
   - Generate embeddings for user input
   - **IMPORTANT**: Convert each selected subject into a separate embedding vector
   - Apply workspace/file filtering first (primary filter)
   - Apply subject-based filtering (secondary filter)
   - Match against file chunk embeddings in vector database
   - For each planned question, find the most relevant chunk(s)
   - Combine these chunks into a prompt for the AI model

3. **Output**:
   - Generated quiz with questions based on the most relevant content

### 4. Chunking and Matching Strategy

#### 4.1 Chunk Size Considerations

Based on the current implementation, file content is split into chunks of:
- Chunk size: 1800 characters
- Chunk overlap: 300 characters
- Maximum chunks: 200

For quiz generation, we'll use:
- 1-2 relevant chunks per question
- Prioritize chunks with higher semantic similarity to the topic/subject

#### 4.2 Embedding Matching

We'll use the existing `match_files` function and extend it to:
- Accept multiple embedding queries (topic + subjects)
- Rank results by weighted similarity scores
- Filter by workspace ID and file ID

#### 4.3 Subject-Based Filtering (IMPORTANT)

**IMPORTANT**: Subject filtering will be implemented as follows:

1. Convert each selected subject into a separate embedding vector
2. For each subject embedding, find the most relevant chunks from the primary-filtered set
3. Combine the results with appropriate weighting
4. If no subjects are selected, fall back to topic-based embedding search across all available chunks

#### 4.4 Performance Optimization for Subject Embeddings

**IMPORTANT**: To optimize the performance of subject-based filtering, we will implement the following strategy:

1. **Batch Embedding Generation**:
   - Use OpenAI's batch embedding endpoint to generate embeddings for all subjects in a single API call
   - Format: `[{"role": "user", "content": "Subject 1"}, {"role": "user", "content": "Subject 2"}, ...]`
   - This reduces API calls and latency compared to making separate calls for each subject

2. **Optimized Comparison Strategy**:
   - Option 1 (Most Efficient): Use a database-level operation that computes similarity scores for multiple subject embeddings in a single query
     ```sql
     SELECT chunk_id, 
            MAX(1 - (embedding <=> ANY($subject_embeddings))) as max_similarity,
            AVG(1 - (embedding <=> ANY($subject_embeddings))) as avg_similarity
     FROM file_chunks
     WHERE file_id = $file_id
     GROUP BY chunk_id
     ORDER BY max_similarity DESC
     LIMIT $limit;
     ```
   - Option 2 (More Flexible): Perform separate queries for each subject embedding, then combine and rank results in application code

3. **Recommended Implementation**:
   - For smaller sets of subjects (≤5): Use Option 1 with database-level operations
   - For larger sets: Use Option 2 with parallel async queries
   - Cache embedding results for subjects to avoid regenerating them for subsequent requests

4. **Cost-Performance Trade-off**:
   - Database computation is more cost-effective than multiple embedding API calls
   - Caching subject embeddings provides the best balance of cost, performance, and accuracy
   - Implement a scoring function at the application level that can utilize pre-computed similarity scores

### 5. Performance Considerations

- **Database Load**: Running similarity searches on large embedding tables
- **API Latency**: Multiple embedding generation operations
- **Token Optimization**: Sending only relevant chunks to reduce token usage

### 6. Implementation Phases

#### Phase 1: Core Implementation
- Create the `generateQuizWithEmbeddings` function
- Implement content matching algorithm
- Update database queries to support the new approach

#### Phase 2: Refinement
- Tune matching parameters based on user feedback
- Optimize chunk selection strategy
- Add telemetry to compare quality with the traditional approach

### 7. Technical Challenges

1. **Subject Embedding Strategy (IMPORTANT)**:
   - **IMPORTANT**: Convert each subject name into its own embedding vector
   - Implement a scoring system that considers:
     - The semantic similarity between the chunk and each subject
   - When multiple subjects are selected, combine scores from each subject match

2. **Workspace vs. File Filtering**:
   - **Primary Filter**: Determine whether to search across all workspace chunks or just specific file(s)
   - Implement efficient database queries that first filter by workspace/file IDs before performing similarity searches

3. **Handling No Subject Selection**:
   - If user doesn't select subjects, use topic and custom instructions as the primary semantic filter
   - Select diverse chunks from across the file/workspace content based on relevance to topic
   - Ensure some randomness to cover different aspects of the content

4. **Chunk Selection**:
   - Challenge: Determining how many chunks to use per question
   - Recommendation: Start with 1-2 chunks per question, adjust based on quality

5. **Custom Instruction Processing**:
   - Challenge: Balancing direct instruction with content matching
   - Recommendation: Use custom instructions both for embedding matching and as direct AI instructions

### 8. Technical Dependencies

- Existing vector database implementation
- AI embedding services
- File chunking and processing utilities

### 9. Next Steps

1. Implement the `generateQuizWithEmbeddings` function
2. Create the subject-based embedding filtering system
3. Test the relevance of results with different subject combinations
4. Monitor performance and adjust parameters 