import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { subscriptionAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import UnifiedHeader from '../layout/UnifiedHeader';

const PricingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state, refreshUser } = useAuth();
  
  const [status, setStatus] = useState(null);
  const [planConfig, setPlanConfig] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    fetchSubscriptionData();

    // Check query params for Stripe Checkout return
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');

    if (success && sessionId) {
      setAlertMessage('🎉 Payment successful! Verifying and updating your subscription...');
      subscriptionAPI.verifySession(sessionId)
        .then(async () => {
          setAlertMessage('✅ Congratulations! Your account has been upgraded to Premium.');
          if (refreshUser) await refreshUser();
          fetchSubscriptionData();
        })
        .catch(err => {
          console.error('Session verify error:', err);
          setAlertMessage('Payment completed. Subscription activation in progress...');
        });
    } else if (canceled) {
      setAlertMessage('ℹ️ Checkout was canceled. You remain on the Free plan.');
    }
  }, [searchParams, state?.isAuthenticated]);

  const fetchSubscriptionData = async () => {
    try {
      // 1. Fetch public plan configuration set by SuperAdmin (price & features)
      const configRes = await subscriptionAPI.getPlanConfig();
      if (configRes.data) {
        setPlanConfig(configRes.data);
      }

      // 2. Fetch active user status if authenticated
      if (state?.isAuthenticated) {
        try {
          const statusRes = await subscriptionAPI.getStatus();
          setStatus(statusRes.data);
          if (refreshUser) await refreshUser();
        } catch (e) {
          // Ignore non-auth error
        }
      }
    } catch (err) {
      console.error('Error loading subscription plan config:', err);
    }
  };


  const handleSubscribe = async () => {
    if (!state.isAuthenticated) {
      return navigate('/signin');
    }

    setCheckoutLoading(true);
    try {
      const response = await subscriptionAPI.createCheckoutSession();
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert(err.response?.data?.error || 'Failed to initiate Stripe Checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isPremium = status?.isPremium || false;
  // SuperAdmin configured price ($/month)
  const priceVal = planConfig?.monthlyPrice !== undefined ? planConfig.monthlyPrice : 10;
  const priceDisplay = `$${priceVal}`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Unified Navbar Header */}
      <UnifiedHeader />

      {/* Main Content Area Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">
        
        {/* Title & Subtitle Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
            Flexible Subscription Plans
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Upgrade Your Offtix Experience
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Unlock AI tools system-wide, project file management, chat document sharing, and task completion file attachments.
          </p>
        </div>

        {/* Alert Notification Banner */}
        {alertMessage && (
          <div className="max-w-2xl mx-auto mb-10 p-4 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-2xl text-center text-xs sm:text-sm font-semibold shadow-xs">
            {alertMessage}
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          
          {/* Free Tier Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
            <div>
              <div className="flex justify-between items-center mb-5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free Starter</span>
                {!isPremium && (
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-full">
                    Current Plan
                  </span>
                )}
              </div>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl sm:text-5xl font-extrabold text-slate-900">$0</span>
                <span className="text-slate-500 text-xs font-semibold">/ forever</span>
              </div>

              <p className="text-xs text-slate-600 mb-8 leading-relaxed">
                Basic workspace access for team collaboration and task tracking without file attachments or AI tools.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Unlimited Workspace Projects & Tasks</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Standard Team & Direct Chat Messaging</span>
                </div>
                
                {/* Dynamic Restrictions based on SuperAdmin config */}
                {planConfig?.freeRestrictions?.allowAI ? (
                  <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <span>System-wide AI Assistance</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-xs text-slate-400 line-through">
                    <svg className="w-4 h-4 text-rose-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    <span>System-wide AI Assistance</span>
                  </div>
                )}

                {planConfig?.freeRestrictions?.allowProjectFiles ? (
                  <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <span>Project File Uploads & Attachments</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-xs text-slate-400 line-through">
                    <svg className="w-4 h-4 text-rose-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    <span>Project File Uploads & Attachments</span>
                  </div>
                )}

                {planConfig?.freeRestrictions?.allowChatDocs ? (
                  <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <span>Chat Document & File Sending</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-xs text-slate-400 line-through">
                    <svg className="w-4 h-4 text-rose-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    <span>Chat Document & File Sending</span>
                  </div>
                )}

                {planConfig?.freeRestrictions?.allowTaskCompletionDocs ? (
                  <div className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <span>Task Completion Document Attachments</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-xs text-slate-400 line-through">
                    <svg className="w-4 h-4 text-rose-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    <span>Task Completion Document Attachments</span>
                  </div>
                )}
              </div>
            </div>

            <button
              disabled
              className="w-full py-3.5 bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs rounded-2xl cursor-not-allowed text-center"
            >
              {!isPremium ? 'Active Free Plan' : 'Free Tier'}
            </button>
          </div>

          {/* Premium Plan Card */}
          <div className="bg-white border-2 border-indigo-600 rounded-3xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl shadow-sm">
              Most Popular
            </div>

            <div>
              <div className="flex justify-between items-center mb-5">
                <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
                  {planConfig?.name || 'Premium Plan'}
                </span>
                {isPremium && (
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] rounded-full">
                    Active Subscription
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5 mb-6">
                <span className="text-4xl sm:text-5xl font-extrabold text-slate-900">{priceDisplay}</span>
                <span className="text-slate-500 text-xs font-semibold">/ month</span>
              </div>

              <p className="text-xs text-slate-600 mb-8 leading-relaxed">
                {planConfig?.description || 'Complete access to all advanced AI features, file attachments, and document uploads across the system.'}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-xs text-slate-800 font-semibold">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span><strong className="text-indigo-600">AI Assistant System-Wide</strong> (Tasks, Jobs, Transcripts)</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-800 font-semibold">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span><strong className="text-indigo-600">Project File Uploads</strong> & Document Attachments</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-800 font-semibold">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span><strong className="text-indigo-600">Chat File & Document Sending</strong> (Project & Team DM)</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-800 font-semibold">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span><strong className="text-indigo-600">Task Completion Proof</strong> Document Attachments</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-800 font-semibold">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Priority Support & SSL Secured Checkout</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={checkoutLoading || isPremium}
              className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                isPremium
                  ? 'bg-emerald-600 text-white cursor-default opacity-90'
                  : checkoutLoading
                  ? 'bg-indigo-400 text-white cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.99] shadow-indigo-600/20'
              }`}
            >
              {isPremium ? (
                'You are on Premium'
              ) : checkoutLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Connecting to Stripe...
                </>
              ) : (
                <>
                  Upgrade to Premium Now ({priceDisplay}/mo)
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>

        </div>

      </main>

      {/* Unified Page Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs font-medium">
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <Link to="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
          </div>
          <p>© {new Date().getFullYear()} Offtix Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
