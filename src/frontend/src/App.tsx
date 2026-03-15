import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { getToken } from './api/client';
import { bootstrapSession } from './store/authSlice';
import { useAppDispatch } from './store/hooks';
import { AdminRoute } from './components/AdminRoute';
import { Layout } from './components/Layout';
import { PrivateRoute } from './components/PrivateRoute';
import { SkipNavigation } from './components/SkipNavigation';
import { HistoryPage } from './pages/HistoryPage';
import { LandingPage } from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResultPage from './pages/ResultPage';
import SubmitComplaintPage from './pages/SubmitComplaintPage';
import { AdminPage } from './pages/AdminPage';

/**
 * Inner component that can access the Redux store (Provider is in main.tsx above it).
 * Dispatches the session-bootstrap thunk only when a stored token is found, so a
 * fresh page load with no token never triggers the loading spinner.
 */
function AppContent() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (getToken()) {
      void dispatch(bootstrapSession());
    }
  }, [dispatch]);

  return (
    <BrowserRouter>
      <SkipNavigation />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/submit"
          element={
            <PrivateRoute>
              <Layout>
                <SubmitComplaintPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/result/:id"
          element={
            <PrivateRoute>
              <Layout>
                <ResultPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/result"
          element={
            <PrivateRoute>
              <Layout>
                <ResultPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/history"
          element={
            <PrivateRoute>
              <Layout>
                <HistoryPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Layout>
                <AdminPage />
              </Layout>
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppContent />;
}

