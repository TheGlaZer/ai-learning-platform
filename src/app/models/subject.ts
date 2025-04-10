export interface Subject {
  id?: string;
  workspaceId: string;
  userId: string;
  name: string;
  description?: string;
  source?: string; // Can be 'auto' or 'manual' to track if AI-generated or user-created
  order?: number;   // For sorting subjects within a workspace
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectGenerationParams {
  workspaceId: string;
  fileId: string;  // The file from which to extract subjects
  userId: string;
  aiProvider?: string;
  token?: string;  // Authentication token for accessing protected resources
  locale?: string; // User interface locale (e.g., 'en', 'he') for language preference
} 