import { Card, CardContent, Typography, Box, alpha } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  Icon: SvgIconComponent;
  color?: string;
  trend?: { value: number; label: string };
}

export const StatCard = ({ title, value, subtitle, Icon, color = '#D32F2F' }: StatCardProps) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography variant="body2" color="text.secondary" fontWeight={500} mb={1}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" mt={0.5}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(color, 0.12),
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 26, color }} />
        </Box>
      </Box>
    </CardContent>
  </Card>
);
