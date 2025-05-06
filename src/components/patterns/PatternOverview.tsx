import React from 'react';
import { 
  CardHeader, 
  CardContent, 
  Typography, 
  Divider, 
  Grid, 
  Box, 
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  ErrorOutline as ErrorIcon,
  WarningAmber as WarningIcon,
  BugReport as BugIcon
} from '@mui/icons-material';
import { Pattern } from '@/app/models/pattern';
import { 
  PatternCard, 
  CardTitle, 
  PatternMetric, 
  PatternMetricLabel, 
  PatternMetricValue
} from './PatternStyled';
import { useTranslations } from 'next-intl';
import * as colors from '../../../colors';

interface PatternOverviewProps {
  pattern: Pattern;
}

const PatternOverview: React.FC<PatternOverviewProps> = ({ pattern }) => {
  const t = useTranslations('Patterns');

  return (
    <PatternCard>
      <CardHeader
        title={<CardTitle>{pattern.name}</CardTitle>}
        subheader={t('lastUpdated', { date: new Date(pattern.updated_at).toLocaleDateString() })}
        action={
          <Chip 
            label={t('confidence', { value: Math.round(pattern.confidence_score * 100) })} 
            color={pattern.confidence_score > 0.7 ? 'success' : pattern.confidence_score > 0.5 ? 'primary' : 'default'}
          />
        }
      />
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t('examStructure')}
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <PatternMetric>
              <PatternMetricLabel>{t('difficultyProgression')}</PatternMetricLabel>
              <PatternMetricValue>
                <Typography variant="body2">
                  {t('difficultyFlow', { 
                    beginning: pattern.pattern_data.exam_structure.difficulty_progression.beginning,
                    middle: pattern.pattern_data.exam_structure.difficulty_progression.middle,
                    end: pattern.pattern_data.exam_structure.difficulty_progression.end
                  })}
                </Typography>
              </PatternMetricValue>
            </PatternMetric>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          {t('keyInsights')}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('highValueTopics')}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {pattern.pattern_data.key_insights.high_value_topics.map((topic, idx) => (
              <Chip key={idx} label={topic} size="small" color="primary" />
            ))}
          </Box>
        </Box>
        
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {t('commonKeywords')}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {pattern.pattern_data.key_insights.common_keywords.map((keyword, idx) => (
              <Chip 
                key={idx} 
                label={keyword.word} 
                size="small" 
                variant="outlined" 
                sx={{ 
                  backgroundColor: `rgba(33, 150, 243, ${Math.min(keyword.importance * 0.8, 0.2)})`
                }} 
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom color="error">
          {t('confusionPoints')}
        </Typography>
        
        {pattern.pattern_data.confusion_points.misleading_questions.length > 0 && (
          <List dense>
            <Typography variant="subtitle2" color="error">
              {t('misleadingQuestions')}
            </Typography>
            {pattern.pattern_data.confusion_points.misleading_questions.map((point, idx) => (
              <ListItem key={idx}>
                <ListItemIcon>
                  <ErrorIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary={point} />
              </ListItem>
            ))}
          </List>
        )}
        
        {pattern.pattern_data.confusion_points.watch_out_for.length > 0 && (
          <List dense>
            <Typography variant="subtitle2" color="warning.main">
              {t('watchOutFor')}
            </Typography>
            {pattern.pattern_data.confusion_points.watch_out_for.map((point, idx) => (
              <ListItem key={idx}>
                <ListItemIcon>
                  <WarningIcon fontSize="small" color="warning" />
                </ListItemIcon>
                <ListItemText primary={point} />
              </ListItem>
            ))}
          </List>
        )}
        
        {pattern.pattern_data.confusion_points.common_mistakes.length > 0 && (
          <List dense>
            <Typography variant="subtitle2" color="info.main">
              {t('commonMistakes')}
            </Typography>
            {pattern.pattern_data.confusion_points.common_mistakes.map((point, idx) => (
              <ListItem key={idx}>
                <ListItemIcon>
                  <BugIcon fontSize="small" color="info" />
                </ListItemIcon>
                <ListItemText primary={point} />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </PatternCard>
  );
};

export default PatternOverview; 