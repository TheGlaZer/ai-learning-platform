import React from 'react';
import { 
  CardHeader, 
  CardContent, 
  Typography, 
  Divider, 
  Box, 
  List, 
  ListItem, 
  ListItemText 
} from '@mui/material';
import { Pattern } from '@/app/models/pattern';
import { PatternCard, CardTitle } from './PatternStyled';
import { QuestionFormatChart } from './PatternCharts';
import { useTranslations } from 'next-intl';

interface QuestionFormatsProps {
  pattern: Pattern;
}

const QuestionFormats: React.FC<QuestionFormatsProps> = ({ pattern }) => {
  const t = useTranslations('Patterns');

  return (
    <PatternCard>
      <CardHeader
        title={<CardTitle>{t('questionFormats')}</CardTitle>}
        subheader={t('questionFormatsDescription')}
      />
      <CardContent>
        <QuestionFormatChart pattern={pattern} />
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          {t('formatTips')}
        </Typography>
        
        {Object.entries(pattern.pattern_data.key_insights.format_specific_tips).map(([format, tips]) => (
          <Box key={format} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {format.replace(/_/g, ' ')}
            </Typography>
            <List dense>
              {tips.map((tip, idx) => (
                <ListItem key={idx}>
                  <ListItemText primary={tip} />
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </CardContent>
    </PatternCard>
  );
};

export default QuestionFormats; 