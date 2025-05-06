import React from 'react';
import { 
  CardHeader, 
  CardContent, 
  Typography, 
  Divider, 
  Box, 
  Grid, 
  Chip 
} from '@mui/material';
import { Pattern } from '@/app/models/pattern';
import { PatternCard, CardTitle } from './PatternStyled';
import { TopicDistributionChart } from './PatternCharts';
import { useTranslations } from 'next-intl';
import * as colors from '../../../colors';

interface TopicDistributionProps {
  pattern: Pattern;
}

const TopicDistribution: React.FC<TopicDistributionProps> = ({ pattern }) => {
  const t = useTranslations('Patterns');

  return (
    <PatternCard>
      <CardHeader
        title={<CardTitle>{t('topicDistribution')}</CardTitle>}
        subheader={t('topicDistributionDescription')}
      />
      <CardContent>
        <TopicDistributionChart pattern={pattern} />
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          {t('suggestedTimeAllocation')}
        </Typography>
        
        <Grid container spacing={2}>
          {Object.entries(pattern.pattern_data.exam_structure.time_allocation_suggestions)
            .sort(([_, a], [__, b]) => b - a)
            .map(([topic, minutes]) => (
              <Grid item xs={12} sm={6} md={4} key={topic}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: '8px', 
                  border: `1px solid ${colors.border.light}`,
                  height: '100%'
                }}>
                  <Typography variant="subtitle2" gutterBottom noWrap>
                    {topic}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Typography variant="h5" color="primary">
                      {Math.round(minutes)}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {t('minutes')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          {t('recurringConcepts')}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {pattern.pattern_data.key_insights.recurring_concepts.map((concept, idx) => (
            <Chip 
              key={idx} 
              label={`${concept.concept} (${Math.round(concept.frequency * 100)}%)`} 
              size="small" 
              variant="outlined" 
            />
          ))}
        </Box>
      </CardContent>
    </PatternCard>
  );
};

export default TopicDistribution; 