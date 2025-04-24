"use client";
import React, { useState } from "react";
import { Box, Typography, Grid, Divider } from "@mui/material";
import { Workspace } from "@/app/models/workspace";
import { FileMetadata } from "@/app/models/file";
import { Quiz } from "@/app/models/quiz";
import { Subject } from "@/app/models/subject";
import { PastExam } from "@/app/models/pastExam";
import { accent, secondary } from "../../../../colors";
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
import { useTranslations } from "next-intl";
import {
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
import styled from "@emotion/styled";
import DashboardHeader from './DashboardHeader';
import { useResponsive } from '@/hooks/useResponsive';

// Styled components
const FilesSectionsLayout = styled(Box)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 16px;
  height: 100%;
  
  @media (max-width: 600px) {
    flex-direction: column;
    width: 100%;
    align-items: center;
  }
`;

const SectionDivider = styled(Divider)`
  margin: 16px 0;
  background-color: rgba(0, 0, 0, 0.12);
`;

const VerticalDivider = styled(Divider)`
  height: 100%;
  margin: 0 16px;
  background-color: rgba(0, 0, 0, 0.38);
  width: 1px;
`;

const SectionColumn = styled(Box)`
  flex: 1;
  min-width: 45%;
`;

const MobileSectionContainer = styled(SectionContainer)`
  width: 100%;
  max-width: 100%;
  
  @media (max-width: 600px) {
    padding: 0 8px;
  }
`;

const CenteredSectionTitle = styled(SectionTitle)`
  text-align: center;
`;

const FileCardWrapper = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  
  @media (max-width: 600px) {
    padding: 0 4px;
  }
`;

const UploadCardContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 90%;
  height: 100%;
  position: relative;
  cursor: pointer;
  padding: 12px;
  border-radius: 8px;
  transition: background-color 0.2s, border-color 0.2s;
  border: 1px dashed ${accent.green.light};

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    border-color: ${accent.green.main};
  }
  
  @media (max-width: 600px) {
    padding: 8px;
    width: 100%;
    min-height: 100px;
  }
`;

const IconContainer = styled(Box)<{ color: string }>`
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: ${(props) => props.color};
`;

const UploadText = styled(Typography)`
  width: 100%;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.2;
  text-align: center;
