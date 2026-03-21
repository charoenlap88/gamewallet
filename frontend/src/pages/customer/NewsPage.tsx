import {
  Container, Typography, Card, CardContent, CardMedia, Box, Button, Skeleton, Chip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { newsApi } from '../../api/news';
import dayjs from 'dayjs';

export const NewsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['news-list'],
    queryFn: () => newsApi.list({ page: 1, limit: 50 }),
  });

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={800} mb={1}>
        {t('customer.news.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {t('customer.news.subtitle')}
      </Typography>

      {isLoading ? (
        <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
      ) : !data?.data?.length ? (
        <Typography color="text.secondary">{t('customer.news.empty')}</Typography>
      ) : (
        data.data.map((item) => (
          <Card key={item.id} sx={{ mb: 2, cursor: 'pointer', overflow: 'hidden' }} onClick={() => navigate(`/news/${item.slug}`)}>
            {item.coverImageUrl ? (
              <CardMedia
                component="img"
                height="180"
                image={item.coverImageUrl}
                alt=""
                sx={{ objectFit: 'cover' }}
              />
            ) : null}
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
                <Typography variant="h6" fontWeight={700}>{item.title}</Typography>
                {item.pinned && <Chip label="Pin" size="small" color="primary" />}
              </Box>
              {item.excerpt && (
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {item.excerpt}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                {item.publishedAt ? dayjs(item.publishedAt).format('DD/MM/YYYY') : ''}
              </Typography>
              <Button size="small" sx={{ mt: 1 }} onClick={(e) => { e.stopPropagation(); navigate(`/news/${item.slug}`); }}>
                {t('customer.news.readMore')}
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </Container>
  );
};
