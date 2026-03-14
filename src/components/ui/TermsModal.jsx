import React, { useState } from 'react';
import { X } from 'lucide-react';

const TermsModal = ({ isOpen, onClose, onAccept }) => {
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
            <h2 style={{fontSize: '1.125rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap'}}>Terms of Service</h2>
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
            This summary is provided only for convenience. Please review the Terms of Service below in their entirety for important information and legal stipulations that apply to your use of the Platform.
          </p>

          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>1. Acceptance of Terms</h3>
              <p style={{fontSize: '0.75rem'}}>By accessing and using the Shepherd's Voice Donation Platform, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
            </div>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>2. User Accounts</h3>
              <p style={{fontSize: '0.75rem', marginBottom: '0.5rem'}}>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:</p>
              <ul style={{listStyleType: 'disc', paddingLeft: '1.5rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                <li>Provide accurate and complete information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Use the platform only for lawful purposes</li>
              </ul>
            </div>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>3. Donations</h3>
              <p style={{fontSize: '0.75rem', marginBottom: '0.5rem'}}>All donations made through the Platform are:</p>
              <ul style={{listStyleType: 'disc', paddingLeft: '1.5rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                <li>Final and non-refundable</li>
                <li>Tax-deductible to the extent allowed by law</li>
                <li>Subject to verification and processing</li>
                <li>Used in accordance with our mission and values</li>
              </ul>
            </div>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>4. Acceptable Use</h3>
              <p style={{fontSize: '0.75rem', marginBottom: '0.5rem'}}>You agree not to:</p>
              <ul style={{listStyleType: 'disc', paddingLeft: '1.5rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                <li>Use the platform for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to any systems</li>
                <li>Interfere with platform operations or security</li>
                <li>Impersonate others or provide false information</li>
              </ul>
            </div>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>5. Limitation of Liability</h3>
              <p style={{fontSize: '0.75rem'}}>Shepherd's Voice Radio and Television Foundation, Inc. shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.</p>
            </div>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>6. Intellectual Property</h3>
              <p style={{fontSize: '0.75rem'}}>All content on the Platform is owned by Shepherd's Voice and protected by copyright and trademark laws.</p>
            </div>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>7. Termination</h3>
              <p style={{fontSize: '0.75rem'}}>We reserve the right to suspend or terminate your account at any time for violations of these Terms.</p>
            </div>
            <div>
              <h3 style={{fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem'}}>8. Changes to Terms</h3>
              <p style={{fontSize: '0.75rem'}}>We may update these Terms from time to time. Continued use of the Platform constitutes acceptance of the updated Terms.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{flexShrink: 0, padding: '1.5rem', borderTop: '1px solid #e5e7eb', background: 'white', display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
          {!isScrolledToBottom && (
            <p style={{fontSize: '0.75rem', textAlign: 'center', color: '#6b7280', fontWeight: 600}}>
              Please scroll to the bottom to accept the Terms of Service
            </p>
          )}
          <div style={{display: 'flex', gap: '0.75rem'}}>
            <button
              onClick={onAccept}
              disabled={!isScrolledToBottom}
              style={{
                flex: 1, padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase',
                cursor: isScrolledToBottom ? 'pointer' : 'not-allowed',
                border: 'none',
                background: isScrolledToBottom ? 'linear-gradient(to right, #63A6B2, #4a8a95)' : '#d1d5db',
                color: isScrolledToBottom ? 'white' : '#9ca3af',
                transition: 'all 0.2s'
              }}
            >
              Accept
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase',
                cursor: 'pointer', background: 'white',
                border: '2px solid #d1d5db', color: '#374151',
                transition: 'all 0.2s'
              }}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;