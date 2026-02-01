import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'RoyaleHaus Privacy Policy - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
            <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
            </svg>
            <span className="text-sm font-semibold text-amber-300">RoyaleHaus</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-amber-200/60 text-sm">
            Last updated: February 1, 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-gradient-to-b from-slate-900/80 to-slate-900/60 border border-amber-500/20 rounded-2xl p-8 shadow-xl backdrop-blur-xl space-y-8">
          
          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">1</span>
              Introduction
            </h2>
            <p className="text-amber-100/70 text-sm leading-relaxed">
              Welcome to RoyaleHaus, part of the Haus Universe. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">2</span>
              Information We Collect
            </h2>
            <div className="text-amber-100/70 text-sm leading-relaxed space-y-3">
              <p><strong className="text-amber-200">Account Information:</strong> When you create an account, we collect your email address, username, and password (encrypted).</p>
              <p><strong className="text-amber-200">Game Progress:</strong> We store your game scores, achievements, XP points, and level progression to provide you with a personalized experience.</p>
              <p><strong className="text-amber-200">Usage Data:</strong> We may collect information about how you interact with our games to improve our services.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">3</span>
              How We Use Your Information
            </h2>
            <ul className="text-amber-100/70 text-sm leading-relaxed space-y-2 list-disc list-inside">
              <li>To provide and maintain our services</li>
              <li>To save your game progress and display it on leaderboards</li>
              <li>To enable cross-platform functionality across Haus Universe apps</li>
              <li>To improve and personalize your experience</li>
              <li>To communicate with you about updates or changes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">4</span>
              Data Security
            </h2>
            <p className="text-amber-100/70 text-sm leading-relaxed">
              We implement industry-standard security measures to protect your personal information. Your password is encrypted using bcrypt hashing, and all data is transmitted over secure HTTPS connections. We never store plain-text passwords.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">5</span>
              Haus Universe & Data Sharing
            </h2>
            <p className="text-amber-100/70 text-sm leading-relaxed">
              Your account works across all Haus Universe platforms (RoyaleHaus, OnePieceHaus, and future apps). Your basic profile information is shared between these services, but we never sell or share your data with third parties outside our network.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">6</span>
              Your Rights
            </h2>
            <div className="text-amber-100/70 text-sm leading-relaxed space-y-2">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your account</li>
                <li>Export your data</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">7</span>
              Contact Us
            </h2>
            <p className="text-amber-100/70 text-sm leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us through our official channels. We are committed to addressing any concerns you may have about your privacy.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-semibold hover:bg-amber-500/30 transition"
          >
            ← Back to RoyaleHaus
          </Link>
        </div>
      </div>
    </div>
  );
}
