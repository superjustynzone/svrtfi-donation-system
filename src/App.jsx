import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import UserLogin from './pages/UserLogin';
import UserSignUp from './pages/UserSignUp';
import Homepage from './pages/Homepage';
import ContactUs from './pages/ContactUs'; // Add this import
import AboutUs from './pages/AboutUs';
import PasswordChanged from './pages/PasswordChanged'; // Add this import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/signup" element={<UserSignUp />} />
        <Route path="/contact" element={<ContactUs />} /> {/* Add this route */}
        <Route path="/about" element={<AboutUs />} />
        <Route path="/test" element={<PasswordChanged />} /> {/* Add this route */}        
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

export default App;