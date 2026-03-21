import {
  Grid, Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow,
  Paper, TableContainer,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { agentsApi } from '../../api/agents';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import dayjs from 'dayjs';
import { useAppLocale } from '../../i18n/useAppLocale';

export const AgentDashboardPage = () => {
  const { t } = useTranslation();
  const locale = useAppLocale();
  const { data: summary, isLoading: s1 } = useQuery({
    queryKey: ['agent-summary'],
    queryFn: agentsApi.getMySummary,
  });
  const { data: customers, isLoading: s2 } = useQuery({
    queryKey: ['agent-customers', 1],
    queryFn: () => agentsApi.getMyCustomers({ page: 1, limit: 10 }),
  });

  if (s1 || s2) return <LoadingScreen />;

  const a = summary as any;

  return (
    <Box>
      <PageHeader
        title={t('agent.dashboardTitle')}
        subtitle={t('agent.dashboardSubtitle', { code: a?.agent?.agentCode || t('common.dash') })}
      />

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">{t('agent.customersLinked')}</Typography>
            <Typography variant="h4" fontWeight={800}>{(a?.customerCount ?? 0).toLocaleString(locale)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">{t('agent.orderCount')}</Typography>
            <Typography variant="h4" fontWeight={800}>{(a?.orderCount ?? 0).toLocaleString(locale)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card><CardContent>
            <Typography variant="caption" color="text.secondary">{t('agent.orderVolume')}</Typography>
            <Typography variant="h4" fontWeight={800} color="primary.main">
              ฿{Number(a?.orderVolumeApprox ?? 0).toLocaleString(locale, { minimumFractionDigits: 0 })}
            </Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={700} gutterBottom>{t('agent.recentCustomers')}</Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('admin.users.username')}</TableCell>
              <TableCell>{t('agent.email')}</TableCell>
              <TableCell align="right">{t('agent.orderCol')}</TableCell>
              <TableCell>{t('admin.users.joined')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(customers as any)?.data?.length ? (
              (customers as any).data.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{c.username}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell align="right">{c._count?.orders ?? 0}</TableCell>
                  <TableCell>{dayjs(c.createdAt).format('DD/MM/YY')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} align="center">{t('agent.noCustomers')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
