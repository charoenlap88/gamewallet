import { Container, Typography, Button, Box, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { newsApi } from '../../api/news';
import dayjs from 'dayjs';

export const NewsDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['news', slug],
    queryFn: () => newsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container sx={{ py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/news')}>
          {t('customer.news.title')}
        </Button>
        <Typography mt={2}>{t('customer.news.empty')}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/news')} sx={{ mb: 2 }}>
        {t('customer.news.title')}
      </Button>
      <Typography variant="h4" fontWeight={800} mb={1}>
        {data.title}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        {data.publishedAt ? dayjs(data.publishedAt).format('DD/MM/YYYY HH:mm') : ''}
      </Typography>
      {data.coverImageUrl ? (
        <Box
          component="img"
          src={data.coverImageUrl}
          alt=""
          sx={{
            width: '100%',
            maxHeight: 360,
            objectFit: 'cover',
            borderRadius: 2,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        />
      ) : null}
      <Box
        sx={{
          whiteSpace: 'pre-wrap',
          typography: 'body1',
          lineHeight: 1.8,
        }}
      >
        {data.body}
      </Box>
    </Container>
  );
};
