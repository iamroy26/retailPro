import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider } from '@/lib/AuthContext';
import PageNotFound from '@/lib/PageNotFound';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import PointOfSale from '@/pages/PointOfSale';
import Products from '@/pages/Products';
import Categories from '@/pages/Categories';
import Inventory from '@/pages/Inventory';
import SalesHistory from '@/pages/SalesHistory';
import Customers from '@/pages/Customers';
import Suppliers from '@/pages/Suppliers';
import Expenses from '@/pages/Expenses';
import Reports from '@/pages/Reports';
import StoreSettings from '@/pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pos" element={<PointOfSale />} />
                <Route path="/products" element={<Products />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/sales" element={<SalesHistory />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<StoreSettings />} />
              </Route>
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
