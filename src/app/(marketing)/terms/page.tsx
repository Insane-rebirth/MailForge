'use client'

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8 space-y-6">
          <p className="text-white/70">
            Last updated: January 2024
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-white/60 leading-relaxed">
              By accessing and using MailForge, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-white/60 leading-relaxed">
              MailForge provides an AI-powered email generation platform that helps users create personalized cold emails for business outreach. Our service includes access to AI models, email templates, and related features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Responsibilities</h2>
            <p className="text-white/60 leading-relaxed mb-3">
              You agree to:
            </p>
            <ul className="list-disc list-inside text-white/60 space-y-2">
              <li>Use the service only for lawful purposes</li>
              <li>Not generate spam or unsolicited bulk emails</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not use the service to harass, abuse, or harm others</li>
              <li>Maintain the confidentiality of your account credentials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Subscription and Payment</h2>
            <p className="text-white/60 leading-relaxed mb-3">
              Some features require a paid subscription. By subscribing, you agree to pay the applicable fees. Subscriptions automatically renew unless cancelled before the renewal date.
            </p>
            <p className="text-white/60 leading-relaxed mb-3">
              <strong>Payment Methods:</strong> We accept payments through Stripe and Creem. You may use major credit cards (Visa, MasterCard, American Express) and other supported payment methods.
            </p>
            <p className="text-white/60 leading-relaxed mb-3">
              <strong>Billing:</strong> Subscriptions are billed monthly. Your payment method will be charged on the same day each month unless you cancel your subscription.
            </p>
            <p className="text-white/60 leading-relaxed">
              <strong>Refund Policy:</strong> We offer a 30-day money-back guarantee for all paid subscriptions. If you are not satisfied with our service, you may request a full refund within 30 days of your purchase. Refunds will be processed within 5-7 business days and returned to your original payment method. To request a refund, please contact our support team at support@getmailforge.top.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Intellectual Property</h2>
            <p className="text-white/60 leading-relaxed">
              MailForge and its original content, features, and functionality are owned by MailForge and are protected by international copyright, trademark, and other intellectual property laws. You retain ownership of the content you generate using our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Limitation of Liability</h2>
            <p className="text-white/60 leading-relaxed">
              MailForge shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service. Our total liability shall not exceed the amount you paid for the service in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Termination</h2>
            <p className="text-white/60 leading-relaxed">
              We may terminate or suspend your account at any time for violations of these terms or for any other reason at our discretion. Upon termination, your right to use the service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Changes to Terms</h2>
            <p className="text-white/60 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the service. Continued use after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Governing Law</h2>
            <p className="text-white/60 leading-relaxed">
              These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which MailForge operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Contact</h2>
            <p className="text-white/60 leading-relaxed">
              For questions about these terms, please{' '}
              <Link href="/contact" className="text-blue-400 hover:text-blue-300">
                contact us
              </Link>
              .
            </p>
          </section>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
