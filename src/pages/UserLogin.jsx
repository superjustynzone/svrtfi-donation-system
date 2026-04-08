import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const UserLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const { executeRecaptcha } = useGoogleReCaptcha();

  useEffect(() => {
    fetchCsrfToken();
    
    // Show reCAPTCHA badge only on this page
    document.body.classList.add('show-captcha');
    return () => {
      document.body.classList.remove('show-captcha');
    };
  }, []);

  const fetchCsrfToken = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/csrf-token');
      setCsrfToken(response.data.csrfToken);
    } catch (err) {
      console.error("Failed to fetch CSRF token", err);
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm({
    mode: 'onChange' // Validate on change for real-time feedback
  });

  const onSubmit = async (data) => {
    try {
      if (!executeRecaptcha) {
        toast.error('ReCAPTCHA is not yet available');
        return;
      }
      
      setIsLoading(true);

      const token = await executeRecaptcha('login');

      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: data.email,
        password: data.password,
        captchaToken: token,
        csrfToken: csrfToken
      });

      // Save auth data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast.success('Login successful! Redirecting...');

      setTimeout(() => {
        const role = response.data.user.role.toLowerCase();

        const adminRoles = ["admin", "super_admin", "finance", "encoder", "auditor"];

        if (adminRoles.includes(role)) {
          navigate("/admin_dashboard");
        } else {
          navigate("/");
        }
      }, 1000);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#63A6B2] p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden flex min-h-[600px]">

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
        <div className="w-full md:w-1/2 p-8 pt-16 flex flex-col">

          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img
              src="/images/logo.png"
              alt="Shepherd's Voice"
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-500 text-sm mt-1">Shepherd's Voice Donor Portal</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1" noValidate>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="youexample@email.com"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none ${errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your Password"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent outline-none ${errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Hidden CSRF Token Field */}
            <input type="hidden" name="csrfToken" value={csrfToken} />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#63A6B2] focus:ring-[#63A6B2]"
                  style={{ accentColor: '#63A6B2' }}
                  {...register('rememberMe')}
                />
                <span className="ml-2 text-sm text-gray-600">Remember Me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-[#63A6B2] hover:underline font-bold"
              >
                Forgot Password?
              </Link>
            </div>

            {/* ReCAPTCHA v3 is invisible */}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#63A6B2] hover:bg-[#4fa3a3] text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* reCAPTCHA Disclaimer */}
            <p className="text-[10px] text-gray-400 text-center mt-2 leading-tight">
              This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" className="underline hover:text-gray-600">Privacy Policy</a> and <a href="https://policies.google.com/terms" className="underline hover:text-gray-600">Terms of Service</a> apply.
            </p>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              className="w-full border border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-medium transition flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-600">
              New Donor?{' '}
              <Link
                to="/signup"
                className="text-[#63A6B2] hover:underline font-medium"
              >
                Create Account
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-white mt-6">
        © 2026 Shepherd's Voice Radio and Television Foundation, Inc.
      </p>
    </div>
  );
};

export default UserLogin;
