import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import UserLogin from './pages/UserLogin';
import UserSignUp from './pages/UserSignUp';
import Homepage from './pages/Homepage';
import ContactUs from './pages/ContactUs'; // Add this import
import AboutUs from './pages/AboutUs';
import Foundations from './pages/Foundations';
import PasswordChanged from './pages/PasswordChanged'; // Add this import
import AdminDashboard from './pages/AdminDashboard';
import AdminDonors from './pages/AdminDonors';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminCampaignCreation from './pages/AdminCampaignCreation';
import AdminFoundationCreation from './pages/AdminFoundationCreation';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/signup" element={<UserSignUp />} />
        <Route path="/contact" element={<ContactUs />} /> {/* Add this route */}
        <Route path="/about" element={<AboutUs />} />
        <Route path="/foundations" element={<Foundations />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/test" element={<PasswordChanged />} /> {/* Add this route */}
        <Route path="/admin_dashboard" element={<AdminDashboard />} />
        <Route path="/admin_donors" element={<AdminDonors />} />
        <Route path="/admin_users" element={<AdminUserManagement />} />
        <Route path="/admin_dashboard" element={<AdminRoute> <AdminDashboard /> </AdminRoute>} />
        <Route path="/admin/campaigns" element={<AdminRoute> <AdminCampaignCreation /> </AdminRoute>} />
        <Route path="/admin/foundations" element={<AdminRoute> <AdminFoundationCreation /> </AdminRoute>} />
      </Routes>
      <Toaster
        position="top-right"
        richColors={false}
        expand={true}
        offset={20}
      />
    </Router>
  );
}

// SUPERADMIN - ADMIN ROUTER
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) return <Navigate to="/login" />;
  if (user.role !== "super_admin") return <Navigate to="/" />;

  return children;
};


export default App;