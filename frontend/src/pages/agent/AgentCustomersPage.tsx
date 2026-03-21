import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, Pagination } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { agentsApi } from '../../api/agents';
import { PageHeader } from '../../components/common/PageHeader';
import dayjs from 'dayjs';

export const AgentCustomersPage = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['agent-customers', page],
    queryFn: () => agentsApi.getMyCustomers({ page, limit: 20 }),
  });
  const totalPages = data ? Math.ceil((data as any).total / 20) : 1;

  return (
    <Box>
      <PageHeader
        title={t('agent.customersTitle')}
        subtitle={t('agent.customersSubtitle', { count: (data as any)?.total ?? 0 })}
      />
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('admin.users.user')}</TableCell>
              <TableCell>{t('admin.users.phone')}</TableCell>
              <TableCell>{t('common.status')}</TableCell>
              <TableCell align="right">{t('agent.orderCol')}</TableCell>
              <TableCell>{t('admin.users.joined')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} align="center">{t('common.loading')}</TableCell></TableRow>
            ) : (data as any)?.data?.map((c: any) => (
              <TableRow key={c.id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{c.username}</Typography>
                  <Typography variant="caption" color="text.secondary">{c.email}</Typography>
                </TableCell>
                <TableCell>{c.phone || t('common.dash')}</TableCell>
                <TableCell>{c.status}</TableCell>
                <TableCell align="right">{c._count?.orders ?? 0}</TableCell>
                <TableCell>{dayjs(c.createdAt).format('DD/MM/YY')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination page={page} count={totalPages} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}
    </Box>
  );
};
