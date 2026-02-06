import React, { useState } from 'react';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function ContactUs() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    // Email validation
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    if (!formData.message.trim()) {
      toast.error('Message is required');
      return;
    }

    if (formData.message.trim().length < 10) {
      toast.error('Message must be at least 10 characters long');
      return;
    }

    try {
      setIsLoading(true);

      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Message sent successfully! We will get back to you soon.');

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: ''
      });

    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#63A6B2] to-[#5a959f] py-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm px-8 py-3 rounded-2xl mb-6">
            <h1 className="text-3xl md:text-5xl font-bold text-white">
              We Would Love to Hear from You
            </h1>
          </div>
          <p className="text-lg text-white/90 max-w-3xl mx-auto">
            Thank you for your interest in Shepherd's Voice Radio and TV Foundation Inc and our mission to uplift
            underprivileged communities. We value your thoughts, questions, and feedback. Please don't hesitate to
            reach out to us. Our dedicated team is here to assist you.
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Single Card Container */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Contact Links</h2>

                {/* Call */}
                <div className="mb-8">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-[#63A6B2]/10 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-[#63A6B2]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Call</h3>
                  </div>
                  <a href="tel:+63123456789" className="text-gray-700 hover:text-[#63A6B2] transition ml-13">
                    +63 123 456 7890
                  </a>
                </div>

                {/* Email */}
                <div className="mb-8">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-[#63A6B2]/10 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-[#63A6B2]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                  </div>
                  <a href="mailto:info@svrtv.org" className="text-gray-700 hover:text-[#63A6B2] transition ml-13">
                    info@svrtv.org
                  </a>
                </div>

                {/* Address */}
                <div className="mb-8">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-[#63A6B2]/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#63A6B2]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Address</h3>
                  </div>
                  <p className="text-gray-700 ml-13">
                    Quezon City, Philippines
                  </p>
                </div>

                {/* Socials */}
                <div className="mb-8">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-[#63A6B2]/10 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#63A6B2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Socials</h3>
                  </div>
                  <div className="flex space-x-3 ml-13">
                    <a href="#" className="w-10 h-10 bg-gray-200 hover:bg-[#63A6B2] hover:text-white rounded-full flex items-center justify-center transition-all duration-300">
                      <Facebook className="w-5 h-5" />
                    </a>
                    <a href="#" className="w-10 h-10 bg-gray-200 hover:bg-[#63A6B2] hover:text-white rounded-full flex items-center justify-center transition-all duration-300">
                      <Instagram className="w-5 h-5" />
                    </a>
                    <a href="#" className="w-10 h-10 bg-gray-200 hover:bg-[#63A6B2] hover:text-white rounded-full flex items-center justify-center transition-all duration-300">
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a href="#" className="w-10 h-10 bg-gray-200 hover:bg-[#63A6B2] hover:text-white rounded-full flex items-center justify-center transition-all duration-300">
                      <Youtube className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Send a Message</h2>
                <form onSubmit={handleSubmit}>
                  {/* First Name and Last Name */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Enter First Name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Enter Last Name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  {/* Email and Phone */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your Email"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter Phone Number"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Enter your Message"
                      rows="5"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#63A6B2] focus:border-transparent transition resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#63A6B2] hover:bg-[#5a959f] text-white font-semibold py-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : 'Send your Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-teal-50 py-20 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 opacity-20">
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-3 h-8 bg-[#63A6B2] transform -rotate-45"></div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-32 h-32 opacity-20">
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-3 h-8 bg-[#63A6B2] transform -rotate-45"></div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Donate Now and Help Transform Lives in Our Communities
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Your donation will help provide essential services to families and communities in need, such as spiritual guidance,
            education, healthcare, and community development programs.
          </p>
          <div className="bg-white shadow-lg rounded-full p-2 inline-flex items-center flex-col sm:flex-row gap-2 sm:gap-0">
            <span className="px-6 py-2 text-gray-700 text-sm sm:text-base">
              Click here to donate now and help transform lives
            </span>
            <button className="bg-[#63A6B2] hover:bg-[#5a959f] text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 flex items-center">
              Donate Now
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#63A6B2] text-white mt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/images/logov2.png" alt="Shepherd's Voice Logo" className="h-20 w-20 object-contain" />
                <div>
                  <div className="font-bold text-white text-sm leading-tight">Shepherd's Voice</div>
                  <div className="text-xs text-white/90">Radio and TV Foundation Inc</div>
                </div>
              </div>
              <p className="text-white/90 text-sm leading-relaxed max-w-md mb-6">
                Empowering communities through compassion and service. Together, we can make a difference in the lives of those who need it most.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" /></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/" className="text-white/90 hover:text-white transition">Home</a></li>
                <li><a href="#" className="text-white/90 hover:text-white transition">About SVRTV</a></li>
                <li><a href="#" className="text-white/90 hover:text-white transition">Campaigns</a></li>
                <li><a href="/contact" className="text-white/90 hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="text-white/90 hover:text-white transition">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-bold text-white mb-4">Contact</h3>
              <ul className="space-y-3 text-sm text-white/90">
                <li className="flex items-start space-x-2">
                  <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>info@svrtv.org</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>+63 123 456 7890</span>
                </li>
                <li className="flex items-start space-x-2">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Quezon City, Philippines</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/90">
            <p>&copy; {new Date().getFullYear()} Shepherd's Voice Radio and TV Foundation Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}