"use client";

import React from "react";
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

interface SummarizationFormInputs {
  file: FileList;
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

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SummarizationFormInputs>({
    defaultValues: {
      summaryLength: "Medium",
      preferredFormat: "Paragraphs",
      highlightTerms: false,
    },
  });

  const onSubmit: SubmitHandler<SummarizationFormInputs> = async (data) => {
    console.log("Form Data Submitted:", data);

    // Extract the file from the FileList
    const fileList = data.file;
    if (!fileList || fileList.length === 0) {
      console.error("No file selected");
      return;
    }
    const file = fileList[0];

    // Hardcoded user and workspace IDs for demonstration.
    // Replace these with actual values from your authentication or form state.
    const userId = "user123";
    const workspaceId = "workspace123";

    try {
      const uploadResult = await uploadFileClient(userId, workspaceId, file);
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
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          {t("uploadFileTitle")}
        </Typography>

        {/* File Upload Field */}
        <FormControl fullWidth>
          <InputLabel shrink htmlFor="file-upload">
            {t("fileLabel")}
          </InputLabel>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            id="file-upload"
            {...register("file", { required: t("fileRequired") })}
          />
          {errors.file && (
            <Typography color="error">{errors.file.message}</Typography>
          )}
        </FormControl>

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
