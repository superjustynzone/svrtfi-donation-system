import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const ResetPassword = () => {
    const [code, setCode] = useState(['', '', '', '']);
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedEmail = sessionStorage.getItem('resetEmail');
        if (storedEmail) {
            setEmail(storedEmail);
        } else {
            // If they land here without an email in session, they should go back
            toast.error("No reset session found. Please request a new code.");
            navigate('/forgot-password');
        }
    }, [navigate]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        
        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 3) {
            const nextInput = document.getElementById(`reset-code-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`reset-code-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        const verificationCode = code.join('');
        
        if (verificationCode.length !== 4) {
            toast.error('Please enter the 4-digit code');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        try {
            setIsLoading(true);
            const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
                email: email,
                code: verificationCode,
                newPassword: newPassword
            });

            toast.success(response.data.message);
            sessionStorage.removeItem('resetEmail');
            
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#63A6B2] p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
                
                {/* Icon Container */}
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#63A6B2]">
                    <Lock size={40} className="animate-bounce" />
                </div>

                {/* Content */}
                <h1 className="text-2xl font-black text-gray-800 mb-2">Create New Password</h1>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                    Enter the 4-digit verification code sent to <span className="font-bold text-[#63A6B2]">{email || 'your email'}</span> and choose a new password.
                </p>

                {/* Form */}
                <form onSubmit={handleReset} className="space-y-5 text-left">
                    <div className="flex justify-center gap-3 mb-6">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                id={`reset-code-${index}`}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-14 h-16 text-center text-2xl font-black text-[#63A6B2] border-2 border-gray-200 rounded-xl focus:border-[#63A6B2] focus:ring-0 transition-all outline-none bg-gray-50 uppercase"
                                autoComplete="off"
                                required
                            />
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Action Button */}
                    <div className="space-y-4 pt-2">
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex items-center justify-center gap-2 bg-[#63A6B2] hover:bg-[#4fa3a3] text-white py-3 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'} <ArrowRight size={18} />
                        </button>

                        <Link 
                            to="/forgot-password" 
                            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-800 py-2 font-semibold transition-colors"
                        >
                            <ArrowLeft size={16} /> Request new code
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

export default ResetPassword;
