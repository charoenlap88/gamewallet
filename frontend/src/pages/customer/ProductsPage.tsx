import {
  Container, Grid, Card, CardContent, Typography, Button,
  TextField, Box, Chip, Pagination, InputAdornment, Skeleton,
  alpha, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { Search, ShoppingCart } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { PageHeader } from '../../components/common/PageHeader';
import { Money } from '../../components/Money';

export const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productsApi.getCategories,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, selectedCategory, page],
    queryFn: () =>
      productsApi.getProducts({
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        page,
        limit: 12,
      }),
  });

  const totalPages = data ? Math.ceil(data.total / 12) : 1;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader title="สินค้าทั้งหมด" subtitle={`${data?.total || 0} รายการ`} />

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          placeholder="ค้นหาสินค้า..."
          size="small"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>หมวดหมู่</InputLabel>
          <Select
            value={selectedCategory}
            label="หมวดหมู่"
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
          >
            <MenuItem value="">ทั้งหมด</MenuItem>
            {categories?.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {selectedCategory && (
          <Button size="small" onClick={() => setSelectedCategory('')}>ล้างตัวกรอง</Button>
        )}
      </Box>

      {/* Category chips */}
      <Box display="flex" gap={1} mb={3} flexWrap="wrap">
        <Chip
          label="ทั้งหมด"
          onClick={() => setSelectedCategory('')}
          color={selectedCategory === '' ? 'primary' : 'default'}
          variant={selectedCategory === '' ? 'filled' : 'outlined'}
        />
        {categories?.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            onClick={() => setSelectedCategory(cat.id)}
            color={selectedCategory === cat.id ? 'primary' : 'default'}
            variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
          />
        ))}
      </Box>

      {/* Products Grid */}
      <Grid container spacing={2.5}>
        {isLoading
          ? Array(12).fill(0).map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
                <Skeleton variant="rounded" height={220} />
              </Grid>
            ))
          : data?.data?.map((product) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                  onClick={() => navigate(`/products/${product.id}`)}>
                  <Box sx={{
                    height: 120, bgcolor: alpha('#D32F2F', 0.06),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
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
                      <Typography fontSize={48}>🎮</Typography>
                    )}
                    {product.isFeatured && (
                      <Chip label="แนะนำ" color="primary" size="small" sx={{
                        position: 'absolute', top: 8, right: 8, fontWeight: 700,
                      }} />
                    )}
                  </Box>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      {product.category?.name}
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={700} mb="auto" sx={{
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {product.name}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                      <Money
                        amount={Number(product.sellingPrice)}
                        variant="h6"
                        fontWeight={800}
                        color="primary"
                      />
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<ShoppingCart fontSize="small" />}
                        onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`); }}
                        sx={{ borderRadius: 6 }}
                      >
                        ซื้อ
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
      </Grid>

      {!isLoading && data?.data?.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography fontSize={48} mb={2}>🔍</Typography>
          <Typography variant="h6" color="text.secondary">ไม่พบสินค้าที่ค้นหา</Typography>
        </Box>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}
    </Container>
  );
};
