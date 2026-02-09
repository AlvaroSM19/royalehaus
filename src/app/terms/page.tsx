import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'RoyaleHaus Terms of Service - Rules and guidelines for using our Clash Royale mini-games and services.',
};

export default function TermsPage() {
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
            Terms of Service
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
              Acceptance of Terms
            </h2>
            <p className="text-amber-100/70 text-sm leading-relaxed">
              By accessing and using RoyaleHaus, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. RoyaleHaus is part of the Haus Universe, and these terms apply to your use across all connected platforms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">2</span>
              Description of Service
            </h2>
            <p className="text-amber-100/70 text-sm leading-relaxed">
              RoyaleHaus provides free-to-play mini-games and quizzes based on Clash Royale. Our services include leaderboards, progress tracking, XP systems, and cross-platform account functionality within the Haus Universe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">3</span>
              User Accounts
            </h2>
            <div className="text-amber-100/70 text-sm leading-relaxed space-y-3">
              <p>When creating an account, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your password</li>
                <li>Not share your account credentials with others</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Use appropriate and respectful usernames</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">4</span>
              Acceptable Use
            </h2>
            <div className="text-amber-100/70 text-sm leading-relaxed space-y-3">
              <p>You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Use bots, scripts, or automated tools to manipulate scores</li>
                <li>Attempt to exploit bugs or vulnerabilities</li>
                <li>Harass other users or use offensive usernames</li>
                <li>Impersonate others or create fake accounts</li>
                <li>Attempt to access other users&apos; accounts</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">5</span>
              Intellectual Property
            </h2>
            <p className="text-amber-100/70 text-sm leading-relaxed">
              Clash Royale and all related characters, names, and imagery are trademarks of Supercell. RoyaleHaus is a fan-made project and is not affiliated with, endorsed, or sponsored by Supercell. All Clash Royale assets used are property of Supercell.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">6</span>
              Leaderboards & Fair Play
            </h2>
            <p className="text-amber-100/70 text-sm leading-relaxed">
              We reserve the right to remove scores or ban accounts that we determine have violated fair play principles. Leaderboard positions are for entertainment purposes, and we may reset or modify leaderboards at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">7</span>
              Haus Universe Integration
            </h2>
            <p className="text-amber-100/70 text-sm leading-relaxed">
              Your RoyaleHaus account is part of the Haus Universe and works across all our platforms (OnePieceHaus and future services). By creating an account, you agree that your profile may be visible on other Haus Universe platforms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">8</span>
              Limitation of Liability
            </h2>
            <p className="text-amber-100/70 text-sm leading-relaxed">
              RoyaleHaus is provided &quot;as is&quot; without warranties of any kind. We are not liable for any loss of data, progress, or account information. We reserve the right to modify, suspend, or discontinue the service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-amber-200 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm">9</span>
              Changes to Terms
            </h2>
            <p className="text-amber-100/70 text-sm leading-relaxed">
              We may update these Terms of Service from time to time. Continued use of RoyaleHaus after changes constitutes acceptance of the new terms. We encourage you to review these terms periodically.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-4">
          <Link 
            href="/privacy" 
            className="inline-block text-amber-400 text-sm hover:underline"
          >
            Read our Privacy Policy →
          </Link>
          <div>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-semibold hover:bg-amber-500/30 transition"
            >
              ← Back to RoyaleHaus
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
