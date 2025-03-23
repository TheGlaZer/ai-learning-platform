import styled from '@emotion/styled';
import { Box } from '@mui/material';

const PageContainer = styled(Box)(({ theme }) => ({
  margin: '0 auto',
  padding: theme.spacing(2),
  width: '100%',
  // For mobile screens (sm and below) use full width,
  // for medium screens use a max-width of 1024px,
  // and for large screens use a max-width of 1440px.
  [theme.breakpoints.up('sm')]: {
    maxWidth: 720,
  },
  [theme.breakpoints.up('md')]: {
    maxWidth: 1024,
  },
  [theme.breakpoints.up('lg')]: {
    maxWidth: 1440,
  },
}));

export default PageContainer;
