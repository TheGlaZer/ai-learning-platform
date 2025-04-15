// This component now uses colors from the theme
import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { Tooltip } from '@mui/material';
import * as colors from '../../../../colors';

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
  padding: 1.25rem;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  
  ${({ $color }) => {
    switch ($color) {
      case 'green': return css`background-color: rgba(54, 214, 183, 0.08);`; // accent.green
      case 'blue': return css`background-color: rgba(79, 108, 255, 0.08);`; // primary
      case 'yellow': return css`background-color: rgba(255, 209, 102, 0.08);`; // accent.yellow
      case 'red': return css`background-color: rgba(255, 122, 90, 0.08);`; // secondary
      case 'purple': return css`background-color: rgba(151, 118, 255, 0.08);`; // accent.purple
      default: return css`background-color: rgba(79, 108, 255, 0.08);`; // primary default
    }
  }}
  
  &:hover {
    box-shadow: 0 4px 10px -1px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  align-items: center;
`;

const LabelContainer = styled.div``;

const Label = styled.span`
  font-weight: 600;
  color: ${colors.text.primary};
`;

const SubTitle = styled.div`
  font-size: 0.75rem;
  color: ${colors.text.secondary};
  margin-top: 0.25rem;
`;

const PercentageValue = styled.span<ColorProps>`
  font-weight: 700;
  font-size: 1.125rem;
  
  ${({ $color }) => {
    switch ($color) {
      case 'green': return css`color: ${colors.accent.green.dark};`;
      case 'blue': return css`color: ${colors.primary.dark};`;
      case 'yellow': return css`color: ${colors.accent.yellow.dark};`;
      case 'red': return css`color: ${colors.secondary.dark};`;
      case 'purple': return css`color: ${colors.accent.purple.dark};`;
      default: return css`color: ${colors.primary.dark};`;
    }
  }}
`;

const SliderTrack = styled.div`
  width: 100%;
  background-color: ${colors.border.light};
  border-radius: 9999px;
  height: 0.75rem;
  margin-top: 0.5rem;
`;

const SliderProgress = styled.div<ColorProps & { $width: string }>`
  height: 0.75rem;
  border-radius: 9999px;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  width: ${props => props.$width};
  position: relative;
  
  &::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    width: 6px;
    border-radius: 0 9999px 9999px 0;
    background-color: inherit;
    opacity: 0.7;
  }
  
  ${({ $color }) => {
    switch ($color) {
      case 'green': return css`background-color: ${colors.accent.green.main};`;
      case 'blue': return css`background-color: ${colors.primary.main};`;
      case 'yellow': return css`background-color: ${colors.accent.yellow.main};`;
      case 'red': return css`background-color: ${colors.secondary.main};`;
      case 'purple': return css`background-color: ${colors.accent.purple.main};`;
      default: return css`background-color: ${colors.primary.main};`;
    }
  }}
`;

const DetailText = styled.div`
  font-size: 0.875rem;
  margin-top: 0.5rem;
  color: ${colors.text.secondary};
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
        <div>{sliderContent}</div>
      </Tooltip>
    );
  }

  return sliderContent;
}; 