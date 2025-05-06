import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  LinearProgress, 
  Alert,
  CircularProgress
} from '@mui/material';
import { AutoAwesome as AutoAwesomeIcon } from '@mui/icons-material';
import { Pattern } from '@/app/models/pattern';
import { PastExam } from '@/app/models/pastExam';
import { useTranslations } from 'next-intl';
import * as colors from '../../../colors';

interface PatternGenerationDialogProps {
  open: boolean;
  loading: boolean;
  pastExams: PastExam[];
  pastExamsLoading?: boolean;
  selectedExamId: string;
  generatedPattern: Pattern | null;
  onClose: () => void;
  onExamSelect: (examId: string) => void;
  onGenerate: (examId: string) => void;
}

const PatternGenerationDialog: React.FC<PatternGenerationDialogProps> = ({
  open,
  loading,
  pastExams,
  pastExamsLoading = false,
  selectedExamId,
  generatedPattern,
  onClose,
  onExamSelect,
  onGenerate
}) => {
  const t = useTranslations('Patterns');

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AutoAwesomeIcon sx={{ mr: 1, color: colors.primary.main }} />
          <Typography variant="h6">{t('generatePatternDialogTitle')}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {generatedPattern ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <AutoAwesomeIcon color="success" sx={{ fontSize: 56 }} />
            </Box>
            <Typography variant="h6" color="success.main" gutterBottom>
              {t('patternGeneratedSuccess')}
            </Typography>
            <Typography variant="body1">
              {t('patternGeneratedDescription')}
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {t('selectPastExamDescription')}
            </Typography>
            
            {pastExamsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={40} />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  {t('loadingPastExams')}
                </Typography>
              </Box>
            ) : pastExams.length === 0 ? (
              <Alert severity="info">
                {t('noPastExams')}
              </Alert>
            ) : (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="past-exam-select-label">{t('selectPastExam')}</InputLabel>
                <Select
                  labelId="past-exam-select-label"
                  value={selectedExamId}
                  onChange={(e) => onExamSelect(e.target.value as string)}
                  label={t('selectPastExam')}
                >
                  <MenuItem value="" disabled><em>{t('selectExamPrompt')}</em></MenuItem>
                  {pastExams.map(exam => (
                    <MenuItem key={exam.id} value={exam.id}>
                      {exam.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {loading && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress />
                <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                  {t('generatingPatternProgress')}
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {generatedPattern ? t('close') : t('cancel')}
        </Button>
        {!generatedPattern && selectedExamId && !pastExamsLoading && (
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => onGenerate(selectedExamId)}
            disabled={loading || !selectedExamId}
          >
            {loading ? t('generatingPattern') : t('generatePattern')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PatternGenerationDialog; 