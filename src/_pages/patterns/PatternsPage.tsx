"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Box, 
  Button, 
  CircularProgress,
  Alert
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { usePatterns } from '@/hooks/usePatterns';
import { usePastExams } from '@/hooks/usePastExams';
import { useAuth } from '@/contexts/AuthContext';
import { Pattern } from '@/app/models/pattern';
import { useCurrentWorkspace } from '@/hooks/useCurrentWorkspace';
import { 
  PatternList, 
  PatternOverview, 
  QuestionFormats, 
  TopicDistribution,
  PatternGenerationDialog,
  StyledTabs,
  StyledTab
} from '@/components/patterns';

// Main Patterns Page component
const PatternsPage: React.FC = () => {
  const t = useTranslations('Patterns');
  const { userId, accessToken } = useAuth();
  const { currentWorkspace, workspaceId, loading: workspaceLoading, error: workspaceError } = useCurrentWorkspace();
  
  // State variables
  const [selectedPatternId, setSelectedPatternId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isPatternDialogOpen, setIsPatternDialogOpen] = useState<boolean>(false);
  const [patternGenerating, setPatternGenerating] = useState<boolean>(false);
  const [generatedPattern, setGeneratedPattern] = useState<Pattern | null>(null);
  
  // Refs to prevent duplicate fetches
  const lastFetchedWorkspaceId = useRef<string | null>(null);
  const isFetchingData = useRef<boolean>(false);
  
  // Custom hooks
  const { 
    workspacePatterns, 
    fetchWorkspacePatterns, 
    deletePattern,
    generatePattern,
    isLoading: patternsLoading,
    isGenerating: isPatternGenerating
  } = usePatterns(userId);
  const { 
    workspacePastExams, 
    fetchPastExams, 
    loading: examsLoading, 
    error: examsError 
  } = usePastExams(userId, accessToken);
  
  // Fetch data when workspaceId and userId are available
  useEffect(() => {
    // Skip if no workspaceId, no userId, or already fetching for this workspace
    if (!workspaceId || !userId || isFetchingData.current || workspaceId === lastFetchedWorkspaceId.current) {
      return;
    }
    
    const fetchData = async () => {
      try {
        isFetchingData.current = true;
        console.log("Fetching data with userId:", userId, "workspaceId:", workspaceId);
        
        // Fetch patterns first, then past exams
        await fetchWorkspacePatterns(workspaceId);
        await fetchPastExams(workspaceId);
        
        // Update the last fetched workspace ID
        lastFetchedWorkspaceId.current = workspaceId;
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        isFetchingData.current = false;
      }
    };
    
    fetchData();
    
    // Clean up function
    return () => {
      // If component unmounts during fetch, mark as not fetching
      isFetchingData.current = false;
    };
  }, [workspaceId, userId, fetchWorkspacePatterns, fetchPastExams]);

  // Set pattern generating from hook state
  useEffect(() => {
    setPatternGenerating(isPatternGenerating);
  }, [isPatternGenerating]);
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle pattern selection
  const handlePatternSelect = (patternId: string) => {
    setSelectedPatternId(patternId);
  };
  
  // Handle pattern deletion
  const handleDeletePattern = async (patternId: string) => {
    if (confirm(t('confirmDelete'))) {
      await deletePattern(patternId);
      if (selectedPatternId === patternId) {
        setSelectedPatternId('');
      }
    }
  };
  
  // Handle exam filter change
  const handleExamFilterChange = (examId: string) => {
    setSelectedExamId(examId);
  };

  // Open pattern generation dialog
  const handleOpenPatternDialog = () => {
    setGeneratedPattern(null);
    setIsPatternDialogOpen(true);
    
    // Ensure we have the latest past exams, but prevent duplicate fetches
    if (workspaceId && !examsLoading && !isFetchingData.current) {
      fetchPastExams(workspaceId);
    }
  };

  // Close pattern generation dialog
  const handleClosePatternDialog = () => {
    setIsPatternDialogOpen(false);
  };

  // Handle pattern generation
  const handleGeneratePattern = async (pastExamId: string) => {
    if (!workspaceId) return;
    
    setPatternGenerating(true);
    try {
      const pattern = await generatePattern(pastExamId, workspaceId);
      if (pattern) {
        setGeneratedPattern(pattern);
        // Select the new pattern
        setSelectedPatternId(pattern.id);
        // Refresh patterns after a short delay
        setTimeout(() => {
          fetchWorkspacePatterns(workspaceId);
        }, 500);
      }
    } catch (error) {
      console.error('Error generating pattern:', error);
    } finally {
      setPatternGenerating(false);
    }
  };
  
  // Handle manual refresh
  const handleManualRefresh = () => {
    if (workspaceId && !isFetchingData.current) {
      // Reset the lastFetchedWorkspaceId to force a refresh
      lastFetchedWorkspaceId.current = null;
      fetchWorkspacePatterns(workspaceId);
    }
  };
  
  // Filter patterns based on selected exam
  const patterns = workspaceId ? (workspacePatterns[workspaceId] || []) : [];
  const filteredPatterns = selectedExamId 
    ? patterns.filter(p => p.past_exam_id === selectedExamId)
    : patterns;
  
  // Get the currently selected pattern
  const selectedPattern = selectedPatternId 
    ? patterns.find(p => p.id === selectedPatternId)
    : patterns[0];
  
  // Get the past exams for this workspace
  const currentWorkspacePastExams = workspaceId ? (workspacePastExams[workspaceId] || []) : [];
  
  // Loading and error states
  const isLoading = workspaceLoading || patternsLoading || examsLoading;
  const hasError = workspaceError || examsError;
  
  // If no workspace is available, show a message
  if (!workspaceLoading && !currentWorkspace && workspaceError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          <Typography variant="body1">
            {t('errorWorkspace')}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {workspaceError}
          </Typography>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('pageTitle')} {currentWorkspace && `- ${currentWorkspace.name}`}
        </Typography>
        
        <Box>
          <Button 
            variant="contained"
            color="primary"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleOpenPatternDialog}
            sx={{ mr: 2 }}
            disabled={!workspaceId || isFetchingData.current}
          >
            {t('generatePattern')}
          </Button>
          <Button 
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleManualRefresh}
            disabled={!workspaceId || isFetchingData.current}
          >
            {t('refreshPatterns')}
          </Button>
        </Box>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : patterns.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body1">
            {t('noPatterns')}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {t('generatePatternsHint')}
          </Typography>
        </Alert>
      ) : (
        <Grid container spacing={4}>
          {/* Left panel - Pattern selection */}
          <Grid item xs={12} md={4}>
            <PatternList 
              patterns={patterns}
              filteredPatterns={filteredPatterns}
              selectedPatternId={selectedPatternId || patterns[0]?.id}
              pastExams={currentWorkspacePastExams}
              selectedExamId={selectedExamId}
              onPatternSelect={handlePatternSelect}
              onDeletePattern={handleDeletePattern}
              onExamFilterChange={handleExamFilterChange}
            />
          </Grid>
          
          {/* Right panel - Pattern details */}
          <Grid item xs={12} md={8}>
            {selectedPattern ? (
              <>
                <StyledTabs value={activeTab} onChange={handleTabChange}>
                  <StyledTab label={t('overview')} icon={<AutoAwesomeIcon />} iconPosition="start" />
                  <StyledTab label={t('questionFormats')} icon={<AutoAwesomeIcon />} iconPosition="start" />
                  <StyledTab label={t('topicDistribution')} icon={<AutoAwesomeIcon />} iconPosition="start" />
                </StyledTabs>
                
                {activeTab === 0 && <PatternOverview pattern={selectedPattern} />}
                {activeTab === 1 && <QuestionFormats pattern={selectedPattern} />}
                {activeTab === 2 && <TopicDistribution pattern={selectedPattern} />}
              </>
            ) : (
              <Alert severity="info">
                {t('selectPatternPrompt')}
              </Alert>
            )}
          </Grid>
        </Grid>
      )}

      {/* Pattern Generation Dialog */}
      <PatternGenerationDialog
        open={isPatternDialogOpen}
        loading={patternGenerating}
        pastExams={currentWorkspacePastExams}
        pastExamsLoading={examsLoading}
        selectedExamId={selectedExamId}
        generatedPattern={generatedPattern}
        onClose={handleClosePatternDialog}
        onExamSelect={setSelectedExamId}
        onGenerate={handleGeneratePattern}
      />
    </Container>
  );
};

export default PatternsPage; 