import { useState, useCallback } from "react";
import { PastExam } from "@/app/models/pastExam";
import { uploadFileClient } from "@/app/lib-client/fileClient";
import {
  supabase,
  getAuthenticatedClient,
} from "@/app/lib-server/supabaseClient";
import axios from "axios";

// Custom hook for managing past exams
export const usePastExams = (userId: string, accessToken?: string) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [workspacePastExams, setWorkspacePastExams] = useState<
    Record<string, PastExam[]>
  >({});

  // Fetch past exams for a specific workspace
  const fetchPastExams = useCallback(
    async (workspaceId: string) => {
      if (!userId) return [];

      try {
        setLoading(true);
        setError(null);

        const client = accessToken
          ? await getAuthenticatedClient(accessToken)
          : supabase;

        const { data, error } = await client
          .from("past_exams")
          .select("*")
          .eq("workspace_id", workspaceId)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        // Transform the data to match our PastExam interface
        const pastExams: PastExam[] = data.map((item: any) => ({
          id: item.id,
          workspace_id: item.workspace_id,
          user_id: item.user_id,
          name: item.name,
          year: item.year,
          semester: item.semester,
          course: item.course,
          url: item.url,
          metadata: item.metadata,
          created_at: item.created_at,
        }));

        setWorkspacePastExams((prev) => ({
          ...prev,
          [workspaceId]: pastExams,
        }));

        return pastExams;
      } catch (err: any) {
        setError(err.message || "Error fetching past exams");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [userId, accessToken]
  );

  // Upload a new past exam
  const uploadPastExam = useCallback(
    async (
      pastExam: Partial<PastExam>,
      file: File,
      workspaceId: string
    ): Promise<PastExam | null> => {
      if (!userId || !workspaceId) {
        setError("User or workspace ID is missing");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // Prepare form data for API request
        const formData = new FormData();
        formData.append("file", file);
        formData.append("workspaceId", workspaceId);
        formData.append("name", pastExam.name || "");

        if (pastExam.year) {
          formData.append("year", pastExam.year);
        }

        if (pastExam.semester) {
          formData.append("semester", pastExam.semester);
        }

        if (pastExam.course) {
          formData.append("course", pastExam.course);
        }

        // Send the request to the API
        const response = await axios.post("/api/past-exams", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Get the new past exam data from the response
        const newPastExam: PastExam = response.data;

        // Update state
        setWorkspacePastExams((prev) => ({
          ...prev,
          [workspaceId]: [newPastExam, ...(prev[workspaceId] || [])],
        }));

        return newPastExam;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          "Error uploading past exam";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId, accessToken]
  );

  // Update an existing past exam
  const updatePastExam = useCallback(
    async (pastExam: Partial<PastExam>): Promise<PastExam | null> => {
      if (!userId || !pastExam.id || !pastExam.workspace_id) {
        setError("Missing required information");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // Send PATCH request to update the past exam
        const response = await axios.patch("/api/past-exams", pastExam, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Get the updated past exam from the response
        const updatedPastExam: PastExam = response.data;

        // Update state
        setWorkspacePastExams((prev) => {
          const workspaceExams = prev[pastExam.workspace_id!] || [];
          const updatedExams = workspaceExams.map((exam) =>
            exam.id === updatedPastExam.id ? updatedPastExam : exam
          );

          return {
            ...prev,
            [pastExam.workspace_id!]: updatedExams,
          };
        });

        return updatedPastExam;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          "Error updating past exam";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId, accessToken]
  );

  // Delete a past exam
  const deletePastExam = useCallback(
    async (pastExamId: string, workspaceId: string): Promise<boolean> => {
      if (!userId || !pastExamId || !workspaceId) {
        setError("Missing required information");
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        // Send DELETE request to delete the past exam
        await axios.delete(`/api/past-exams?id=${pastExamId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Update state
        setWorkspacePastExams((prev) => {
          const workspaceExams = prev[workspaceId] || [];
          const updatedExams = workspaceExams.filter(
            (exam) => exam.id !== pastExamId
          );

          return {
            ...prev,
            [workspaceId]: updatedExams,
          };
        });

        return true;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error ||
          err.message ||
          "Error deleting past exam";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId, accessToken]
  );

  return {
    workspacePastExams,
    loading,
    error,
    fetchPastExams,
    uploadPastExam,
    updatePastExam,
    deletePastExam,
  };
};
