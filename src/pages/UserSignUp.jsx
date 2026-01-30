import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import TermsModal from '@/components/ui/TermsModal';
import PrivacyModal from '@/components/ui/PrivacyModal';

const UserSignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    mode: 'onSubmit'
  });

  const password = watch('password');

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    
    // Complexity checks
    if (/[a-z]/.test(password)) strength += 15; // lowercase
    if (/[A-Z]/.test(password)) strength += 15; // uppercase
    if (/[0-9]/.test(password)) strength += 10; // numbers
    if (/[@$!%*?&#]/.test(password)) strength += 10; // special characters
    
    return Math.min(strength, 100);
  };

  // Get strength label and color
  const getStrengthInfo = (strength) => {
    if (strength === 0) return { label: '', color: '' };
    if (strength < 40) return { label: 'Weak', color: 'bg-red-500' };
    if (strength < 70) return { label: 'Fair', color: 'bg-yellow-500' };
    if (strength < 90) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  // Watch password and update strength immediately
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setCurrentPassword(newPassword);
    const strength = calculatePasswordStrength(newPassword);
    setPasswordStrength(strength);
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);

      const response = await axios.post('http://localhost:5000/api/auth_users/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });

      toast.success('Account created successfully! Please verify your email.');
      
      setTimeout(() => {
        navigate('/verify-email');
      }, 1500);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onError = (errors) => {
    if (errors.firstName) {
      toast.error(errors.firstName.message);
    } else if (errors.lastName) {
      toast.error(errors.lastName.message);
    } else if (errors.email) {
      toast.error(errors.email.message);
    } else if (errors.password) {
      toast.error(errors.password.message);
    } else if (errors.confirmPassword) {
      toast.error(errors.confirmPassword.message);
    } else if (errors.terms) {
      toast.error(errors.terms.message);
    }
  };

  const strengthInfo = getStrengthInfo(passwordStrength);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#63A6B2] p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden flex min-h-[650px]">
        
        {/* Left Side - Image */}
        <div className="hidden md:block md:w-1/2 relative">
          <img
            src="/images/loginimage.png"
            alt="2 Corinthians 9:7"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30"></div>
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-8">
            <h2 className="text-white text-3xl font-bold">2 Corinthians 9:7</h2>
            <p className="text-white/90 text-sm mt-2">God loves a cheerful giver</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 pt-12 flex flex-col">
          
          {/* Logo */}
          <div className="flex justify-center mb-3">
            <img
              src="/images/logo.png"
              alt="Shepherd's Voice"
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-5">
            <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Join Shepherd's Voice Donation Platform</p>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-3 flex-1" noValidate>
            
            {/* Name Fields - Side by Side */}
            <div className="grid grid-cols-2 gap-3">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Juan"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none"
                  {...register('firstName', {
                    required: 'First name is required',
                    minLength: {
                      value: 2,
                      message: 'First name must be at least 2 characters'
                    }
                  })}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Dela Cruz"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none"
                  {...register('lastName', {
                    required: 'Last name is required',
                    minLength: {
                      value: 2,
                      message: 'Last name must be at least 2 characters'
                    }
                  })}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="youexample@email.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
                      message: 'Password must contain uppercase, lowercase, number, and special character'
                    },
                    onChange: handlePasswordChange
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Meter */}
              {currentPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password Strength:</span>
                    <span className={`text-xs font-semibold ${
                      strengthInfo.label === 'Weak' ? 'text-red-500' :
                      strengthInfo.label === 'Fair' ? 'text-yellow-500' :
                      strengthInfo.label === 'Good' ? 'text-blue-500' :
                      'text-green-500'
                    }`}>
                      {strengthInfo.label}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strengthInfo.color}`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    <ul className="space-y-0.5">
                      <li className={currentPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                        ✓ At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(currentPassword) ? 'text-green-600' : 'text-gray-400'}>
                        ✓ One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(currentPassword) ? 'text-green-600' : 'text-gray-400'}>
                        ✓ One lowercase letter
                      </li>
                      <li className={/[0-9]/.test(currentPassword) ? 'text-green-600' : 'text-gray-400'}>
                        ✓ One number
                      </li>
                      <li className={/[@$!%*?&#]/.test(currentPassword) ? 'text-green-600' : 'text-gray-400'}>
                        ✓ One special character (@$!%*?&#)
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value =>
                      value === password || 'Passwords do not match'
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                className="mt-1 rounded border-gray-300 text-[#63A6B2] focus:ring-[#63A6B2]"
                style={{ accentColor: '#63A6B2' }}
                {...register('terms', {
                  required: 'You must agree to the terms and conditions'
                })}
              />
              <label className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-[#63A6B2] hover:underline font-medium"
                >
                  Terms and Conditions
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-[#63A6B2] hover:underline font-medium"
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#63A6B2] hover:bg-[#4fa3a3] text-white py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <button
              type="button"
              className="w-full border border-gray-300 hover:bg-gray-50 py-2.5 rounded-lg font-medium transition flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-600">
              Already a Donor?{' '}
              <Link
                to="/login"
                className="text-[#63A6B2] hover:underline font-medium"
              >
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-white mt-6">
        © 2026 Shepherd's Voice Radio and Television Foundation, Inc.
      </p>

      {/* Modals */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setShowTermsModal(false);
          setValue('terms', true);
        }}
      />
      
      <PrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
};

export default UserSignUp;