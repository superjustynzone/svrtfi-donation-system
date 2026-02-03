import React, { useState } from 'react';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ContactUs() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
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

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#63A6B2] to-[#5a959f] py-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm px-8 py-3 rounded-2xl mb-6">
            <h1 className="text-3xl md:text-5xl font-bold text-white">
              ADMIN DASHBOARD
            </h1>
          </div>
          <p className="text-lg text-white/90 max-w-3xl mx-auto">
            Welcome to Admin Dashboard
          </p>
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
      </div>

    </div>
  );
}