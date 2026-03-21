import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = 'กำลังโหลด...' }: LoadingScreenProps) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="300px"
    gap={2}
  >
    <CircularProgress color="primary" />
    <Typography color="text.secondary">{message}</Typography>
  </Box>
);
