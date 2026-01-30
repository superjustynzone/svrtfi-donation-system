import React, { useState } from 'react';
import { Menu, X, Heart, Target, Award, Tv, Radio, Globe, Users, HandHeart, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AboutSVRTV() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const programs = [
    {
      icon: Tv,
      title: 'Television Ministry',
      description: 'KERYGMA TV brings hope and inspiration to thousands through ANC and IBC13, reaching communities nationwide'
    },
    {
      icon: Radio,
      title: 'Radio Outreach',
      description: 'Gabay sa Bibliya sa Radyo on Veritas 846 provides spiritual guidance and support to listeners across the Philippines'
    },
    {
      icon: Globe,
      title: 'Community Impact',
      description: 'Kerygma Conference and online ministries connect donors with meaningful causes and life-changing programs'
    }
  ];

  const volunteers = [
    {
      name: 'Sarah Johnson',
      role: 'Community Outreach',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
    },
    {
      name: 'Michael Chen',
      role: 'Program Coordinator',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop'
    },
    {
      name: 'Elena Rodriguez',
      role: 'Donor Relations',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop'
    },
    {
      name: 'David Santos',
      role: 'Event Management',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
    }
  ];

  const awards = [
    'ANAK TV SEAL - Mustard TV, Inside the FiSHBowl',
    'Best Website (CMMA 2007) - www.preacherinbluejeans.com',
    'Best TV Special (CMMA 2012) - The Week That Changed the World',
    'Best Religious Program (CMMA 2012) - Kerygma TV'
  ];

  const impact = [
    {
      number: '5,000+',
      label: 'Lives Touched',
      description: 'Through our charitable programs'
    },
    {
      number: '25+',
      label: 'Communities',
      description: 'Served across the Philippines'
    },
    {
      number: '100%',
      label: 'Transparent',
      description: 'Donation tracking and reporting'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img src="/images/logo.png" alt="Shepherd's Voice Logo" className="h-20 w-20 object-contain"/>
              <div>
                <div className="font-bold text-gray-900 text-sm leading-tight">Shepherd's Voice</div>
                <div className="text-xs text-gray-600">Radio and TV Foundation Inc</div>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a 
                href="/" 
                className={`font-medium transition relative ${
                  isActive('/') 
                    ? 'text-[#63A6B2]' 
                    : 'text-gray-700 hover:text-teal-600'
                }`}
              >
                Home
                {isActive('/') && (
                  <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#63A6B2]"></span>
                )}
              </a>
              <a 
                href="/about" 
                className={`font-medium transition relative ${
                  isActive('/about') 
                    ? 'text-[#63A6B2]' 
                    : 'text-gray-700 hover:text-teal-600'
                }`}
              >
                About SVRTV
                {isActive('/about') && (
                  <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#63A6B2]"></span>
                )}
              </a>
              <a 
                href="#" 
                className="text-gray-700 hover:text-teal-600 font-medium transition relative"
              >
                Campaigns
              </a>
              <a 
                href="/contact" 
                className={`font-medium transition relative ${
                  isActive('/contact') 
                    ? 'text-[#63A6B2]' 
                    : 'text-gray-700 hover:text-teal-600'
                }`}
              >
                Contact Us
                {isActive('/contact') && (
                  <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#63A6B2]"></span>
                )}
              </a>
              <button 
                onClick={() => navigate('/login')}
                className="bg-[#63A6B2] hover:bg-[#5a959f] text-white px-6 py-2 rounded-full font-medium transition shadow-md hover:shadow-lg"
              >
                Donate
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <a 
                href="/" 
                className={`block font-medium transition ${
                  isActive('/') 
                    ? 'text-[#63A6B2] font-bold' 
                    : 'text-gray-700 hover:text-teal-600'
                }`}
              >
                Home
              </a>
              <a 
                href="/about" 
                className={`block font-medium transition ${
                  isActive('/about') 
                    ? 'text-[#63A6B2] font-bold' 
                    : 'text-gray-700 hover:text-teal-600'
                }`}
              >
                About SVRTV
              </a>
              <a href="#" className="block text-gray-700 hover:text-teal-600 font-medium">Campaigns</a>
              <a 
                href="/contact" 
                className={`block font-medium transition ${
                  isActive('/contact') 
                    ? 'text-[#63A6B2] font-bold' 
                    : 'text-gray-700 hover:text-teal-600'
                }`}
              >
                Contact Us
              </a>
              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-[#63A6B2] hover:bg-[#5a959f] text-white px-6 py-2 rounded-full font-medium transition"
              >
                Donate
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="bg-[#A8D5DD] py-20 pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Section - Title, Description, Buttons */}
          <div className="grid lg:grid-cols-2 gap-8 items-start mb-12">
            {/* Left - Title and Description */}
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="text-gray-800">About </span>
                <span className="text-white">SVRTV</span>
                <span className="text-white">,</span>
              </h1>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                Creating Impact
              </h2>
              <p className="text-lg text-gray-700 max-w-xl leading-relaxed">
                Be a part of something great. We are utterly dedicated to giving hope to those in need, creating a lasting impact for them.
              </p>
            </div>

            {/* Right - Buttons */}
            <div className="flex gap-4 lg:justify-end lg:items-start lg:pt-8">
              <button 
                onClick={() => navigate('/login')}
                className="bg-[#63A6B2] hover:bg-[#5a959f] text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Donate Now
              </button>
              <button 
                onClick={() => navigate('/contact')}
                className="bg-transparent border-2 border-[#63A6B2] text-[#63A6B2] hover:bg-[#63A6B2] hover:text-white px-8 py-3 rounded-full font-semibold transition-all duration-300"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Landscape Image */}
          <div className="relative mb-12">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&h=500&fit=crop"
                alt="Happy children"
                className="w-full h-[400px] object-cover"
              />
            </div>
            {/* Navigation Dots */}
            <div className="absolute bottom-6 right-6 flex gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
              <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
            </div>
          </div>

          {/* Statistics */}
          <div className="flex justify-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl w-full">
              <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow text-center">
                <h3 className="text-4xl md:text-5xl font-bold text-[#63A6B2] mb-3">5,000+</h3>
                <p className="text-gray-600 font-medium">Lives Touched</p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow text-center">
                <h3 className="text-4xl md:text-5xl font-bold text-[#63A6B2] mb-3">₱20,000+</h3>
                <p className="text-gray-600 font-medium">Funds Raised</p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow text-center">
                <h3 className="text-4xl md:text-5xl font-bold text-[#63A6B2] mb-3">100+</h3>
                <p className="text-gray-600 font-medium">Communities Served</p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow text-center">
                <h3 className="text-4xl md:text-5xl font-bold text-[#63A6B2] mb-3">50+</h3>
                <p className="text-gray-600 font-medium">Active Campaigns</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Mission for Charity */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Transforming Lives Through Generosity</h2>
              <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                Shepherd's Voice Radio and Television Foundation, Inc. (SVRTV) channels the generosity of donors 
                into life-changing programs that uplift underprivileged communities across the Philippines. 
                Founded on <strong>March 9, 2005</strong>, we work under the ministry of Catholic lay preacher 
                <strong> Bro. Bo Sanchez</strong>.
              </p>
              <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                Every donation supports our mission to provide <strong>poverty alleviation, healthcare assistance, 
                educational support, and spiritual guidance</strong> to those who need it most. Through media evangelization, 
                we reach thousands with messages of hope while delivering tangible help to communities.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Your contribution doesn't just fund programs—it transforms lives, restores dignity, and brings 
                hope to families facing hardship.
              </p>
            </div>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop"
                alt="Our Mission"
                className="rounded-2xl shadow-2xl w-full h-[500px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-gradient-to-br from-[#63A6B2] to-[#5a959f] p-8 rounded-2xl shadow-xl text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4">Our Vision</h3>
              <p className="text-lg leading-relaxed text-white/95">
              To be the most trusted platform for charitable giving in Catholic media evangelization, where every donation creates lasting impact and transforms lives. 
              We envision a future where generous hearts and compassionate giving bring hope, healing, and dignity to communities across the Philippines.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-100">
              <div className="w-16 h-16 bg-[#63A6B2]/10 rounded-full flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-[#63A6B2]" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                At Shepherd's Voice Radio and TV Foundation Inc, we are committed to empowering communities 
                through compassion, service, and faith. Our mission is to provide hope and support to those 
                who need it most.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Through our various programs and campaigns, we touch lives, strengthen families, and build 
                resilient communities across the Philippines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Your Donation Helps */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Where Your Donation Goes</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Every peso you donate directly supports programs that change lives
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {programs.map((program, index) => {
              const Icon = program.icon;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-[#63A6B2]/10 rounded-full flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-[#63A6B2]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{program.title}</h3>
                  <p className="text-gray-600">{program.description}</p>
                </div>
              );
            })}
          </div>

          {/* Programs Funded */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Charitable Programs We Support</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-[#63A6B2] rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Medical Missions</h4>
                <p className="text-sm text-gray-600">Healthcare for underprivileged communities</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-[#63A6B2] rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Senior Care Programs</h4>
                <p className="text-sm text-gray-600">Support for elderly in need</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-[#63A6B2] rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Child Development</h4>
                <p className="text-sm text-gray-600">Education and nutrition programs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Volunteers Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm text-[#63A6B2] font-semibold mb-2 uppercase tracking-wide">Meet Our Team</p>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Our team of dedicated volunteers are here to help
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Get support 24/7 with our committed team working to maximize your donation impact
            </p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => navigate('/contact')}
                className="inline-flex items-center px-6 py-3 border-2 border-gray-300 rounded-full font-medium text-gray-700 hover:border-[#63A6B2] hover:text-[#63A6B2] transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Get in touch
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-6 py-3 bg-[#63A6B2] text-white rounded-full font-medium hover:bg-[#5a959f] transition-all shadow-md hover:shadow-lg"
              >
                Donate Now
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>

          {/* Volunteers Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {volunteers.map((volunteer, index) => (
              <div 
                key={index}
                className="bg-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
              >
                <div className="aspect-square relative overflow-hidden bg-gray-200">
                  <img 
                    src={volunteer.image} 
                    alt={volunteer.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{volunteer.name}</h3>
                  <p className="text-sm text-gray-600">{volunteer.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Credibility - Awards */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Trusted & Recognized</h2>
            <p className="text-lg text-gray-600">
              Award-winning excellence in charitable media evangelization
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {awards.map((award, index) => (
              <div key={index} className="flex items-start space-x-4 bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex-shrink-0">
                  <Award className="w-8 h-8 text-[#63A6B2]" />
                </div>
                <div>
                  <p className="text-gray-700 font-medium">{award}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-teal-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-[#63A6B2] mb-6">
            Make a Difference Today
          </h2>
          <p className="text-lg text-[#63A6B2] mb-8">
            Your donation brings hope, healing, and transformation to communities across the Philippines. 
            Join us in changing lives through compassionate giving.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/login')}
              className="bg-[#63A6B2] hover:bg-[#5a959f] text-white px-6 py-2 rounded-full font-medium transition shadow-md hover:shadow-lg"
            >
              Donate Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#63A6B2] text-white mt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/images/logov2.png" alt="Shepherd's Voice Logo" className="h-20 w-20 object-contain"/>
                <div>
                  <div className="font-bold text-white text-sm leading-tight">Shepherd's Voice</div>
                  <div className="text-xs text-white/90">Radio and TV Foundation Inc</div>
                </div>
              </div>
              <p className="text-white/90 text-sm leading-relaxed max-w-md mb-6">
                Transforming lives through charitable giving and media evangelization since 2005.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/" className="text-white/90 hover:text-white transition">Home</a></li>
                <li><a href="/about" className="text-white/90 hover:text-white transition">About SVRTV</a></li>
                <li><a href="#" className="text-white/90 hover:text-white transition">Campaigns</a></li>
                <li><a href="/contact" className="text-white/90 hover:text-white transition">Contact Us</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-bold text-white mb-4">Contact</h3>
              <ul className="space-y-3 text-sm text-white/90">
                <li>info@svrtv.org</li>
                <li>+63 123 456 7890</li>
                <li>Quezon City, Philippines</li>
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