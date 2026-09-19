import React, { useState } from 'react';
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  CreditCard,
  X,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { User, SubscriptionPlan, PaymentProvider } from '../types';

interface PricingViewProps {
  currentUser: User;
  onUpgradePlan: (plan: SubscriptionPlan, provider: PaymentProvider, amount: number) => void;
  onNavigate: (view: string) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({
  currentUser,
  onUpgradePlan,
  onNavigate,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<{
    id: SubscriptionPlan;
    name: string;
    price: number;
    billingPeriod: string;
  } | null>(null);

  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('BKASH');
  const [phoneNumber, setPhoneNumber] = useState('01712345678');
  const [transactionOtp, setTransactionOtp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'DETAILS' | 'OTP' | 'SUCCESS'>('DETAILS');

  const plans = [
    {
      id: 'FREE' as SubscriptionPlan,
      name: 'Free Explorer',
      price: 0,
      period: 'Forever Free',
      description: 'Ideal for getting started with diagnostic tests and daily practice questions.',
      popular: false,
      features: [
        'Access to all public model tests',
        'Standard negative marking evaluation',
        'Basic result scorecard',
        'Daily question of the day practice',
        'Community discussion view',
      ],
      notIncluded: [
        'Full 200-mark 47th BCS Prelims model series',
        'Question-wise detailed rationale & citations',
        'All-Bangladesh merit ranking percentile',
        'Unlimited bookmarks & PDF export',
      ],
    },
    {
      id: 'MONTHLY_PRO' as SubscriptionPlan,
      name: 'Monthly Pro Pass',
      price: 299,
      period: 'Per Month',
      description: 'Flexible monthly subscription for intense last-minute revision.',
      popular: false,
      features: [
        'Unlimited access to ALL BCS & Bank tests',
        'Full 200-mark 47th BCS Prelims master sets',
        'Instant detailed solution & explanations',
        'Live merit standing & percentile rank',
        'Subject-wise weakness diagnostic reports',
        'Unlimited question bookmarks',
      ],
      notIncluded: ['Offline question bank access', 'Priority tutor query support'],
    },
    {
      id: 'SIX_MONTH_PASS' as SubscriptionPlan,
      name: '6-Month BCS Special',
      price: 999,
      period: '6 Months (৳166/mo)',
      description: 'The most popular complete preparation package for 47th BCS Preliminary.',
      popular: true,
      features: [
        'Everything in Monthly Pro Pass',
        '6 months continuous model test access',
        'Combined 10 Bank Officer test series',
        'Primary Assistant Teacher recruitment mock tests',
        'Chapter-wise drill sets with 4,800+ questions',
        'Downloadable question banks with solutions',
        'Priority technical & exam support',
      ],
      notIncluded: [],
    },
    {
      id: 'ANNUAL_BCS_MASTER' as SubscriptionPlan,
      name: 'Annual All-Access Pass',
      price: 1499,
      period: '12 Months (৳125/mo)',
      description: 'Complete all-in-one exam prep for BCS, Bank Jobs & Varsity Admission.',
      popular: false,
      features: [
        'Everything in 6-Month Pass',
        'Full 12 months unlimited access',
        'BCS Written & Prelims combined test bank',
        'Dhaka University & GST admission past 10 years sets',
        'VIP access to newly released weekly live model tests',
        'Verified Student Certificate upon completion',
      ],
      notIncluded: [],
    },
  ];

  const handleStartCheckout = (plan: typeof plans[0]) => {
    if (plan.price === 0) return;
    setSelectedPlan({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      billingPeriod: plan.period,
    });
    setPaymentStep('DETAILS');
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStep('OTP');
    }, 800);
  };

  const handleVerifyOtp = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (selectedPlan) {
        onUpgradePlan(selectedPlan.id, paymentProvider, selectedPlan.price);
      }
      setPaymentStep('SUCCESS');
    }, 900);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Transparent Pricing Plans
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          Invest in Your Government Job & BCS Success
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Unlock the complete model test library, negative marking diagnostic engine, and all-Bangladesh merit standings.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentUser.isPremium && currentUser.subscriptionPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between transition-all relative ${
                plan.popular
                  ? 'border-2 border-emerald-500 bg-white dark:bg-slate-900 shadow-xl shadow-emerald-500/10 scale-102 z-10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                  Recommended for 47th BCS
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px] leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline gap-1 text-slate-900 dark:text-white">
                    <span className="text-3xl sm:text-4xl font-black">
                      {plan.price === 0 ? '৳0' : `৳${plan.price}`}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{plan.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    What's Included:
                  </span>
                  {plan.features.map((f, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((nf, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-400 opacity-60">
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-through">{nf}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                {plan.price === 0 ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold"
                  >
                    Included by Default
                  </button>
                ) : isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold"
                  >
                    Your Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartCheckout(plan)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                      plan.popular
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" /> Upgrade with {plan.name.split(' ')[0]}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulated Payment Gateway Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Secure Checkout
                </h3>
                <p className="text-xs text-slate-500">{selectedPlan.name} • ৳{selectedPlan.price} BDT</p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentStep === 'DETAILS' && (
              <div className="space-y-4">
                {/* Select Provider */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Select Mobile Banking / Card Provider
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentProvider('BKASH')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        paymentProvider === 'BKASH'
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="block text-xs font-black">bKash</span>
                      <span className="text-[10px] text-slate-400">Direct Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentProvider('NAGAD')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        paymentProvider === 'NAGAD'
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="block text-xs font-black">Nagad</span>
                      <span className="text-[10px] text-slate-400">Mobile Wallet</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentProvider('SSLCOMMERZ')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        paymentProvider === 'SSLCOMMERZ'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="block text-xs font-black">Card/Bank</span>
                      <span className="text-[10px] text-slate-400">Visa / Master</span>
                    </button>
                  </div>
                </div>

                {/* Phone number input */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Your {paymentProvider} Account Mobile Number
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    A test simulation OTP will be requested in the next step.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    disabled={isProcessing}
                    onClick={handleConfirmPayment}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                  >
                    {isProcessing ? 'Connecting Gateway...' : `Proceed to Pay ৳${selectedPlan.price}`}
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'OTP' && (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Enter Verification OTP
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    We sent a simulated 4-digit code to <strong>{phoneNumber}</strong>
                  </p>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 1234"
                  value={transactionOtp}
                  onChange={(e) => setTransactionOtp(e.target.value)}
                  className="w-40 text-center tracking-widest font-mono text-lg p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mx-auto block"
                />

                <p className="text-[11px] text-emerald-600 font-semibold">
                  (Demo Hint: Type any code like 1234 to complete)
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setPaymentStep('DETAILS')}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Back
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={handleVerifyOtp}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    {isProcessing ? 'Verifying...' : 'Confirm & Activate'}
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'SUCCESS' && (
              <div className="space-y-4 text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-slate-900 dark:text-white">
                    Pro Membership Activated!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    You now have full access to all 47th BCS, Bank and University model tests.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    onNavigate('quizzes');
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Start Taking Pro Model Tests &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
