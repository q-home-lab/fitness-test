// AÑADE LOS IMPORTS DE REACT ROUTER Y EL CONTEXTO
import { Routes, Route, Navigate } from 'react-router-dom';
import useUserStore from './stores/useUserStore';

// Importa tus componentes existentes
import AuthForm from './AuthForm';

// Importa las páginas con lazy loading
import { lazy, Suspense } from 'react';
import OnboardingGuard from './components/OnboardingGuard';

// Importar LoadingState reutilizable
import LoadingState from './components/LoadingState';

// Componente de carga mejorado
const LoadingSpinner = () => (
  <LoadingState 
    message="Cargando..." 
    variant="spinner" 
    fullScreen 
  />
);

// Lazy loading de páginas
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./features/dashboard/pages/Dashboard'));
const WeightTrackingPage = lazy(() => import('./pages/WeightTrackingPage'));
const DietPage = lazy(() => import('./pages/DietPage'));
const RoutinesPage = lazy(() => import('./pages/RoutinesPage'));
const RoutineDetailPage = lazy(() => import('./pages/RoutineDetailPage'));
const ActiveWorkoutPage = lazy(() => import('./pages/ActiveWorkoutPage'));
const DailyLogPage = lazy(() => import('./pages/DailyLogPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const InvitePage = lazy(() => import('./pages/InvitePage'));
const RoleSelectionPage = lazy(() => import('./pages/RoleSelectionPage'));
const CoachDashboard = lazy(() => import('./pages/CoachDashboard'));
const CoachClientDetail = lazy(() => import('./pages/CoachClientDetail'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));
const CheckInPage = lazy(() => import('./pages/CheckInPage'));

// Importación de ErrorBoundary y ToastContainer
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import SkipLink from './components/SkipLink';

// --- Componente para Proteger Rutas ---
const ProtectedRoute = ({ children }) => {
  const user = useUserStore((state) => state.user);
  const loading = useUserStore((state) => state.loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black">
        <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si no está autenticado, redirige al AuthForm
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// --- Componente para Proteger Rutas SOLO para administradores ---
const AdminRoute = ({ children }) => {
  const user = useUserStore((state) => state.user);
  const loading = useUserStore((state) => state.loading);
  const isAdmin = useUserStore((state) => state.isAdmin());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black">
        <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// --- Componente para Proteger Rutas SOLO para coaches ---
const CoachRoute = ({ children }) => {
  const user = useUserStore((state) => state.user);
  const loading = useUserStore((state) => state.loading);
  const isCoach = useUserStore((state) => state.isCoach());
  const isAdmin = useUserStore((state) => state.isAdmin());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black">
        <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isCoach && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


function App() {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated());

  // El componente se renderizará siempre, las rutas se encargan de la vista
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#FAF3E1] dark:bg-black transition-colors duration-300">
        <SkipLink />
        <ToastContainer />
        <Suspense fallback={<LoadingSpinner />}>
          <main id="main-content" role="main">
          <Routes>

        {/* Ruta Base - Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Rutas Públicas de Login y Registro */}
        <Route path="/login" element={<AuthForm />} />
        <Route path="/register" element={<AuthForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/invite/:token" element={<InvitePage />} />

        {/* Ruta de Selección de Rol (Protegida) */}
        <Route
          path="/select-role"
          element={
            <ProtectedRoute>
              <RoleSelectionPage />
            </ProtectedRoute>
          }
        />

        {/* Ruta de Bienvenida/Onboarding (Protegida) */}
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <WelcomePage />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />

        {/* Ruta Dashboard (Protegida) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <Dashboard />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />

        {/* Ruta de Seguimiento de Peso (Protegida) */}
        <Route
          path="/weight"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <WeightTrackingPage />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />

        {/* Ruta de Dieta (Protegida) */}
        <Route
          path="/diet"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <DietPage />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />

        {/* Rutas de Rutinas (Protegidas) */}
        <Route
          path="/routines"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <RoutinesPage />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/routines/:id"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <RoutineDetailPage />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/routines/:routineId/workout"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <ActiveWorkoutPage />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />

        {/* Ruta de Registro Diario de Ejercicios (Protegida) */}
        <Route
          path="/daily-log"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <DailyLogPage />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />

        {/* Ruta de Calendario (Protegida) */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <CalendarPage />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />

        {/* Ruta de Logros */}
        <Route
          path="/achievements"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <AchievementsPage />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />

        {/* Ruta de Check-in Semanal */}
        <Route
          path="/checkin"
          element={
            <ProtectedRoute>
              <CheckInPage />
            </ProtectedRoute>
          }
        />

        {/* Rutas del Coach */}
        <Route
          path="/coach/dashboard"
          element={
            <CoachRoute>
              <CoachDashboard />
            </CoachRoute>
          }
        />
        <Route
          path="/coach/client/:id"
          element={
            <CoachRoute>
              <CoachClientDetail />
            </CoachRoute>
          }
        />
        <Route
          path="/coach/templates"
          element={
            <CoachRoute>
              <TemplatesPage />
            </CoachRoute>
          }
        />

        {/* Ruta de Administración (solo administradores) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Redirige si el usuario autenticado trata de ir a /login o /register */}
        <Route
          path="/auth"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />

        {/* Redirección para el 404 simple */}
        <Route path="*" element={<div className="p-8 text-center text-xl" role="alert">404 | Página no encontrada</div>} />
          </Routes>
          </main>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
