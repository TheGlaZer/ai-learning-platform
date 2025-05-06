import React from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  Chip, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  IconButton 
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Pattern } from '@/app/models/pattern';
import { PastExam } from '@/app/models/pastExam';
import { useTranslations } from 'next-intl';
import * as colors from '../../../colors';

interface PatternListProps {
  patterns: Pattern[];
  filteredPatterns: Pattern[];
  selectedPatternId: string;
  pastExams: PastExam[];
  selectedExamId: string;
  onPatternSelect: (patternId: string) => void;
  onDeletePattern: (patternId: string) => void;
  onExamFilterChange: (examId: string) => void;
}

const PatternList: React.FC<PatternListProps> = ({
  patterns,
  filteredPatterns,
  selectedPatternId,
  pastExams,
  selectedExamId,
  onPatternSelect,
  onDeletePattern,
  onExamFilterChange
}) => {
  const t = useTranslations('Patterns');

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{t('availablePatterns')}</Typography>
        <Chip 
          label={`${patterns.length} ${t('patterns')}`} 
          color="primary" 
          variant="outlined" 
        />
      </Box>
      
      {pastExams.length > 1 && (
        <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
          <InputLabel>{t('filterByExam')}</InputLabel>
          <Select
            value={selectedExamId}
            onChange={(e) => onExamFilterChange(e.target.value as string)}
            label={t('filterByExam')}
          >
            <MenuItem value="">{t('allExams')}</MenuItem>
            {pastExams.map(exam => (
              <MenuItem key={exam.id} value={exam.id}>
                {exam.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      
      <List sx={{ maxHeight: '500px', overflow: 'auto' }}>
        {filteredPatterns.map(pattern => (
          <ListItem 
            key={pattern.id} 
            disablePadding
          >
            <ListItemButton
              selected={selectedPatternId === pattern.id || (!selectedPatternId && pattern.id === patterns[0]?.id)}
              onClick={() => onPatternSelect(pattern.id)}
              sx={{ 
                borderRadius: '8px',
                mb: 1,
                '&.Mui-selected': {
                  backgroundColor: colors.primary.transparent,
                  '&:hover': {
                    backgroundColor: colors.primary.transparent,
                  }
                }
              }}
            >
              <ListItemText 
                primary={pattern.name} 
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Chip 
                      size="small" 
                      label={`${Math.round(pattern.confidence_score * 100)}%`}
                      color={pattern.confidence_score > 0.7 ? 'success' : pattern.confidence_score > 0.5 ? 'primary' : 'default'}
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      size="small" 
                      label={t('usedTimes', { count: pattern.usage_count })}
                      variant="outlined"
                    />
                  </Box>
                }
              />
              <IconButton 
                size="small" 
                color="error"
                onClick={(e) => { 
                  e.stopPropagation();
                  onDeletePattern(pattern.id);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default PatternList; 