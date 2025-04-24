export interface Flashcard {
  id?: string;
  question: string;
  answer: string;
  workspaceId: string;
  userId?: string;
  status?: 'dont_know' | 'partially_know' | 'know_for_sure';
  createdAt?: string;
  updatedAt?: string;
  pages?: string[];
  fileName?: string;
  lines?: number[];
}

export interface CreateFlashcardParams {
  question: string;
  answer: string;
  workspaceId: string;
  userId: string;
  status?: 'dont_know' | 'partially_know' | 'know_for_sure';
  pages?: string[];
  fileName?: string;
  lines?: number[];
}

export interface UpdateFlashcardParams {
  id: string;
  question?: string;
  answer?: string;
  status?: 'dont_know' | 'partially_know' | 'know_for_sure';
  pages?: string[];
  fileName?: string;
  lines?: number[];
} 