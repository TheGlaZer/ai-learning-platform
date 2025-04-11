import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { Tooltip } from '@mui/material';

interface PercentageSliderProps {
  label: string;
  subTitle?: string;
  percentage: number;
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
  detail?: string;
  tooltip?: string;
}

type ColorType = 'green' | 'blue' | 'yellow' | 'red' | 'purple';

interface ColorProps {
  $color: ColorType;
}

const SliderContainer = styled.div<ColorProps>`
  padding: 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  
  ${({ $color }) => {
    switch ($color) {
      case 'green': return css`background-color: #f0fdf4;`;
      case 'blue': return css`background-color: #eff6ff;`;
      case 'yellow': return css`background-color: #fefce8;`;
      case 'red': return css`background-color: #fef2f2;`;
      case 'purple': return css`background-color: #faf5ff;`;
      default: return css`background-color: #eff6ff;`;
    }
  }}
  
  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

const LabelContainer = styled.div``;

const Label = styled.span`
  font-weight: 500;
`;

const SubTitle = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
`;

const PercentageValue = styled.span<ColorProps>`
  font-weight: 700;
  
  ${({ $color }) => {
    switch ($color) {
      case 'green': return css`color: #15803d;`;
      case 'blue': return css`color: #1d4ed8;`;
      case 'yellow': return css`color: #a16207;`;
      case 'red': return css`color: #b91c1c;`;
      case 'purple': return css`color: #7e22ce;`;
      default: return css`color: #1d4ed8;`;
    }
  }}
`;

const SliderTrack = styled.div`
  width: 100%;
  background-color: #e5e7eb;
  border-radius: 9999px;
  height: 1rem;
  margin-top: 0.5rem;
`;

const SliderProgress = styled.div<ColorProps & { $width: string }>`
  height: 1rem;
  border-radius: 9999px;
  transition: all 0.5s ease-in-out;
  width: ${props => props.$width};
  
  ${({ $color }) => {
    switch ($color) {
      case 'green': return css`background-color: #22c55e;`;
      case 'blue': return css`background-color: #3b82f6;`;
      case 'yellow': return css`background-color: #eab308;`;
      case 'red': return css`background-color: #ef4444;`;
      case 'purple': return css`background-color: #a855f7;`;
      default: return css`background-color: #3b82f6;`;
    }
  }}
`;

const DetailText = styled.div`
  font-size: 0.875rem;
  margin-top: 0.25rem;
  color: #4b5563;
`;

export const PercentageSlider: React.FC<PercentageSliderProps> = ({
  label,
  subTitle,
  percentage,
  color = 'blue',
  detail,
  tooltip
}) => {
  const formattedPercentage = Math.round(percentage * 100);
  
  const sliderContent = (
    <SliderContainer $color={color}>
      <HeaderContainer>
        <LabelContainer>
          <Label>{label}</Label>
          {subTitle && <SubTitle>{subTitle}</SubTitle>}
        </LabelContainer>
        <PercentageValue $color={color}>{formattedPercentage}%</PercentageValue>
      </HeaderContainer>
      
      <SliderTrack>
        <SliderProgress 
          $color={color} 
          $width={`${formattedPercentage}%`} 
        />
      </SliderTrack>
      
      {detail && <DetailText>{detail}</DetailText>}
    </SliderContainer>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow placement="top">
        {sliderContent}
      </Tooltip>
    );
  }

  return sliderContent;
}; 