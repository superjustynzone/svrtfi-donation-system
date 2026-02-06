import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Heart, Users, HandHeart, TrendingUp, Calendar, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import { Toaster } from "sonner";
export { Toaster };
import Navbar from '../components/Navbar';


export default function Homepage() {
  const [countersVisible, setCountersVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const campaigns = [
    {
      id: 1,
      title: 'Care Beyond Age',
      image: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=800&h=600&fit=crop',
      raised: 200000,
      goal: 500000
    },
    {
      id: 2,
      title: 'Medical Mission',
      image: 'https://images.unsplash.com/photo-1576765608622-067973a79f53?w=800&h=600&fit=crop',
      raised: 300000,
      goal: 500000
    },
    {
      id: 3,
      title: 'Born to Bloom',
      image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=600&fit=crop',
      raised: 200000,
      goal: 500000
    }
  ];

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
          className="relative h-[850px] md:h-[950px] flex items-center justify-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600&h=800&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-[#63A6B2]/70"></div>

          {/* Content */}
          <div className="relative z-10 text-center px-4 max-w-full mx-auto -mt-20">
            <h1 className="text-3xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight whitespace-nowrap">
              Let us Bless the World Together
            </h1>
            <p className="text-base md:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed italic font-light">
              When you give, you don't just give money. You don't just give the resources needed to
              support our ministries. You don't just provide for our beneficiaries.<br />
              You give them HOPE.
            </p>
          </div>
        </div>
      </div>

      {/* Campaigns Section - Overlapping */}
      <div className="relative -mt-40 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {campaigns.map((campaign, index) => (
              <div
                key={campaign.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Campaign Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={campaign.image}
                    alt={campaign.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>

                {/* Campaign Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {campaign.title}
                  </h3>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#63A6B2] font-semibold">
                        {formatCurrency(campaign.raised)}
                      </span>
                      <span className="text-gray-600">
                        {formatCurrency(campaign.goal)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#63A6B2] h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${calculateProgress(campaign.raised, campaign.goal)}%`,
                          animation: `progressBar 1.5s ease-out ${index * 0.2}s both`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Donate Button */}
                  <button className="w-full bg-[#63A6B2] hover:bg-[#5a959f] text-white py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg">
                    Donate
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* View All Campaigns Button */}
          <div className="text-center mt-12">
            <button className="px-8 py-3 border-2 border-[#63A6B2] text-[#63A6B2] hover:bg-[#63A6B2] hover:text-white rounded-full font-semibold transition-all duration-300">
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
                <li><a href="#" className="text-white/90 hover:text-white transition">Home</a></li>
                <li><a href="#" className="text-white/90 hover:text-white transition">About SVRTV</a></li>
                <li><a href="#" className="text-white/90 hover:text-white transition">Campaigns</a></li>
                <li><a href="#" className="text-white/90 hover:text-white transition">Contact Us</a></li>
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