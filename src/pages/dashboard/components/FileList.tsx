"use client";
import React from 'react';
import { 
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { FileMetadata } from '@/app/models/file';

interface FileListProps {
  files: FileMetadata[];
}

const FileList: React.FC<FileListProps> = ({ files }) => {
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'document':
        return <InsertDriveFileIcon color="primary" />;
      case 'summary':
        return <InsertDriveFileIcon color="secondary" />;
      case 'quiz':
        return <InsertDriveFileIcon color="warning" />;
      default:
        return <InsertDriveFileIcon />;
    }
  };

  if (!files || files.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No files in this workspace yet.
      </Typography>
    );
  }

  return (
    <List>
      {files.map((file) => (
        <ListItem key={file.id} button>
          <ListItemIcon>
            {getFileTypeIcon(file.file_type)}
          </ListItemIcon>
          <ListItemText 
            primary={file.name} 
            secondary={`Type: ${file.file_type} • Created: ${new Date(file.created_at).toLocaleDateString()}`} 
          />
        </ListItem>
      ))}
    </List>
  );
};

export default FileList;