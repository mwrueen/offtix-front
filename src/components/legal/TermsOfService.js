import React from 'react';
import { Link } from 'react-router-dom';
import UnifiedHeader from '../layout/UnifiedHeader';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white">
      <UnifiedHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12">

        {/* Page Header */}
        <div className="mb-10 text-center sm:text-left border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
            Legal & Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Terms of Service
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
              Agreement to Terms
            </h2>
            <p className="text-slate-600">
              By accessing, browsing, or creating an account on Offtix ("Platform"), you agree to be legally bound by these Terms of Service ("Terms") and our Privacy Policy. If you are accepting these Terms on behalf of an organization or enterprise, you represent that you have authority to bind that entity.
            </p>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-black flex items-center justify-center border border-indigo-100">2</span>
              Services Provided
            </h2>
            <p className="text-slate-600">
              Offtix provides SaaS tools for project tracking, task management, workforce organization, internal communications, and career portals. We reserve the right to upgrade, modify, or enhance system features to deliver continuous performance and reliability improvements.
            </p>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-black flex items-center justify-center border border-indigo-100">3</span>
              Account Responsibilities
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>You must provide accurate and complete registration details.</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials and authentication tokens.</li>
              <li>You are fully responsible for all activities occurring under your account or workspace environment.</li>
            </ul>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-black flex items-center justify-center border border-indigo-100">4</span>
              Acceptable Use Policy
            </h2>
            <p className="text-slate-600 mb-4">
              When using Offtix, you agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>Upload malicious code, viruses, or software intended to interrupt system integrity.</li>
              <li>Attempt unauthorized access to other workspace tenants or core platform infrastructure.</li>
              <li>Scrape, reverse engineer, or decompile the software or platform endpoints.</li>
              <li>Use the platform for any illegal activities or unauthorized commercial exploitation.</li>
            </ul>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-black flex items-center justify-center border border-indigo-100">5</span>
              Intellectual Property
            </h2>
            <p className="text-slate-600">
              Offtix retains all rights, titles, and interests in the platform architecture, software, UI design, logos, and trademarks. Users and companies retain full ownership of their uploaded workspace data, project assets, and applicant submissions.
            </p>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-black flex items-center justify-center border border-indigo-100">6</span>
              Limitation of Liability
            </h2>
            <p className="text-slate-600">
              To the maximum extent permitted by law, Offtix and its officers shall not be liable for indirect, incidental, consequential, or punitive damages resulting from platform downtime, loss of data, or service interruptions.
            </p>
          </section>

          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-black flex items-center justify-center border border-indigo-100">7</span>
              Contact Information
            </h2>
            <p className="text-slate-600">
              For legal inquiries regarding these Terms of Service, please contact us at{' '}
              <a href="mailto:terms@offtix.com" className="text-indigo-600 font-bold hover:underline">
                terms@offtix.com
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
            <Link to="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-indigo-600 font-bold hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
