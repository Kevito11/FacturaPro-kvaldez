import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import UsersPage from './pages/Users';
import Reports from './pages/Reports';
import Payments from './pages/Payments';
import Login from './pages/Login';
import './App.css';

// Componente Protector de Rutas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Componente Protector por Rol
const RoleRoute = ({ children, permission }: { children: React.ReactNode, permission: string }) => {
    const { can } = useAuth();
    if (!can(permission)) return <Navigate to="/" replace />;
    return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="products" element={<Products />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/new" element={<CreateInvoice />} />
              <Route path="users" element={
                <RoleRoute permission="users_manage">
                  <UsersPage />
                </RoleRoute>
              } />
              <Route path="reports" element={
                <RoleRoute permission="reports_view">
                  <Reports />
                </RoleRoute>
              } />
              <Route path="payments" element={<Payments />} />
            </Route>
            
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
}


export default App;
