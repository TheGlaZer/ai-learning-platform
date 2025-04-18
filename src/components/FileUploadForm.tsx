"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
} from "@mui/material";
import { uploadFileClient } from "@/app/lib-client/fileClient";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useRTL } from "@/contexts/RTLContext";

interface SummarizationFormInputs {
  file: FileList;
  fileName: string;
  keyTopics: string;
  summaryLength: "Short" | "Medium" | "Long";
  preferredFormat: "Bullet Points" | "Paragraphs";
  highlightTerms: boolean;
}

const StyledContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
`;

const FileUploadForm: React.FC = () => {
  // Use translations from the "FileUploadForm" namespace
  const t = useTranslations("FileUploadForm");
  const { accessToken, userId } = useAuth(); // Get userId from AuthContext
  const { selectedWorkspace } = useWorkspace(); // Get current workspace from context
  const { isRTL } = useRTL(); // Get RTL status
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState<string>("Default");

  // Debug workspace info
  useEffect(() => {
    if (selectedWorkspace) {
      console.log("Workspace details:", selectedWorkspace);
      console.log("Workspace ID:", selectedWorkspace.id);
      console.log("Workspace name:", selectedWorkspace.name);
      setWorkspaceName(selectedWorkspace.name || "Default");
    } else {
      console.log("No workspace selected");
    }
  }, [selectedWorkspace]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SummarizationFormInputs>({
    defaultValues: {
      summaryLength: "Medium",
      preferredFormat: "Paragraphs",
      highlightTerms: false,
    },
  });

  // Handle file selection and automatically set the fileName field
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Get the original file name without extension
      const fullName = files[0].name;
      const lastDotIndex = fullName.lastIndexOf('.');
      const nameWithoutExtension = lastDotIndex !== -1 ? fullName.substring(0, lastDotIndex) : fullName;
      
      // Set the fileName field with the original file name
      setValue("fileName", nameWithoutExtension);
      setSelectedFileName(fullName);
    }
  };

  const onSubmit: SubmitHandler<SummarizationFormInputs> = async (data) => {
    console.log("Form Data Submitted:", data);

    // Extract the file from the FileList
    const fileList = data.file;
    if (!fileList || fileList.length === 0) {
      console.error("No file selected");
      return;
    }
    const file = fileList[0];

    // Check if we have a valid workspace
    if (!selectedWorkspace) {
      console.error("No workspace selected");
      return;
    }

    if (!userId || !accessToken) {
      console.error("User not authenticated");
      return;
    }

    // Create a new File object with a sanitized name (remove spaces, special chars)
    const fileExtension = file.name.split('.').pop() || '';
    const sanitizedFileName = data.fileName
      .replace(/[^\u0590-\u05FF\w\s_.-]/g, '') // Keep Hebrew chars + alphanumeric + underscore, dot, hyphen
      .replace(/\s+/g, '_');    // Replace spaces with underscores
    
    const renamedFile = new File(
      [file], 
      `${sanitizedFileName}.${fileExtension}`,
      { type: file.type }
    );

    // Use workspace ID for consistency with database
    console.log('Using workspace ID for upload:', selectedWorkspace.id);
    console.log('Workspace name (for display only):', workspaceName);

    try {
      // Pass userId and workspace ID to upload function
      const uploadResult = await uploadFileClient(
        userId,
        selectedWorkspace.id, // Use ID instead of name
        renamedFile,
        accessToken
      );
      console.log("File upload result:", uploadResult);
      // Here, you might trigger your summarization API call with additional data.
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };
  

  const onError = (errors: any) => {
    console.error("Form Errors:", errors);
  };

  return (
    <StyledContainer maxWidth="sm">
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit, onError)}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: 3,
          border: "1px solid #ddd",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          backgroundColor: "#fff",
          textAlign: isRTL ? 'right' : 'left',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <Typography variant="h5" align={isRTL ? "right" : "left"} gutterBottom>
          {t("uploadFileTitle")}
        </Typography>

        {/* Current Workspace Information */}
        {selectedWorkspace && (
          <Typography variant="subtitle1" align={isRTL ? "right" : "left"}>
            Workspace: {workspaceName} (ID: {selectedWorkspace.id})
          </Typography>
        )}

        {/* File Upload Field */}
        <FormControl fullWidth sx={{ textAlign: isRTL ? 'right' : 'left' }}>
          <InputLabel shrink htmlFor="file-upload" sx={{ 
            left: isRTL ? 'auto' : '0', 
            right: isRTL ? '0' : 'auto' 
          }}>
            {t("fileLabel")}
          </InputLabel>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            id="file-upload"
            {...register("file", { required: t("fileRequired") })}
            onChange={handleFileChange}
            style={{ textAlign: isRTL ? 'right' : 'left' }}
          />
          {errors.file && (
            <Typography color="error">{errors.file.message}</Typography>
          )}
          {selectedFileName && (
            <Typography variant="caption" sx={{ mt: 1 }}>
              Selected: {selectedFileName}
            </Typography>
          )}
        </FormControl>

        {/* File Name Field */}
        <TextField
          label="File Name"
          variant="outlined"
          fullWidth
          {...register("fileName", { required: "File name is required" })}
          error={!!errors.fileName}
          helperText={errors.fileName ? errors.fileName.message : "Enter a name for your file"}
        />

        {/* Key Topics Field */}
        <TextField
          label={t("keyTopicsLabel")}
          variant="outlined"
          fullWidth
          {...register("keyTopics", { required: t("keyTopicsRequired") })}
          error={!!errors.keyTopics}
          helperText={errors.keyTopics ? errors.keyTopics.message : ""}
        />

        {/* Summary Length */}
        <FormControl component="fieldset">
          <FormLabel component="legend">{t("summaryLengthLabel")}</FormLabel>
          <Controller
            control={control}
            name="summaryLength"
            rules={{ required: t("summaryLengthRequired") as string }}
            render={({ field }) => (
              <RadioGroup row {...field}>
                <FormControlLabel
                  value="Short"
                  control={<Radio />}
                  label={t("summaryLengthShort")}
                />
                <FormControlLabel
                  value="Medium"
                  control={<Radio />}
                  label={t("summaryLengthMedium")}
                />
                <FormControlLabel
                  value="Long"
                  control={<Radio />}
                  label={t("summaryLengthLong")}
                />
              </RadioGroup>
            )}
          />
          {errors.summaryLength && (
            <Typography color="error">{errors.summaryLength.message}</Typography>
          )}
        </FormControl>

        {/* Preferred Format */}
        <FormControl fullWidth>
          <InputLabel id="preferred-format-label">
            {t("preferredFormatLabel")}
          </InputLabel>
          <Controller
            control={control}
            name="preferredFormat"
            rules={{ required: t("preferredFormatRequired") as string }}
            render={({ field }) => (
              <Select labelId="preferred-format-label" label={t("preferredFormatLabel")} {...field}>
                <MenuItem value="Bullet Points">
                  {t("preferredFormatBulletPoints")}
                </MenuItem>
                <MenuItem value="Paragraphs">
                  {t("preferredFormatParagraphs")}
                </MenuItem>
              </Select>
            )}
          />
          {errors.preferredFormat && (
            <Typography color="error">{errors.preferredFormat.message}</Typography>
          )}
        </FormControl>

        {/* Highlight Important Terms */}
        <FormControlLabel
          control={<Checkbox {...register("highlightTerms")} />}
          label={t("highlightTermsLabel")}
        />

        <Button type="submit" variant="contained" color="primary" fullWidth>
          {t("summarizeButton")}
        </Button>
      </Box>
    </StyledContainer>
  );
};

export default FileUploadForm;
