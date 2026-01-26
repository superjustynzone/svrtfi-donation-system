import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner'; // Add this
import UserLogin from './pages/UserLogin';
import UserSignUp from './pages/UserSignUp';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/signup" element={<UserSignUp />} />
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