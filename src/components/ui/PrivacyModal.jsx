import React, { useState } from 'react';
import { X } from 'lucide-react';

const PrivacyModal = ({ isOpen, onClose }) => {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      setIsScrolledToBottom(true);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white', borderRadius: '1rem', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        width: '100%', maxWidth: '48rem',
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{flexShrink: 0, padding: '2rem 2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', borderBottom: '1px solid #e5e7eb'}}>
          <button onClick={onClose} style={{position: 'absolute', top: '1.5rem', right: '1.5rem', color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none'}}>
            <X size={24} />
          </button>
          <div style={{marginBottom: '1rem'}}>
            <img src="/images/logo.png" alt="Shepherd's Voice" style={{height: '3rem', objectFit: 'contain'}} />
          </div>
          <div style={{width: '100%', display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <div style={{flex: 1, height: '1px', background: '#d1d5db'}}></div>
            <h2 style={{fontSize: '1.125rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap'}}>Privacy Policy</h2>
            <div style={{flex: 1, height: '1px', background: '#d1d5db'}}></div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          onScroll={handleScroll}
          style={{
            flex: '1 1 0%',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '1.5rem 2.5rem 2.5rem',
            color: '#4b5563',
            fontSize: '0.875rem',
            lineHeight: '1.625'
          }}
        >
          <p style={{fontSize: '0.75rem', color: '#6b7280', marginBottom: '1.5rem', textAlign: 'center'}}>
            Shepherd's Voice Radio and Television Foundation, Inc. respects your privacy and is committed to protecting your personal data.
          </p>

          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>1. Information We Collect</h3>
              <p style={{fontSize: '0.75rem', marginBottom: '0.5rem'}}>We collect the following types of information:</p>
              <ul style={{listStyleType: 'disc', paddingLeft: '1.5rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                <li><strong>Personal Information:</strong> Name, email address, contact details</li>
                <li><strong>Donation Information:</strong> Payment details, donation history</li>
                <li><strong>Usage Data:</strong> How you interact with our Platform</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
              </ul>
            </div>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>2. How We Use Your Information</h3>
              <p style={{fontSize: '0.75rem', marginBottom: '0.5rem'}}>We use your information to:</p>
              <ul style={{listStyleType: 'disc', paddingLeft: '1.5rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                <li>Process your donations and issue receipts</li>
                <li>Send you updates about campaigns and our mission</li>
                <li>Improve our Platform and services</li>
                <li>Comply with legal obligations</li>
                <li>Communicate with you about your account</li>
              </ul>
            </div>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>3. Data Security</h3>
              <p style={{fontSize: '0.75rem'}}>We implement appropriate security measures including SSL/TLS encryption, secure payment gateways, and regular security audits to protect your personal information.</p>
            </div>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>4. Sharing Your Information</h3>
              <p style={{fontSize: '0.75rem', marginBottom: '0.5rem'}}>We do not sell your personal information. We may share your data with:</p>
              <ul style={{listStyleType: 'disc', paddingLeft: '1.5rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                <li>Payment processors (GCash, PayMaya, PayPal)</li>
                <li>Email and SMS service providers</li>
                <li>Legal authorities when required by law</li>
              </ul>
            </div>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>5. Your Rights</h3>
              <p style={{fontSize: '0.75rem', marginBottom: '0.5rem'}}>You have the right to:</p>
              <ul style={{listStyleType: 'disc', paddingLeft: '1.5rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </div>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>6. Cookies and Tracking</h3>
              <p style={{fontSize: '0.75rem'}}>We use cookies to enhance your experience and analyze platform usage.</p>
            </div>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>7. Third-Party Links</h3>
              <p style={{fontSize: '0.75rem'}}>Our Platform may contain links to third-party websites. We are not responsible for their privacy practices.</p>
            </div>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>8. Contact Us</h3>
              <p style={{fontSize: '0.75rem'}}>If you have questions, contact us at: privacy@shepherdsvoice.org</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{flexShrink: 0, padding: '1.5rem', borderTop: '1px solid #e5e7eb', background: 'white'}}>
          {!isScrolledToBottom && (
            <p style={{fontSize: '0.75rem', textAlign: 'center', color: '#6b7280', marginBottom: '0.75rem', fontWeight: 600}}>
              Please scroll to the bottom to accept the Privacy Policy
            </p>
          )}
          <button
            onClick={onClose}
            disabled={!isScrolledToBottom}
            style={{
              width: '100%', padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
              fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase',
              cursor: isScrolledToBottom ? 'pointer' : 'not-allowed',
              border: 'none',
              background: isScrolledToBottom ? 'linear-gradient(to right, #63A6B2, #4a8a95)' : '#d1d5db',
              color: isScrolledToBottom ? 'white' : '#9ca3af',
              transition: 'all 0.2s'
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;