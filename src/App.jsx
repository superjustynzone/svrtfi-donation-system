import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';

import UserLogin from './pages/UserLogin';
import UserSignUp from './pages/UserSignUp';
import Homepage from './pages/Homepage';
import ContactUs from './pages/ContactUs';
import AboutUs from './pages/AboutUs';
import Foundations from './pages/Foundations';
import Campaigns from './pages/Campaigns';
import CampaignDetails from './pages/CampaignDetails';
import CampaignDonation from './pages/CampaignDonation';
import PaymentGateway from './pages/PaymentGateway';
import DonationConfirmation from './pages/DonationConfirmation';
import DonationReceipt from './pages/DonationReceipt';
import FoundationDetails from './pages/FoundationDetails';
import Stories from './pages/Stories';
import StoryDetails from './pages/StoryDetails';
import PasswordChanged from './pages/PasswordChanged'; // Add this import
import AdminDashboard from './pages/AdminDashboard';
import AdminDonors from './pages/AdminDonors';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminCampaignCreation from './pages/AdminCampaignCreation';
import AdminFoundationCreation from './pages/AdminFoundationCreation';
import AdminStories from './pages/AdminStories';
import AdminSettings from './pages/AdminSettings';
import AdminProfile from './pages/AdminProfile';
import AdminAuditLogs from './pages/AdminAuditLogs';
import AdminDonations from './pages/AdminDonations';
import AdminTransactions from './pages/AdminTransactions';
import AdminReports from './pages/AdminReports';
import AdminMailing from './pages/AdminMailing';
import Profile from './pages/Profile';
import DonationNotification from './components/DonationNotification';
import ChatBot from './components/ChatBot/ChatBot';

// Global CSS imports
import './index.css';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

function App() {

  // Auto-redirect based on role on mount
  const user = JSON.parse(localStorage.getItem('user'));

  const getDefaultRoute = () => {
    if (!user) return "/login";

    // viewer → homepage
    if (user.role === "viewer") return "/";

    // admins → admin dashboard
    if (["admin", "finance", "encoder", "auditor"].includes(user.role)) {
      return "/admin_dashboard";
    }

    return "/";
  };

  return (
    <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
      <Router>
        <DonationNotification />
        <ChatBot />
        <Routes>

          {/* Redirect root to correct dashboard */}
          <Route path="/" element={<Homepage />} />
          <Route path="/home" element={<Navigate to={getDefaultRoute()} replace />} />

          {/* Auth */}
          <Route path="/login" element={<GuestRoute><UserLogin /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><UserSignUp /></GuestRoute>} />

          {/* Public pages */}
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/foundations" element={<Foundations />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/:id" element={<CampaignDetails />} />
          <Route path="/campaigns/:id/donate" element={<CampaignDonation />} />
          <Route path="/payment/:donationId" element={<PaymentGateway />} />
          <Route path="/donations/:donationId/confirmation" element={<DonationConfirmation />} />
          <Route path="/donations/:donationId/receipt" element={<DonationReceipt />} />
          <Route path="/foundations/:id" element={<FoundationDetails />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/stories/:id" element={<StoryDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/test" element={<PasswordChanged />} />

          {/* Admin protected routes */}
          <Route path="/admin_dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin_donors" element={<AdminRoute><AdminDonors /></AdminRoute>} />
          <Route path="/admin_users" element={<AdminRoute><AdminUserManagement /></AdminRoute>} />
          <Route path="/admin_campaigns" element={<AdminRoute><AdminCampaignCreation /></AdminRoute>} />
          <Route path="/admin_foundations" element={<AdminRoute><AdminFoundationCreation /></AdminRoute>} />
          <Route path="/admin_stories" element={<AdminRoute><AdminStories /></AdminRoute>} />
          <Route path="/admin_settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="/admin_profile" element={<AdminRoute><AdminProfile /></AdminRoute>} />
          <Route path="/admin_audit" element={<AdminRoute><AdminAuditLogs /></AdminRoute>} />
          <Route path="/admin_donations" element={<AdminRoute><AdminDonations /></AdminRoute>} />
          <Route path="/admin_transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
          <Route path="/admin_reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
          <Route path="/admin_mailing" element={<AdminRoute><AdminMailing /></AdminRoute>} />

        </Routes>

        <Toaster position="top-right" richColors={false} expand={true} offset={20} />
      </Router>
    </GoogleReCaptchaProvider>
  );
}


// ROLE-BASED ADMIN PROTECTION
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) return <Navigate to="/login" replace />;

  // viewer cannot enter admin routes
  if (user.role === "viewer") return <Navigate to="/" replace />;

  // valid admin roles
  if (!["admin", "finance", "encoder", "auditor"].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// USER-BASED PROTECTION
const UserRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

// GUEST-BASED PROTECTION (Blocks logged-in users from login/signup)
const GuestRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (user) {
    if (["admin", "super_admin", "finance", "encoder", "auditor"].includes(user.role?.toLowerCase())) {
      return <Navigate to="/admin_dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default App;
