import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Heart, Users, HandHeart, TrendingUp, Calendar, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import { Toaster } from "sonner";
export { Toaster };
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';



export default function Homepage() {
  const [countersVisible, setCountersVisible] = useState(false);
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/campaigns/published')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Prefer featured campaigns; fall back to most recent
          const featured = data.filter(c => c.is_featured);
          const toShow = featured.length >= 6 ? featured.slice(0, 6) : data.slice(0, 6);
          setFeaturedCampaigns(toShow);
        }
      })
      .catch(err => console.error('Failed to load featured campaigns:', err));
  }, []);

  const impactStats = [
    { number: 5000, label: 'Lives Touched', suffix: '+' },
    { number: 200000, label: 'Funds Raised', prefix: '₱', suffix: '+' },
    { number: 100, label: 'Communities Served', suffix: '+' },
    { number: 50, label: 'Active Campaigns', suffix: '+' }
  ];

  const waysToHelp = [
    {
      icon: Heart,
      title: 'One-Time Donation',
      description: 'Make a single gift to support our mission and help those in need.',
      color: 'bg-pink-100 text-pink-600'
    },
    {
      icon: Calendar,
      title: 'Monthly Giving',
      description: 'Become a sustaining partner with recurring monthly donations.',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Users,
      title: 'Volunteer',
      description: 'Share your time and talents to make a direct impact in communities.',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: HandHeart,
      title: 'Corporate Partnership',
      description: 'Partner with us to create lasting change through CSR programs.',
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateProgress = (raised, goal) => {
    return (raised / goal) * 100;
  };

  const AnimatedCounter = ({ end, duration = 2000, prefix = '', suffix = '' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!countersVisible) return;

      let startTime;
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = (currentTime - startTime) / duration;

        if (progress < 1) {
          setCount(Math.floor(end * progress));
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      requestAnimationFrame(animate);
    }, [countersVisible, end, duration]);

    return (
      <span>{prefix}{count.toLocaleString()}{suffix}</span>
    );
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCountersVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const statsSection = document.getElementById('impact-stats');
    if (statsSection) {
      observer.observe(statsSection);
    }

    return () => {
      if (statsSection) {
        observer.unobserve(statsSection);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <div className="pt-16 relative overflow-visible">
        <div
          className="relative h-[550px] md:h-[600px] flex items-center justify-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600&h=800&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-[#63A6B2]/70"></div>

          {/* Content */}
          <div className="relative z-10 text-center px-4 max-w-full mx-auto -mt-10">
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight whitespace-nowrap">
              Let us Bless the World Together
            </h1>
            <p className="text-base md:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed italic font-light mb-8">
              When you give, you don't just give money. You don't just give the resources needed to
              support our ministries. You don't just provide for our beneficiaries.<br />
              You give them HOPE.
            </p>
            {/* Donate Now CTA */}
            <div className="flex items-center justify-center">
              <button
                onClick={() => navigate('/campaigns')}
                className="px-12 py-4 bg-white text-[#63A6B2] font-bold text-lg rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Donate Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Section - Overlapping */}
      <div className="relative -mt-24 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCampaigns.map((campaign, index) => (
              <div
                key={campaign.campaign_id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer"
                style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
                onClick={() => navigate(`/campaigns/${campaign.campaign_id}/donate`)}
              >
                {/* Campaign Image */}
                <div className="relative h-64 overflow-hidden">
                  {campaign.file_url ? (
                    <img
                      src={`http://localhost:5000${campaign.file_url}`}
                      alt={campaign.campaign_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#63A6B2]/30 to-[#4a8a95]/30 flex items-center justify-center">
                      <svg className="w-16 h-16 text-[#63A6B2]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  {/* Featured Badge Removed */}
                </div>

                {/* Campaign Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">
                    {campaign.campaign_name}
                  </h3>
                  {campaign.foundation_name && (
                    <p className="text-xs text-[#63A6B2] font-medium mb-3">{campaign.foundation_name}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#63A6B2] font-semibold">{formatCurrency(campaign.current_amount || 0)}</span>
                      <span className="text-gray-600">{formatCurrency(campaign.goal_amount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#63A6B2] h-full rounded-full transition-all duration-1000"
                        style={{ width: `${calculateProgress(campaign.current_amount || 0, campaign.goal_amount)}%` }}
                      />
                    </div>
                  </div>

                  {/* Donate Button */}
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/campaigns/${campaign.campaign_id}/donate`); }}
                    className="w-full bg-[#63A6B2] hover:bg-[#5a959f] text-white py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg"
                  >
                    Donate
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* View All Campaigns Button */}
          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/campaigns')}
              className="px-8 py-3 border-2 border-[#63A6B2] text-[#63A6B2] hover:bg-[#63A6B2] hover:text-white rounded-full font-semibold transition-all duration-300"
            >
              View all campaigns
            </button>
          </div>
        </div>
      </div>

      {/* Impact Statistics Section */}
      <section id="impact-stats" className="py-20 bg-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Our Impact</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Together, we're creating meaningful change in communities across the Philippines
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {impactStats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl bg-white border-2 border-gray-100 hover:shadow-lg transition-shadow duration-300"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="text-4xl md:text-5xl font-bold text-[#63A6B2] mb-2">
                  <AnimatedCounter
                    end={stat.number}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </div>
                <div className="text-sm md:text-base text-gray-700 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                At Shepherd's Voice Radio and TV Foundation Inc, we are committed to empowering
                communities through compassion, service, and faith. Our mission is to provide hope
                and support to those who need it most.
              </p>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Through our various programs and campaigns, we touch lives, strengthen families,
                and build resilient communities across the Philippines.
              </p>
              <button className="bg-[#63A6B2] hover:bg-[#5a959f] text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-lg inline-flex items-center">
                Learn More About Us
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
            <div className="order-1 md:order-2">
              <img
                src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=600&fit=crop"
                alt="Our Mission"
                className="rounded-2xl shadow-2xl w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Ways to Help Section */}
      <section className="py-20 bg-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Ways to Help</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              There are many ways you can partner with us to make a difference
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {waysToHelp.map((way, index) => {
              const Icon = way.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 border-2 border-gray-100 hover:border-[#63A6B2] hover:shadow-xl transition-all duration-300 group cursor-pointer"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div className={`w-16 h-16 rounded-full ${way.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {way.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {way.description}
                  </p>
                  <button className="text-[#63A6B2] font-semibold inline-flex items-center hover:gap-2 transition-all">
                    Learn More
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Success Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=800&h=600&fit=crop"
                alt="Success Story"
                className="rounded-2xl shadow-2xl w-full h-[400px] object-cover"
              />
            </div>
            <div className="text-gray-900">
              <div className="text-sm font-semibold mb-4 text-[#63A6B2] uppercase tracking-wide">
                Success Story
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                From Struggle to Hope
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                "Through the support of Shepherd's Voice, our family received medical assistance
                when we needed it most. The care and compassion shown to us gave us hope during
                our darkest times."
              </p>
              <p className="text-gray-600 font-semibold mb-2">
                - Maria Santos
              </p>
              <p className="text-gray-500 text-sm mb-8">
                Medical Mission Beneficiary
              </p>
              <button className="bg-[#63A6B2] text-white hover:bg-[#5a959f] px-8 py-3 rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-lg inline-flex items-center">
                Read More Stories
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes progressBar {
          from {
            width: 0;
          }
        }
      `}</style>
    </div>
  );
}