"use client";
import React, { useState } from "react";
import { Box, Typography, Grid, Divider } from "@mui/material";
import { Workspace } from "@/app/models/workspace";
import { FileMetadata } from "@/app/models/file";
import { Quiz } from "@/app/models/quiz";
import { Subject } from "@/app/models/subject";
import { PastExam } from "@/app/models/pastExam";
import FileCard from "./FileCard";
import QuizCard from "./QuizCard";
import SubjectCard from "./SubjectCard";
import PastExamCard from "./PastExamCard";
import SubjectAddDialog from "./SubjectAddDialog";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import QuizIcon from "@mui/icons-material/Quiz";
import CategoryIcon from "@mui/icons-material/Category";
import AddIcon from "@mui/icons-material/Add";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import {
  HeaderContainer,
  WorkspaceTitle,
  WorkspaceDescription,
  ButtonGroup,
  PrimaryButton,
  SecondaryButton,
  StyledTabs,
  StyledTab,
  ContentScrollArea,
  EmptyStateContainer,
  EmptyStateText,
  AddButtonBox,
} from "./DashboardStyledComponents";

interface FilesContainerProps {
  selectedWorkspace: Workspace | null;
  files: FileMetadata[];
  quizzes?: Quiz[];
  subjects?: Subject[];
  pastExams?: PastExam[];
  userId: string;
  onDeleteFile: (fileId: string) => void;
  onEditFile: (file: FileMetadata) => void;
  onUploadFile: () => void;
  onGenerateQuiz: () => void;
  onGenerateSubjects: () => void;
  onEditSubject?: (subject: Subject) => void;
  onDeleteSubject?: (subject: Subject) => void;
  onAddSubject?: (subject: Partial<Subject>) => Promise<Subject | null>;
  onOpenQuiz?: (quiz: Quiz) => void;
  onDeleteQuiz?: (quiz: Quiz) => void;
  onUploadPastExam?: () => void;
  onEditPastExam?: (pastExam: PastExam) => void;
  onDeletePastExam?: (pastExam: PastExam) => void;
}

