import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Add page imports here
import Home from './pages/Home';
import Team from './pages/Team';
import Training from './pages/Training';
import TrainingSector from './pages/TrainingSector';
import FinalExam from './pages/FinalExam';
import PilotLogin from './pages/PilotLogin';
import PilotPortal from './pages/PilotPortal';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import TeamManager from './pages/admin/TeamManager';
import PilotAccess from './pages/admin/PilotAccess';
import SectorManager from './pages/admin/SectorManager';
import ExamManager from './pages/admin/ExamManager';
import PilotProgress from './pages/admin/PilotProgress';
import SiteCustomizer from './pages/admin/SiteCustomizer';
import RouteManager from './pages/admin/RouteManager';
import NotamManager from './pages/admin/NotamManager';
import TrainingSettings from './pages/admin/TrainingSettings';
import AdminAccessManager from './pages/admin/AdminAccessManager';
import RosterManager from './pages/admin/RosterManager';
import RankManager from './pages/admin/RankManager';
import MapManager from './pages/admin/MapManager';
import HomeStatsManager from './pages/admin/HomeStatsManager';
import PublicBookingsManager from './pages/admin/PublicBookingsManager';
import PublicRoutes from './pages/PublicRoutes';
import PublicBooking from './pages/PublicBooking';
import PilotOperationsSettings from './pages/admin/PilotOperationsSettings';
import Fleet from './pages/Fleet';
import FleetManager from './pages/admin/FleetManager';
import HiddenBase from './pages/HiddenBase';
import SiteLockout from './components/SiteLockout';
import Crew from './pages/Crew';
import PublicLive from './pages/PublicLive';
import PublicEvents from './pages/PublicEvents';
import LiveFlightManager from './pages/admin/LiveFlightManager';
import EventsManager from './pages/admin/EventsManager';
import BadgeManager from './pages/admin/BadgeManager';
import AirportManager from './pages/admin/AirportManager';
import FlightReports from './pages/admin/FlightReports';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <SiteLockout>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/team" element={<Team />} />
      <Route path="/training" element={<Training />} />
      <Route path="/training/sector/:id" element={<TrainingSector />} />
      <Route path="/training/final-exam" element={<FinalExam />} />
      <Route path="/pilot-login" element={<PilotLogin />} />
      <Route path="/pilot-portal" element={<PilotPortal />} />
      <Route path="/fleet" element={<Fleet />} />
      <Route path="/crew" element={<Crew />} />
      <Route path="/live" element={<PublicLive />} />
      <Route path="/events" element={<PublicEvents />} />
      <Route path="/hb" element={<HiddenBase />} />
      <Route path="/routes" element={<PublicRoutes />} />
      <Route path="/book" element={<PublicBooking />} />
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/team" element={<TeamManager />} />
        <Route path="/admin/pilots" element={<PilotAccess />} />
        <Route path="/admin/sectors" element={<SectorManager />} />
        <Route path="/admin/exam" element={<ExamManager />} />
        <Route path="/admin/progress" element={<PilotProgress />} />
        <Route path="/admin/customizer" element={<SiteCustomizer />} />
        <Route path="/admin/routes" element={<RouteManager />} />
        <Route path="/admin/notams" element={<NotamManager />} />
        <Route path="/admin/training-settings" element={<TrainingSettings />} />
        <Route path="/admin/access" element={<AdminAccessManager />} />
        <Route path="/admin/roster" element={<RosterManager />} />
        <Route path="/admin/ranks" element={<RankManager />} />
        <Route path="/admin/map" element={<MapManager />} />
        <Route path="/admin/stats" element={<HomeStatsManager />} />
        <Route path="/admin/public-bookings" element={<PublicBookingsManager />} />
        <Route path="/admin/pilot-ops" element={<PilotOperationsSettings />} />
        <Route path="/admin/fleet" element={<FleetManager />} />
        <Route path="/admin/live-tracking" element={<LiveFlightManager />} />
        <Route path="/admin/events" element={<EventsManager />} />
        <Route path="/admin/badges" element={<BadgeManager />} />
        <Route path="/admin/airports" element={<AirportManager />} />
        <Route path="/admin/flight-reports" element={<FlightReports />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </SiteLockout>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App