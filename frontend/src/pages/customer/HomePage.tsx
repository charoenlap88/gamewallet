import {
  Box, Container, Typography, Grid, Card, CardContent,
  Button, Chip, Skeleton, alpha, useTheme,
} from '@mui/material';
import { ShoppingCart, LocalOffer, Speed, Security, ArrowForward } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productsApi } from '../../api/products';
import { newsApi } from '../../api/news';
import { Money } from '../../components/Money';

const CATEGORY_ICONS: Record<string, string> = {
  'Mobile Games': '📱',
  'PC Games': '💻',
  'Console Games': '🎮',
  'Gift Cards': '🎁',
  'Streaming': '📺',
};

export const HomePage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const primary = theme.palette.primary.main;
  const accent = theme.palette.accent.main;

  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: productsApi.getCategories,
  });

  const { data: featuredProducts, isLoading: prodLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => productsApi.getProducts({ limit: 8 }),
  });

  const { data: newsPage, isLoading: newsLoading } = useQuery({
    queryKey: ['home-news'],
    queryFn: () => newsApi.list({ page: 1, limit: 4 }),
  });

  const features = [
    { Icon: Speed, titleKey: 'customer.home.feat1t', descKey: 'customer.home.feat1d', color: '#D32F2F' },
    { Icon: LocalOffer, titleKey: 'customer.home.feat2t', descKey: 'customer.home.feat2d', color: '#2E7D32' },
    { Icon: Security, titleKey: 'customer.home.feat3t', descKey: 'customer.home.feat3d', color: '#1565C0' },
    { Icon: ShoppingCart, titleKey: 'customer.home.feat4t', descKey: 'customer.home.feat4d', color: '#F57C00' },
  ] as const;

  return (
    <Box>
      <Box
        sx={{
          background: `linear-gradient(135deg, #0F0F14 0%, ${alpha(primary, 0.35)} 38%, ${alpha(accent, 0.25)} 72%, ${primary} 100%)`,
          color: 'white',
          py: { xs: 6, md: 10 },
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `inset 0 -1px 0 ${alpha(accent, 0.25)}`,
        }}
      >
        <Box sx={{
          position: 'absolute', top: -100, right: -100, width: 400, height: 400,
          borderRadius: '50%', bgcolor: alpha(accent, 0.12),
          filter: 'blur(1px)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -80, left: -80, width: 300, height: 300,
          borderRadius: '50%', bgcolor: alpha(primary, 0.14),
        }} />
        <Container maxWidth="xl">
          <Box maxWidth={600} position="relative">
            <Chip
              label={t('customer.home.badge')}
              sx={{
                bgcolor: alpha(accent, 0.22),
                color: 'white',
                mb: 2,
                fontWeight: 600,
                border: `1px solid ${alpha(accent, 0.45)}`,
                boxShadow: `0 0 24px ${alpha(accent, 0.35)}`,
              }}
            />
            <Typography variant="h3" fontWeight={800} mb={2} lineHeight={1.2} sx={{ whiteSpace: 'pre-line' }}>
              {t('customer.home.heroTitle')}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 4, fontSize: 18 }}>
              {t('customer.home.heroSub')}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/products')}
                sx={{
                  bgcolor: 'common.white',
                  color: 'primary.main',
                  fontWeight: 700,
                  boxShadow: `0 4px 24px ${alpha(primary, 0.45)}`,
                  '&:hover': { bgcolor: alpha('#fff', 0.92) },
                }}
                endIcon={<ArrowForward />}
              >
                {t('customer.home.browseProducts')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/register')}
                sx={{ borderColor: 'white', color: 'white', fontWeight: 700, '&:hover': { bgcolor: alpha('#fff', 0.1) } }}
              >
                {t('customer.home.signupFree')}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box sx={{ bgcolor: 'background.paper', py: 5, borderTop: `1px solid ${alpha(accent, 0.12)}`, borderBottom: `1px solid ${alpha(accent, 0.1)}` }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            {features.map(({ Icon, titleKey, descKey, color }) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={titleKey}>
                <Box textAlign="center">
                  <Box sx={{
                    width: 60, height: 60, borderRadius: 3, mx: 'auto', mb: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: alpha(color, 0.1),
                  }}>
                    <Icon sx={{ fontSize: 28, color }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>{t(titleKey)}</Typography>
                  <Typography variant="body2" color="text.secondary">{t(descKey)}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 5 }}>
        <Typography variant="h5" fontWeight={700} mb={3}>{t('customer.home.categories')}</Typography>
        <Grid container spacing={2}>
          {catLoading
            ? Array(5).fill(0).map((_, i) => (
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={i}>
                  <Skeleton variant="rounded" height={100} />
                </Grid>
              ))
            : categories?.map((cat) => (
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={cat.id}>
                  <Card
                    onClick={() => navigate(`/products?categoryId=${cat.id}`)}
                    sx={{ cursor: 'pointer', textAlign: 'center', p: 2, '&:hover': { borderColor: 'primary.main', border: '2px solid' } }}
                  >
                    {cat.imageUrl ? (
                      <Box
                        component="img"
                        src={cat.imageUrl}
                        alt=""
                        sx={{
                          width: 72,
                          height: 72,
                          objectFit: 'cover',
                          borderRadius: 2,
                          mx: 'auto',
                          mb: 1,
                          display: 'block',
                          border: `1px solid ${alpha(accent, 0.15)}`,
                        }}
                      />
                    ) : (
                      <Typography fontSize={36} mb={1}>{CATEGORY_ICONS[cat.name] || '🎮'}</Typography>
                    )}
                    <Typography variant="body2" fontWeight={600}>{cat.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('customer.home.productCount', { n: cat._count?.products || 0 })}
                    </Typography>
                  </Card>
                </Grid>
              ))}
        </Grid>
      </Container>

      <Box sx={{ bgcolor: alpha(theme.palette.background.default, 0.6), py: 5, borderTop: `1px solid ${alpha(accent, 0.08)}` }}>
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={700}>{t('customer.news.homeSection')}</Typography>
            <Button onClick={() => navigate('/news')} endIcon={<ArrowForward />} color="primary">
              {t('common.viewAll')}
            </Button>
          </Box>
          <Grid container spacing={2}>
            {newsLoading
              ? Array(4).fill(0).map((_, i) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                    <Skeleton variant="rounded" height={100} />
                  </Grid>
                ))
              : newsPage?.data?.length
                ? newsPage.data.map((item) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.id}>
                      <Card
                        onClick={() => navigate(`/news/${item.slug}`)}
                        sx={{
                          cursor: 'pointer', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                          border: `1px solid ${alpha(accent, 0.12)}`,
                          '&:hover': { borderColor: 'primary.main', boxShadow: `0 8px 24px ${alpha(primary, 0.12)}` },
                        }}
                      >
                        {item.coverImageUrl ? (
                          <Box
                            component="img"
                            src={item.coverImageUrl}
                            alt=""
                            sx={{ width: '100%', height: 120, objectFit: 'cover' }}
                          />
                        ) : (
                          <Box sx={{ height: 120, bgcolor: alpha(primary, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography fontSize={32}>📰</Typography>
                          </Box>
                        )}
                        <Box sx={{ p: 2, flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {item.title}
                        </Typography>
                        {item.excerpt && (
                          <Typography variant="caption" color="text.secondary" mt={1} sx={{
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            {item.excerpt}
                          </Typography>
                        )}
                        <Typography variant="caption" color="primary" fontWeight={600} display="block" mt={1.5}>
                          {t('customer.news.readMore')} →
                        </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  ))
                : (
                  <Grid size={12}>
                    <Typography variant="body2" color="text.secondary">{t('customer.news.empty')}</Typography>
                  </Grid>
                )}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pb: 6 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={700}>{t('customer.home.featured')}</Typography>
          <Button onClick={() => navigate('/products')} endIcon={<ArrowForward />} color="primary">
            {t('customer.home.seeAll')}
          </Button>
        </Box>
        <Grid container spacing={2.5}>
          {prodLoading
            ? Array(8).fill(0).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                  <Skeleton variant="rounded" height={200} />
                </Grid>
              ))
            : featuredProducts?.data?.map((product) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={product.id}>
                  <Card
                    onClick={() => navigate(`/products/${product.id}`)}
                    sx={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    <Box sx={{
                      height: 100,
                      bgcolor: alpha(primary, 0.1),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderBottom: `1px solid ${alpha(accent, 0.15)}`,
                      overflow: 'hidden',
                    }}>
                      {product.imageUrl ? (
                        <Box
                          component="img"
                          src={product.imageUrl}
                          alt=""
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Typography fontSize={40}>🎮</Typography>
                      )}
                    </Box>
                    <CardContent sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" mb={0.5}>
                        {product.category?.name}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={700} mb={1.5} sx={{
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {product.name}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Money
                          amount={Number(product.sellingPrice)}
                          variant="h6"
                          fontWeight={800}
                          color="primary"
                        />
                        <Button variant="contained" size="small" sx={{ borderRadius: 6 }}>
                          {t('common.buyNow')}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
        </Grid>
      </Container>
    </Box>
  );
};
