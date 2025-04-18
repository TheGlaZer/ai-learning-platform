export interface Flashcard {
  id?: string;
  question: string;
  answer: string;
  workspaceId: string;
  userId?: string;
  status?: 'dont_know' | 'partially_know' | 'know_for_sure';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFlashcardParams {
  question: string;
  answer: string;
  workspaceId: string;
  userId: string;
  status?: 'dont_know' | 'partially_know' | 'know_for_sure';
}

export interface UpdateFlashcardParams {
  id: string;
  question?: string;
  answer?: string;
  status?: 'dont_know' | 'partially_know' | 'know_for_sure';
} 