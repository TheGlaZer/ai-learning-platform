import {
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';

const navigationItems = [
  {
    path: `/${locale}/dashboard/${workspaceId}/past-exams`,
    text: t('pastExams'),
    icon: <InsertDriveFileIcon />
  },
  {
    path: `/${locale}/dashboard/${workspaceId}/patterns`,
    text: t('examPatterns'),
    icon: <AutoAwesomeIcon />
  },
]; 