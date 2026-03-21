import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { theme } from './theme';
import { I18nSync } from './components/I18nSync';

// Layouts
import { CustomerLayout } from './layouts/CustomerLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AgentLayout } from './layouts/AgentLayout';
import { ProtectedRoute } from './layouts/ProtectedRoute';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Customer pages
import { HomePage } from './pages/customer/HomePage';
import { ProductsPage } from './pages/customer/ProductsPage';
import { ProductDetailPage } from './pages/customer/ProductDetailPage';
import { WalletPage } from './pages/customer/WalletPage';
import { OrdersPage } from './pages/customer/OrdersPage';
import { OrderDetailPage } from './pages/customer/OrderDetailPage';
import { ProfilePage } from './pages/customer/ProfilePage';
import { PaymentHistoryPage } from './pages/customer/PaymentHistoryPage';
import { NewsPage } from './pages/customer/NewsPage';
import { NewsDetailPage } from './pages/customer/NewsDetailPage';
import { AdminNewsPage } from './pages/admin/AdminNewsPage';

// Admin pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { UsersPage } from './pages/admin/UsersPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { SuppliersPage } from './pages/admin/SuppliersPage';
import { ApiKeysPage } from './pages/admin/ApiKeysPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { NavRolesPage } from './pages/admin/NavRolesPage';
import { AgentDashboardPage } from './pages/agent/AgentDashboardPage';
import { AgentCustomersPage } from './pages/agent/AgentCustomersPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

function AppRoutes() {
  return (
    <>
      <BrowserRouter>
        <I18nSync />
        <Routes>
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Customer */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/news/:slug" element={<NewsDetailPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/payments" element={<PaymentHistoryPage />} />
              </Route>
            </Route>

            {/* Admin */}
            <Route
              element={
                <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']} redirectTo="/login" />
              }
            >
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<DashboardPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/products/categories" element={<CategoriesPage />} />
                <Route path="/admin/products" element={<AdminProductsPage />} />
                <Route path="/admin/suppliers" element={<SuppliersPage />} />
                <Route path="/admin/suppliers/api-keys" element={<ApiKeysPage />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/payments" element={<AdminPaymentsPage />} />
                <Route path="/admin/analytics" element={<AnalyticsPage />} />
                <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
                <Route path="/admin/nav-roles" element={<NavRolesPage />} />
                <Route path="/admin/news" element={<AdminNewsPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute roles={['AGENT']} redirectTo="/login" />}>
              <Route element={<AgentLayout />}>
                <Route path="/agent" element={<AgentDashboardPage />} />
                <Route path="/agent/customers" element={<AgentCustomersPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </BrowserRouter>
    </>
  );
}

function App() {
  const inner = (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster
          position="top-center"
          containerStyle={{ top: 16 }}
          toastOptions={{
            duration: 3200,
            style: {
              borderRadius: 14,
              fontFamily: '"Inter", "Noto Sans Thai", ui-sans-serif, sans-serif',
              fontWeight: 600,
              boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
              border: '1px solid rgba(196,30,58,0.15)',
            },
          }}
        />
        <AppRoutes />
      </ThemeProvider>
    </QueryClientProvider>
  );

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{inner}</GoogleOAuthProvider>;
  }
  return inner;
}

export default App;