const FilesContainer: React.FC<FilesContainerProps> = ({
  selectedWorkspace,
  files,
  quizzes = [],
  subjects = [],
  pastExams = [],
  userId,
  onDeleteFile,
  onEditFile,
  onUploadFile,
  onGenerateQuiz,
  onGenerateSubjects,
  onEditSubject,
  onDeleteSubject,
  onAddSubject,
  onOpenQuiz = () => {},
  onDeleteQuiz,
  onUploadPastExam = () => {},
  onEditPastExam,
  onDeletePastExam,
}) => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState<boolean>(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenSubjectDialog = () => {
    setSubjectDialogOpen(true);
  };

  const handleCloseSubjectDialog = () => {
    setSubjectDialogOpen(false);
  };

  if (!selectedWorkspace) {
    return (
      <EmptyStateContainer>
        <EmptyStateText variant="h6">
          Select a workspace to view files
        </EmptyStateText>
      </EmptyStateContainer>
    );
  }

  return (
    <>
      <HeaderContainer>
        <div>
          <WorkspaceTitle variant="h5">{selectedWorkspace.name}</WorkspaceTitle>
          {selectedWorkspace.description && (
            <WorkspaceDescription variant="body1">
              {selectedWorkspace.description}
            </WorkspaceDescription>
          )}
        </div>
        <ButtonGroup>
          <SecondaryButton
            onClick={onGenerateSubjects}
            startIcon={<CategoryIcon />}
          >
            Generate Subjects
          </SecondaryButton>
          <SecondaryButton onClick={onGenerateQuiz} startIcon={<QuizIcon />}>
            Generate Quiz
          </SecondaryButton>
          <SecondaryButton onClick={onUploadFile} startIcon={<CloudUploadIcon />}>
            Upload File
          </SecondaryButton>
          <SecondaryButton onClick={onUploadPastExam} startIcon={<HistoryEduIcon />}>
            Upload Past Exam
          </SecondaryButton>
        </ButtonGroup>
      </HeaderContainer>

      <StyledTabs
        value={tabValue}
        onChange={handleTabChange}
        variant="fullWidth"
      >
        <StyledTab label={`Files (${files.length})`} />
        <StyledTab label={`Subjects (${subjects.length})`} />
        <StyledTab label={`Past Exams (${pastExams.length})`} />
        <StyledTab label={`Quizzes (${quizzes.length})`} />
      </StyledTabs>

      <Divider sx={{ mb: 3 }} />

      <ContentScrollArea>
        {/* Files Tab */}
        {tabValue === 0 && (
          <>
            {files?.length > 0 ? (
              <Grid container spacing={2}>
                {files.map((file) => (
                  <Grid item xs={12} sm={6} md={4} key={file.id}>
                    <FileCard
                      file={file}
                      onClick={() => onEditFile(file)}
                      onDelete={() => onDeleteFile(file.id)}
                      onEdit={() => onEditFile(file)}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <EmptyStateContainer>
                <EmptyStateText>
                  No files in this workspace yet. Click "Upload File" to add
                  files.
                </EmptyStateText>
                <PrimaryButton
                  onClick={onUploadFile}
                  startIcon={<CloudUploadIcon />}
                >
                  Upload File
                </PrimaryButton>
              </EmptyStateContainer>
            )}
          </>
        )}

        {/* Subjects Tab */}
        {tabValue === 1 && (
          <>
            {subjects?.length > 0 ? (
              <Box sx={{ position: "relative", minHeight: "300px" }}>
                <Grid container spacing={2}>
                  {subjects.map((subject) => (
                    <Grid item xs={12} sm={6} md={4} key={subject.id}>
                      <SubjectCard
                        subject={subject}
                        onClick={() => {}}
                        onEdit={onEditSubject}
                        onDelete={onDeleteSubject}
                      />
                    </Grid>
                  ))}
                  {/* Add Subject Card */}
                  <Grid item xs={12} sm={6} md={4}>
                    <AddButtonBox onClick={handleOpenSubjectDialog}>
                      <AddIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                      <Typography color="primary" align="center">
                        Add New Subject
                      </Typography>
                    </AddButtonBox>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <EmptyStateContainer>
                <EmptyStateText>
                  No subjects in this workspace yet.
                </EmptyStateText>
                <ButtonGroup>
                  <SecondaryButton
                    onClick={onGenerateSubjects}
                    startIcon={<CategoryIcon />}
                  >
                    Generate Subjects from Files
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={handleOpenSubjectDialog}
                    startIcon={<AddIcon />}
                  >
                    Add Subject Manually
                  </PrimaryButton>
                </ButtonGroup>
              </EmptyStateContainer>
            )}
          </>
        )}

        {/* Past Exams Tab */}
        {tabValue === 2 && (
          <>
            {pastExams?.length > 0 ? (
              <Grid container spacing={2}>
                {pastExams.map((pastExam) => (
                  <Grid item xs={12} sm={6} md={4} key={pastExam.id}>
                    <PastExamCard
                      pastExam={pastExam}
                      onClick={onEditPastExam}
                      onDelete={onDeletePastExam}
                      onEdit={onEditPastExam}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <EmptyStateContainer>
                <EmptyStateText>
                  No past exams in this workspace yet. Upload past exam files to
                  create a reference library.
                </EmptyStateText>
                <PrimaryButton
                  onClick={onUploadPastExam}
                  startIcon={<HistoryEduIcon />}
                >
                  Upload Past Exam
                </PrimaryButton>
              </EmptyStateContainer>
            )}
          </>
        )}

        {/* Quizzes Tab */}
        {tabValue === 3 && (
          <>
            {quizzes?.length > 0 ? (
              <Grid container spacing={2}>
                {quizzes.map((quiz) => (
                  <Grid item xs={12} sm={6} md={4} key={quiz.id}>
                    <QuizCard
                      quiz={quiz}
                      onClick={onOpenQuiz}
                      onDelete={onDeleteQuiz}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <EmptyStateContainer>
                <EmptyStateText>
                  No quizzes in this workspace yet.
                </EmptyStateText>
                <PrimaryButton
                  onClick={onGenerateQuiz}
                  startIcon={<QuizIcon />}
                >
                  Generate Quiz
                </PrimaryButton>
              </EmptyStateContainer>
            )}
          </>
        )}
      </ContentScrollArea>

      {/* Subject Add Dialog */}
      <SubjectAddDialog
        open={subjectDialogOpen}
        onClose={handleCloseSubjectDialog}
        onAdd={onAddSubject}
        userId={userId}
        workspaceId={selectedWorkspace.id}
      />
    </>
  );
};

export default FilesContainer;
