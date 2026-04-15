import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        try {
            setIsLoading(true);
            
            const response = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            toast.success(response.data.message);
            
            // Optionally save the email to sessionStorage for the next step 
            sessionStorage.setItem('resetEmail', email);

            // Once the backend is ready, we would navigate to a "Verify Reset Code" page.
            setTimeout(() => { navigate('/reset-password'); }, 1500);

        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to process request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#63A6B2] p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
                
                {/* Icon Container */}
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#63A6B2]">
                    <Mail size={40} className="animate-bounce" />
                </div>

                {/* Content */}
                <h1 className="text-2xl font-black text-gray-800 mb-2">Forgot Password?</h1>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Don't worry! It happens. Please enter the email address associated with your account to receive a password reset code.
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6 text-left">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="yourexample@email.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4 pt-2">
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex items-center justify-center gap-2 bg-[#63A6B2] hover:bg-[#4fa3a3] text-white py-3 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Code'} <ArrowRight size={18} />
                        </button>

                        <Link 
                            to="/login" 
                            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-800 py-2 font-semibold transition-colors"
                        >
                            <ArrowLeft size={16} /> Back to Sign In
                        </Link>
                    </div>
                </form>

            </div>

            {/* Logo */}
            <div className="mt-8">
                <img
                    src="/images/logo.png"
                    alt="Shepherd's Voice"
                    className="h-10 w-auto opacity-90 brightness-0 invert"
                />
            </div>

            {/* Footer Copyright */}
            <p className="text-center text-xs text-white/70 mt-4 font-medium uppercase tracking-widest">
                © 2026 Shepherd's Voice Radio and Television Foundation, Inc.
            </p>
        </div>
    );
};

export default ForgotPassword;
