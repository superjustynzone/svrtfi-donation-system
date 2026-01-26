import { X } from 'lucide-react';

const PrivacyModal = ({ isOpen, onClose }) => {
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
            <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Privacy Policy</h2>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
        </div>

        {/* Content Wrapper with Gradient */}
        <div className="relative flex-1 overflow-hidden">
          {/* Content - SCROLLABLE */}
          <div className="h-full overflow-y-auto px-10 pb-10 text-gray-600 custom-scrollbar">
            <p className="text-xs text-gray-500 mb-6 text-center leading-relaxed">
              Shepherd's Voice Radio and Television Foundation, Inc. respects your privacy and is committed to protecting your personal data.
            </p>

            <div className="space-y-6">
              {/* Section 1 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">1. Information We Collect</h3>
                <p className="text-xs leading-relaxed text-gray-600 mb-2">
                  We collect the following types of information:
                </p>
                <ul className="list-disc list-inside text-xs space-y-1 ml-4 text-gray-600">
                  <li><strong>Personal Information:</strong> Name, email address, contact details</li>
                  <li><strong>Donation Information:</strong> Payment details, donation history</li>
                  <li><strong>Usage Data:</strong> How you interact with our Platform</li>
                  <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
                </ul>
              </div>

              {/* Section 2 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">2. How We Use Your Information</h3>
                <p className="text-xs leading-relaxed text-gray-600 mb-2">
                  We use your information to:
                </p>
                <ul className="list-disc list-inside text-xs space-y-1 ml-4 text-gray-600">
                  <li>Process your donations and issue receipts</li>
                  <li>Send you updates about campaigns and our mission</li>
                  <li>Improve our Platform and services</li>
                  <li>Comply with legal obligations</li>
                  <li>Communicate with you about your account</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">3. Data Security</h3>
                <p className="text-xs leading-relaxed text-gray-600">
                  We implement appropriate security measures including SSL/TLS encryption, secure payment gateways, and regular security audits to protect your personal information.
                </p>
              </div>

              {/* Section 4 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">4. Sharing Your Information</h3>
                <p className="text-xs leading-relaxed text-gray-600 mb-2">
                  We do not sell your personal information. We may share your data with:
                </p>
                <ul className="list-disc list-inside text-xs space-y-1 ml-4 text-gray-600">
                  <li>Payment processors (GCash, PayMaya, PayPal)</li>
                  <li>Email and SMS service providers</li>
                  <li>Legal authorities when required by law</li>
                </ul>
              </div>

              {/* Section 5 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">5. Your Rights</h3>
                <p className="text-xs leading-relaxed text-gray-600 mb-2">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-xs space-y-1 ml-4 text-gray-600">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </div>

              {/* Section 6 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">6. Cookies and Tracking</h3>
                <p className="text-xs leading-relaxed text-gray-600">
                  We use cookies to enhance your experience and analyze platform usage.
                </p>
              </div>

              {/* Section 7 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">7. Third-Party Links</h3>
                <p className="text-xs leading-relaxed text-gray-600">
                  Our Platform may contain links to third-party websites. We are not responsible for their privacy practices.
                </p>
              </div>

              {/* Section 8 */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-2">8. Contact Us</h3>
                <p className="text-xs leading-relaxed text-gray-600">
                  If you have questions, contact us at: privacy@shepherdsvoice.org
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Gradient Blur Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none"></div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white flex-shrink-0 border-t">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-[#63A6B2] hover:bg-[#4fa3a3] text-white rounded-md font-semibold uppercase text-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;