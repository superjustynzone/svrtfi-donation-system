import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const TermsModal = ({ isOpen, onClose, onAccept }) => {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [siteSettings, setSiteSettings] = useState({ terms: '' });

  useEffect(() => {
    if (isOpen) {
      fetch('http://localhost:5000/api/admin/site-settings')
        .then(res => res.json())
        .then(data => setSiteSettings({ terms: data.terms_and_conditions || '<p>Terms and conditions content not available.</p>' }))
        .catch(err => console.log('Error fetching settings:', err));
    }
  }, [isOpen]);

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
            overflowX: 'hidden',
            wordBreak: 'break-word',
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

          <div className="prose prose-sm w-full max-w-full break-words prose-p:text-gray-700 prose-ul:my-1 prose-headings:text-gray-900 prose-a:text-[#63A6B2] overflow-x-hidden" dangerouslySetInnerHTML={{ __html: siteSettings.terms }} />
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