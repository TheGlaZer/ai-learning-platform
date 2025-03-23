export interface FileMetadata {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  file_type: "document" | "summary" | "quiz";
  url: string;
  metadata?: Record<string, any>;
  created_at: string;
}
