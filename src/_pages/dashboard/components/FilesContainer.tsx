"use client";
import React, { useState } from "react";
import { Box, Typography, Grid, Divider } from "@mui/material";
import { Workspace } from "@/app/models/workspace";
import { FileMetadata } from "@/app/models/file";
import { Quiz } from "@/app/models/quiz";
import { Subject } from "@/app/models/subject";
import { PastExam } from "@/app/models/pastExam";
import { accent, secondary } from '../../../../colors';
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
import { useTranslations } from 'next-intl';
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
  BaseCard,
  SectionTitle,
  SectionContainer,
} from "./DashboardStyledComponents";
import FlashcardsTab from "@/components/flashcards/FlashcardsTab";
import { useRTL } from "@/contexts/RTLContext";
import ActionMenu from "./ActionMenu";

interface FilesContainerProps {
  selectedWorkspace?: Workspace;
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
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subject: Subject) => void;
  onAddSubject: (subject: Partial<Subject>) => Promise<Subject | null>;
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
  const t = useTranslations('Dashboard');
  const { isRTL } = useRTL();
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
          {t('selectWorkspacePrompt')}
        </EmptyStateText>
      </EmptyStateContainer>
    );
  }

  return (
    <>
      <HeaderContainer
        isRTL={isRTL}
      >
        <div>
          <WorkspaceTitle variant="h5">{selectedWorkspace.name}</WorkspaceTitle>
          {selectedWorkspace.description && (
            <WorkspaceDescription variant="body1">
              {selectedWorkspace.description}
            </WorkspaceDescription>
          )}
        </div>
        <ActionMenu
          onGenerateSubjects={onGenerateSubjects}
          onGenerateQuiz={onGenerateQuiz}
          onUploadFile={onUploadFile}
          onUploadPastExam={onUploadPastExam}
        />
      </HeaderContainer>

      <StyledTabs
        value={tabValue}
        onChange={handleTabChange}
        variant="fullWidth"
        isRTL={isRTL}
      >
        <StyledTab label={t('tabs.files', { count: files.length + (pastExams?.length || 0) })} />
        <StyledTab label={t('tabs.subjects', { count: subjects.length })} />
        <StyledTab label={t('tabs.quizzes', { count: quizzes.length })} />
        <StyledTab label={t('tabs.flashcards')} />
      </StyledTabs>

      <Divider sx={{ mb: 3 }} />

      <ContentScrollArea>
        {/* Files Tab */}
        {tabValue === 0 && (
          <>
            {(files?.length > 0 || pastExams?.length > 0) ? (
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                {/* Study Materials Section */}
                <SectionContainer sx={{ flex: 1, minWidth: '45%' }}>
                  <SectionTitle variant="h6">
                    {t('studyMaterials')}
                  </SectionTitle>
                  <Grid container spacing={2}>
                    {files.map((file) => (
                      <Grid item xs={12} sm={6} md={6} lg={4} key={file.id}>
                        <FileCard
                          file={file}
                          onClick={() => onEditFile(file)}
                          onDelete={() => onDeleteFile(file.id)}
                          onEdit={() => onEditFile(file)}
                        />
                      </Grid>
                    ))}
                    {/* Add Study Material Card */}
                    <Grid item xs={12} sm={6} md={6} lg={4}>
                      <BaseCard>
                        <AddButtonBox onClick={onUploadFile}>
                          <CloudUploadIcon sx={{ fontSize: 32, mb: 1, color: accent.green.light }} />
                          <Typography variant="subtitle2" color="text.secondary">
                            {t('uploadFile')}
                          </Typography>
                        </AddButtonBox>
                      </BaseCard>
                    </Grid>
                  </Grid>
                </SectionContainer>

                {/* Past Exams Section */}
                <SectionContainer sx={{ flex: 1, minWidth: '45%' }}>
                  <SectionTitle variant="h6">
                    {t('pastExams')}
                  </SectionTitle>
                  <Grid container spacing={2}>
                    {pastExams.map((pastExam) => (
                      <Grid item xs={12} sm={6} md={6} lg={4} key={pastExam.id}>
                        <PastExamCard
                          pastExam={pastExam}
                          onClick={onEditPastExam}
                          onDelete={onDeletePastExam}
                          onEdit={onEditPastExam}
                        />
                      </Grid>
                    ))}
                    {/* Add Past Exam Card */}
                    <Grid item xs={12} sm={6} md={6} lg={4}>
                      <BaseCard>
                        <AddButtonBox onClick={onUploadPastExam}>
                          <HistoryEduIcon sx={{ fontSize: 32, mb: 1, color: secondary.light }} />
                          <Typography variant="subtitle2" color="text.secondary">
                            {t('uploadPastExam')}
                          </Typography>
                        </AddButtonBox>
                      </BaseCard>
                    </Grid>
                  </Grid>
                </SectionContainer>
              </Box>
            ) : (
              <EmptyStateContainer>
                <EmptyStateText>
                  {t('emptyStates.files')}
                </EmptyStateText>
                <ButtonGroup>
                  <PrimaryButton
                    onClick={onUploadFile}
                    startIcon={<CloudUploadIcon />}
                  >
                    {t('uploadFile')}
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={onUploadPastExam}
                    startIcon={<HistoryEduIcon />}
                  >
                    {t('uploadPastExam')}
                  </SecondaryButton>
                </ButtonGroup>
              </EmptyStateContainer>
            )}
          </>
        )}

        {/* Subjects Tab */}
        {tabValue === 1 && (
          <>
            {subjects?.length > 0 ? (
              <Box sx={{ position: "relative" }}>
                <Grid container spacing={2}>
                  {subjects.map((subject) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={subject.id}>
                      <SubjectCard
                        subject={subject}
                        onClick={() => {}}
                        onEdit={onEditSubject}
                        onDelete={onDeleteSubject}
                      />
                    </Grid>
                  ))}
                  {/* Add Subject Card */}
                  <Grid item xs={12} sm={6} md={4} lg={3}>
                    <BaseCard>
                      <AddButtonBox onClick={handleOpenSubjectDialog}>
                        <AddIcon sx={{ fontSize: 40, mb: 1, color: accent.green.light }} />
                      </AddButtonBox>
                    </BaseCard>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <EmptyStateContainer>
                <EmptyStateText>
                  {t('emptyStates.subjects')}
                </EmptyStateText>
                <ButtonGroup>
                  <SecondaryButton
                    onClick={onGenerateSubjects}
                    startIcon={<CategoryIcon />}
                  >
                    {t('generateSubjectsFromFiles')}
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={handleOpenSubjectDialog}
                    startIcon={<AddIcon />}
                  >
                    {t('addSubjectManually')}
                  </PrimaryButton>
                </ButtonGroup>
              </EmptyStateContainer>
            )}
          </>
        )}

        {/* Quizzes Tab */}
        {tabValue === 2 && (
          <>
            {quizzes?.length > 0 ? (
              <Grid container spacing={2}>
                {quizzes.map((quiz) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={quiz.id}>
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
                  {t('emptyStates.quizzes')}
                </EmptyStateText>
                <PrimaryButton
                  onClick={onGenerateQuiz}
                  startIcon={<QuizIcon />}
                >
                  {t('generateQuiz')}
                </PrimaryButton>
              </EmptyStateContainer>
            )}
          </>
        )}

        {/* Flashcards Tab */}
        {tabValue === 3 && (
          <>
            {selectedWorkspace && (
              <Box>
                <FlashcardsTab workspace={selectedWorkspace} />
              </Box>
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
