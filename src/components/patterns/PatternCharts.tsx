import React from 'react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  RadarChart, 
  Radar,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { Pattern } from '@/app/models/pattern';
import { ChartContainer } from './PatternStyled';
import * as colors from '../../../colors';

interface PatternChartProps {
  pattern: Pattern;
}

// Component to render question format distribution chart
export const QuestionFormatChart: React.FC<PatternChartProps> = ({ pattern }) => {
  const formatData = Object.entries(pattern.pattern_data.question_formats)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key.replace(/_/g, ' '),
      value: Math.round(value)
    }));

  const COLORS = [
    colors.primary.main, 
    colors.secondary.main, 
    '#4caf50', // Using direct color values instead of colors.success.main
    '#ff9800', // Using direct color values instead of colors.warning.main
    '#f44336'  // Using direct color values instead of colors.error.main
  ];

  return (
    <ChartContainer>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={formatData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}%`}
          >
            {formatData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip formatter={(value) => `${value}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Component to render topic distribution chart
export const TopicDistributionChart: React.FC<PatternChartProps> = ({ pattern }) => {
  const topicData = Object.entries(pattern.pattern_data.topic_distribution)
    .map(([key, value]) => ({
      name: key.length > 15 ? key.substring(0, 15) + '...' : key,
      frequency: Math.round(value.frequency),
      importance: Math.round(value.importance_score * 100) / 100
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  return (
    <ChartContainer>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={topicData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <RechartsTooltip />
          <Legend />
          <Bar dataKey="frequency" name="Frequency (%)" fill={colors.primary.main} />
          <Bar dataKey="importance" name="Importance Score" fill={colors.secondary.main} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Component to render exam confidence metrics
export const ConfidenceMetricsChart: React.FC<PatternChartProps> = ({ pattern }) => {
  const metricsData = [
    { 
      subject: 'Overall Predictability', 
      value: Math.round(pattern.pattern_data.confidence_metrics.overall_exam_predictability * 100) 
    },
    { 
      subject: 'Format Prediction', 
      value: Math.round(pattern.pattern_data.confidence_metrics.format_prediction_confidence * 100) 
    },
    { 
      subject: 'Question Formats', 
      value: Math.round(pattern.confidence_score * 100) 
    }
  ];

  return (
    <ChartContainer>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart outerRadius={90} data={metricsData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name="Confidence"
            dataKey="value"
            stroke={colors.primary.main}
            fill={colors.primary.transparent}
            fillOpacity={0.6}
          />
          <RechartsTooltip formatter={(value) => `${value}%`} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}; 