`;

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
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subject: Subject) => void;
  onAddSubject: (subject: Partial<Subject>) => Promise<Subject | null>;
  onOpenQuiz?: (quiz: Quiz) => void;
  onDeleteQuiz: (quiz: Quiz) => void;
  onUploadPastExam?: () => void;
  onEditPastExam?: (pastExam: PastExam) => void;
  onDeletePastExam?: (pastExam: PastExam) => void;
  onMenuToggle: () => void;
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
  onMenuToggle,
}) => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState<boolean>(false);
  const t = useTranslations("Dashboard");
  const { isRTL } = useRTL();
  const { isMobile } = useResponsive();
  
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
          {t("selectWorkspacePrompt")}
        </EmptyStateText>
      </EmptyStateContainer>
    );
  }

  return (
    <>
      <DashboardHeader
        selectedWorkspace={selectedWorkspace}
        onMenuToggle={onMenuToggle}
        onGenerateSubjects={onGenerateSubjects}
        onGenerateQuiz={onGenerateQuiz}
        onUploadFile={onUploadFile}
        onUploadPastExam={onUploadPastExam}
      />

      <Box sx={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: isMobile ? 'center' : 'flex-start',
        mb: 1
      }}>
        <StyledTabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          isRTL={isRTL}
        >
          <StyledTab
            label={isMobile ? t("files") : t("tabs.files", {
              count: files.length + (pastExams?.length || 0),
            })}
          />
          <StyledTab 
            label={isMobile ? t("subjects") : t("tabs.subjects", { count: subjects.length })} 
          />
          <StyledTab 
            label={isMobile ? t("quizzes") : t("tabs.quizzes", { count: quizzes.length })} 
          />
          <StyledTab 
            label={isMobile ? t("flashcards") : t("tabs.flashcards")} 
          />
        </StyledTabs>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <ContentScrollArea>
        {/* Files Tab */}
        {tabValue === 0 && (
          <>
            {files?.length > 0 || pastExams?.length > 0 ? (
              <FilesSectionsLayout>
                {/* Study Materials Section */}
                <MobileSectionContainer>
                  <CenteredSectionTitle variant="h4">
                    {t("studyMaterials")}
                  </CenteredSectionTitle>
                  <Grid container spacing={isMobile ? 1 : 2}>
                    {files.map((file) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                        <FileCard
                          file={file}
                          onClick={() => onEditFile(file)}
                          onDelete={() => onDeleteFile(file.id)}
                          onEdit={() => onEditFile(file)}
                        />
                      </Grid>
                    ))}
                    {/* Add Study Material Card */}
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                      <FileCardWrapper>
                        <UploadCardContainer onClick={onUploadFile}>
                          <IconContainer color={accent.green.light}>
                            <CloudUploadIcon sx={{ fontSize: isMobile ? 40 : 60 }} />
                          </IconContainer>
                          <UploadText>{t("uploadFile")}</UploadText>
                        </UploadCardContainer>
                      </FileCardWrapper>
                    </Grid>
                  </Grid>
                </MobileSectionContainer>

                {/* Vertical Divider between sections - Show only on desktop */}
                {!isMobile && <VerticalDivider orientation="vertical" flexItem />}
                
                {/* Show horizontal divider on mobile */}
                {isMobile && <SectionDivider />}

                {/* Past Exams Section */}
                <MobileSectionContainer>
                  <CenteredSectionTitle variant="h4">
                    {t("pastExams")}
                  </CenteredSectionTitle>
                  <Grid container spacing={isMobile ? 1 : 2}>
                    {pastExams.map((pastExam) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={pastExam.id}>
                        <FileCard
                          file={{
                            id: pastExam.id,
                            name: pastExam.name,
                            created_at: pastExam.created_at,
                            url: pastExam.url || "",
                            file_type: "document",
                            workspace_id:
                              pastExam.workspace_id ||
                              selectedWorkspace?.id ||
                              "",
                            user_id: pastExam.user_id || userId,
                          }}
                          onClick={() => onEditPastExam?.(pastExam)}
                          onDelete={() => onDeletePastExam?.(pastExam)}
                          onEdit={() => onEditPastExam?.(pastExam)}
                        />
                      </Grid>
                    ))}
                    {/* Add Study Material Card */}
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                      <FileCardWrapper>
                        <UploadCardContainer onClick={onUploadPastExam}>
                          <IconContainer color={accent.green.light}>
                            <CloudUploadIcon sx={{ fontSize: isMobile ? 40 : 60 }} />
                          </IconContainer>
                          <UploadText>{t("uploadPastExam")}</UploadText>
                        </UploadCardContainer>
                      </FileCardWrapper>
                    </Grid>
                  </Grid>
                </MobileSectionContainer>
              </FilesSectionsLayout>
            ) : (
              <EmptyStateContainer>
                <EmptyStateText>{t("emptyStates.files")}</EmptyStateText>
                <ButtonGroup>
                  <PrimaryButton
                    onClick={onUploadFile}
                    startIcon={<CloudUploadIcon />}
                  >
                    {t("uploadFile")}
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={onUploadPastExam}
                    startIcon={<HistoryEduIcon />}
                  >
                    {t("uploadPastExam")}
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
              <Box sx={{ 
                position: "relative",
                width: "100%",
                padding: isMobile ? "0 8px" : 0
              }}>
                <Grid container spacing={isMobile ? 1 : 2} sx={{ width: '100%', margin: 0 }}>
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
                        <AddIcon
                          sx={{
                            fontSize: isMobile ? 30 : 40,
                            mb: 1,
                            color: accent.green.light,
                          }}
                        />
                      </AddButtonBox>
                    </BaseCard>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <EmptyStateContainer>
                <EmptyStateText>{t("emptyStates.subjects")}</EmptyStateText>
                <ButtonGroup>
                  <PrimaryButton
                    onClick={onGenerateSubjects}
                    startIcon={<CategoryIcon />}
                    sx={{ fontWeight: 'bold', boxShadow: 2, '&:hover': { boxShadow: 3 } }}
                  >
                    {t("generateSubjectsFromFiles")}
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={handleOpenSubjectDialog}
                    startIcon={<AddIcon />}
                  >
                    {t("addSubjectManually")}
                  </SecondaryButton>
                </ButtonGroup>
              </EmptyStateContainer>
            )}
          </>
        )}

        {/* Quizzes Tab */}
        {tabValue === 2 && (
          <>
            {quizzes?.length > 0 ? (
              <Box sx={{ 
                position: "relative",
                width: "100%",
                padding: isMobile ? "0 8px" : 0
              }}>
                <Grid container spacing={isMobile ? 1 : 2} sx={{ width: '100%', margin: 0 }}>
                  {quizzes.map((quiz) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={quiz.id}>
                      <QuizCard
                        quiz={quiz}
                        onClick={onOpenQuiz}
                        onDelete={onDeleteQuiz}
                      />
                    </Grid>
                  ))}
                  {/* Add Quiz Card */}
                  <Grid item xs={12} sm={6} md={4} lg={3}>
                    <BaseCard>
                      <AddButtonBox onClick={onGenerateQuiz}>
                        <AddIcon
                          sx={{
                            fontSize: isMobile ? 30 : 40,
                            mb: 1,
                            color: accent.green.light,
                          }}
                        />
                      </AddButtonBox>
                    </BaseCard>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <EmptyStateContainer>
                <EmptyStateText>{t("emptyStates.quizzes")}</EmptyStateText>
                <PrimaryButton
                  onClick={onGenerateQuiz}
                  startIcon={<QuizIcon />}
                >
                  {t("generateQuiz")}
                </PrimaryButton>
              </EmptyStateContainer>
            )}
          </>
        )}

        {/* Flashcards Tab */}
        {tabValue === 3 && (
          <>
            {selectedWorkspace && (
              <Box sx={{ 
                width: '100%',
                padding: isMobile ? '0 8px' : 0
              }}>
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
