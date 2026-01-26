import { X } from 'lucide-react';

const TermsModal = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col animate-slideUp">
        
        {/* Header with Logo */}
        <div className="p-8 pb-6 flex flex-col items-center relative bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="mb-4 animate-scaleIn">
            <img
              src="/images/logo.png"
              alt="Shepherd's Voice"
              className="h-12 w-auto object-contain"
            />
          </div>
          
          {/* Horizontal line */}
          <div className="w-full flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Terms of Service</h2>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
        </div>

        {/* Content Wrapper with Gradient */}
        <div className="relative flex-1 overflow-hidden">
          {/* Content - SCROLLABLE */}
          <div className="h-full overflow-y-auto px-10 pb-10 text-gray-600 custom-scrollbar">
            <p className="text-xs text-gray-500 mb-6 text-center leading-relaxed">
              This summary is provided only for convenience. Please review the Terms of Service below in their entirety for important information and legal stipulations that apply to your use of the Platform for the sharing and viewing of online for mobile devices and personal computers.
            </p>

            <div className="space-y-6">
              {/* Section 1 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">1. Acceptance of Terms</h3>
                <p className="text-xs leading-relaxed text-gray-600">
                  By accessing and using the Shepherd's Voice Donation Platform, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
                </p>
              </div>

              {/* Section 2 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">2. User Accounts</h3>
                <p className="text-xs leading-relaxed text-gray-600 mb-2">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
                </p>
                <ul className="list-disc list-inside text-xs space-y-1 ml-4 text-gray-600">
                  <li>Provide accurate and complete information</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Notify us immediately of any unauthorized use</li>
                  <li>Use the platform only for lawful purposes</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">3. Donations</h3>
                <p className="text-xs leading-relaxed text-gray-600 mb-2">
                  All donations made through the Platform are:
                </p>
                <ul className="list-disc list-inside text-xs space-y-1 ml-4 text-gray-600">
                  <li>Final and non-refundable</li>
                  <li>Tax-deductible to the extent allowed by law</li>
                  <li>Subject to verification and processing</li>
                  <li>Used in accordance with our mission and values</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">4. Acceptable Use</h3>
                <p className="text-xs leading-relaxed text-gray-600 mb-2">
                  You agree not to:
                </p>
                <ul className="list-disc list-inside text-xs space-y-1 ml-4 text-gray-600">
                  <li>Use the platform for any illegal purpose</li>
                  <li>Attempt to gain unauthorized access to any systems</li>
                  <li>Interfere with platform operations or security</li>
                  <li>Impersonate others or provide false information</li>
                </ul>
              </div>

              {/* Section 5 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">5. Limitation of Liability</h3>
                <p className="text-xs leading-relaxed text-gray-600">
                  Shepherd's Voice Radio and Television Foundation, Inc. shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.
                </p>
              </div>

              {/* Section 6 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">6. Intellectual Property</h3>
                <p className="text-xs leading-relaxed text-gray-600">
                  All content on the Platform is owned by Shepherd's Voice and protected by copyright and trademark laws.
                </p>
              </div>

              {/* Section 7 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">7. Termination</h3>
                <p className="text-xs leading-relaxed text-gray-600">
                  We reserve the right to suspend or terminate your account at any time for violations of these Terms.
                </p>
              </div>

              {/* Section 8 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">8. Changes to Terms</h3>
                <p className="text-xs leading-relaxed text-gray-600">
                  We may update these Terms from time to time. Continued use of the Platform constitutes acceptance of the updated Terms.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Gradient Blur Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none"></div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 flex gap-3 bg-white flex-shrink-0 border-t">
          <button
            onClick={onAccept}
            className="flex-1 px-6 py-3 bg-[#63A6B2] hover:bg-[#4fa3a3] text-white rounded-md font-semibold uppercase text-sm transition-all"
          >
            Accept
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-md font-semibold uppercase text-sm text-gray-700 hover:bg-gray-50 transition-all"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;