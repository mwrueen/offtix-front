import React from 'react';
import { Link } from 'react-router-dom';
import UnifiedHeader from '../layout/UnifiedHeader';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white">
      <UnifiedHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Page Header */}
        <div className="mb-10 text-center sm:text-left border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
            Legal & Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-slate-500 font-medium">
            Last updated: August 18, 2026 • Effective Date: January 1, 2026
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-black flex items-center justify-center border border-indigo-100">1</span>
              Information We Collect
            </h2>
            <p className="text-slate-600 mb-4">
              At Offtix, we collect information necessary to deliver high-fidelity project management, employee orchestration, and career application services.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li><strong className="text-slate-900">Account Data:</strong> Name, email address, password hash, phone number, workplace designation, and profile picture.</li>
              <li><strong className="text-slate-900">Workplace & Project Data:</strong> Organization details, project tasks, comments, files, leave applications, and team activities.</li>
              <li><strong className="text-slate-900">Applicant Data:</strong> Resumes, cover letters, portfolios, work history, and contact information submitted via the Careers Portal.</li>
              <li><strong className="text-slate-900">Technical Logs:</strong> IP address, browser type, device details, login timestamps, and system telemetry to ensure uptime and performance.</li>
            </ul>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-black flex items-center justify-center border border-indigo-100">2</span>
              How We Use Your Information
            </h2>
            <p className="text-slate-600 mb-4">
              We process your data strictly to operate, maintain, and optimize the Offtix platform services:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>Provide collaborative project management and workforce analytics tools.</li>
              <li>Facilitate job applications and employer recruitment communications.</li>
              <li>Authenticate users, prevent unauthorized access, and enforce security policies.</li>
              <li>Send critical system updates, task notifications, and administrative alerts.</li>
            </ul>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-black flex items-center justify-center border border-indigo-100">3</span>
              Data Sharing & Disclosure
            </h2>
            <p className="text-slate-600 mb-4">
              Offtix does not sell, rent, or trade personal data to third-party advertisers. We share information only under the following conditions:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li><strong className="text-slate-900">Organization Administrators:</strong> If your account belongs to a company workspace, designated administrators can view your role, tasks, and activity.</li>
              <li><strong className="text-slate-900">Trusted Infrastructure Vendors:</strong> Sub-processors providing cloud hosting, database storage, and email delivery bound by confidentiality obligations.</li>
              <li><strong className="text-slate-900">Legal Compliance:</strong> When required by valid legal processes, subpoenas, or statutory obligations.</li>
            </ul>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-black flex items-center justify-center border border-indigo-100">4</span>
              Security & Protection
            </h2>
            <p className="text-slate-600">
              We deploy industry-standard security protocols including TLS 1.3 encryption in transit, AES-256 encryption at rest, role-based access control (RBAC), and continuous threat monitoring to safeguard your organizational data against unauthorized exposure.
            </p>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-black flex items-center justify-center border border-indigo-100">5</span>
              Your Data Rights
            </h2>
            <p className="text-slate-600 mb-4">
              Depending on your jurisdiction, you have rights regarding your personal information:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>Request access to or a copy of your stored personal information.</li>
              <li>Request corrections to inaccurate account details via profile settings.</li>
              <li>Request full account or applicant data deletion by contacting support.</li>
            </ul>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-black flex items-center justify-center border border-indigo-100">6</span>
              Contact Us
            </h2>
            <p className="text-slate-600">
              If you have any questions, privacy concerns, or compliance requests, please reach out to our legal privacy team at{' '}
              <a href="mailto:privacy@offtix.com" className="text-indigo-600 font-bold hover:underline">
                privacy@offtix.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white px-4 sm:px-10 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 text-xs font-semibold">
          <div>© 2026 Offtix Inc. All rights reserved.</div>
          <div className="flex items-center space-x-6">
            <Link to="/privacy" className="text-indigo-600 font-bold hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
