import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const socialLinks = [
  {
    name: 'Facebook',
    handle: '@ShepherdsVoiceRTVF',
    description: 'Follow us for updates, stories, and live events.',
    href: 'https://www.facebook.com/ShepherdsVoiceRTVF',
    bg: 'bg-[#1877F2]',
    hoverBg: 'hover:bg-[#0e66d0]',
    icon: (
      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    handle: 'Shepherd\'s Voice RTVF',
    description: 'Watch our programs, testimonials, and campaign updates.',
    href: 'https://www.youtube.com/@ShepherdsVoiceRTVF',
    bg: 'bg-[#FF0000]',
    hoverBg: 'hover:bg-[#cc0000]',
    icon: (
      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    handle: '@svrtf_official',
    description: 'See our community moments and behind-the-scenes photos.',
    href: 'https://www.instagram.com/svrtf_official',
    bg: 'bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045]',
    hoverBg: 'hover:opacity-90',
    icon: (
      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
      </svg>
    ),
  },
  {
    name: 'X (Twitter)',
    handle: '@SVRTF_official',
    description: 'Get real-time news and announcements from our team.',
    href: 'https://twitter.com/SVRTF_official',
    bg: 'bg-black',
    hoverBg: 'hover:bg-gray-900',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

const contactDetails = [
  {
    icon: <Phone className="w-5 h-5 text-[#63A6B2]" />,
    label: 'Phone',
    value: '+63 (02) 8123-4567',
    href: 'tel:+6328123456',
  },
  {
    icon: <Mail className="w-5 h-5 text-[#63A6B2]" />,
    label: 'Email',
    value: 'donations@svrtf.org',
    href: 'mailto:donations@svrtf.org',
  },
  {
    icon: <MapPin className="w-5 h-5 text-[#63A6B2]" />,
    label: 'Address',
    value: 'J2GW+9H5, Ermin Garcia St, Quezon City, Metro Manila',
    href: null,
  },
  {
    icon: <Clock className="w-5 h-5 text-[#63A6B2]" />,
    label: 'Office Hours',
    value: 'Mon – Fri, 8:00 AM – 5:00 PM',
    href: null,
  },
];

export default function ContactUs() {
  const navigate = useNavigate();

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
            Thank you for your interest in Shepherd's Voice Radio and TV Foundation Inc. Reach out
            to us directly through any of the channels below — we're always happy to connect.
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">

            {/* Left — Direct Contact Info */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Information</h2>
              <p className="text-gray-500 text-sm mb-8">Reach us directly through phone, email, or visit us in person.</p>

              <div className="space-y-6">
                {contactDetails.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-teal-50 transition-colors">
                    <div className="w-10 h-10 bg-[#63A6B2]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-gray-900 font-medium hover:text-[#63A6B2] transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-gray-900 font-medium">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Google Maps Embed */}
              <div className="mt-8 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <iframe
                  title="SVRTF Location"
                  src="https://maps.google.com/maps?q=Quezon+City%2C+Metro+Manila%2C+Philippines&t=&z=13&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Right — Social Media Links */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect With Us</h2>
              <p className="text-gray-500 text-sm mb-8">Follow us on social media to stay updated on our campaigns, programs, and community stories.</p>

              <div className="space-y-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-5 p-5 rounded-2xl text-white shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${social.bg} ${social.hoverBg}`}
                  >
                    {/* Icon bubble */}
                    <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      {social.icon}
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg leading-tight">{social.name}</p>
                      <p className="text-white/80 text-sm truncate">{social.handle}</p>
                      <p className="text-white/70 text-xs mt-0.5 leading-snug">{social.description}</p>
                    </div>
                    {/* Arrow */}
                    <svg className="w-5 h-5 text-white/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>

              {/* Email CTA */}
              <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-[#63A6B2] to-[#4a8a95] text-white shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Prefer Email?</p>
                    <p className="text-white/80 text-sm">Send us a message directly at</p>
                    <a href="mailto:donations@svrtf.org" className="text-white font-semibold underline underline-offset-2 hover:text-teal-100 transition-colors text-sm">
                      donations@svrtf.org
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-teal-50 py-20 overflow-hidden">
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
            <button
              onClick={() => navigate('/campaigns')}
              className="bg-[#63A6B2] hover:bg-[#5a959f] text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 flex items-center"
            >
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
              <div className="flex space-x-3">
                {socialLinks.map((s) => (
                  <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition">
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/" className="text-white/90 hover:text-white transition">Home</a></li>
                <li><a href="/about" className="text-white/90 hover:text-white transition">About SVRTV</a></li>
                <li><a href="/campaigns" className="text-white/90 hover:text-white transition">Campaigns</a></li>
                <li><a href="/contact" className="text-white/90 hover:text-white transition">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-white mb-4">Contact</h3>
              <ul className="space-y-3 text-sm text-white/90">
                <li className="flex items-start space-x-2"><Mail className="w-5 h-5 mt-0.5 flex-shrink-0" /><span>donations@svrtf.org</span></li>
                <li className="flex items-start space-x-2"><Phone className="w-5 h-5 mt-0.5 flex-shrink-0" /><span>+63 (02) 8123-4567</span></li>
                <li className="flex items-start space-x-2"><MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" /><span>Quezon City, Philippines</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/90">
            <p>&copy; {new Date().getFullYear()} Shepherd's Voice Radio and TV Foundation Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
