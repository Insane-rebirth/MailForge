import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How to Write Cold Outreach Emails That Actually Get Replies in 2024 | MailForge',
  description: 'Learn proven techniques for writing cold outreach emails that get responses. AI-powered tips and templates for B2B cold email success.',
  keywords: ['cold outreach email', 'cold email templates', 'b2b sales email', 'ai email generator', 'email writing tips'],
  openGraph: {
    title: 'How to Write Cold Outreach Emails That Actually Get Replies',
    description: 'Proven techniques for writing cold outreach emails that get responses in 2024.',
    type: 'article',
  },
}

export default function BlogPost2() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-12 prose prose-lg prose-invert">
      <div className="text-white/60 text-sm mb-4">Published: July 2024 | 6 min read</div>
      
      <h1 className="text-4xl font-bold text-white mb-6">
        How to Write Cold Outreach Emails That Actually Get Replies in 2024
      </h1>
      
      <p className="text-xl text-white/80 mb-8">
        Cold emailing remains one of the most effective B2B sales strategies - 
        but only if you're doing it right. Learn the proven techniques that 
        will help your cold outreach emails stand out and get responses.
      </p>

      <h2 className="text-2xl font-bold text-white mt-12 mb-4">The Cold Email Reality Check</h2>
      <p className="text-white/80 mb-6">
        Let's be honest: most cold emails get ignored. Average response rates 
        hover around 2-5%. But the good news is that with the right approach, 
        you can significantly improve those odds.
      </p>
      
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 my-8">
        <h3 className="text-lg font-bold text-yellow-400 mb-2">📊 By the Numbers</h3>
        <ul className="text-white/80 space-y-2">
          <li>Average cold email response rate: 2-5%</li>
          <li>Personalized emails: 2x higher response rate</li>
          <li>Emails under 100 words: 1.5x higher response rate</li>
          <li>Emails with clear CTAs: 32% more likely to get replies</li>
        </ul>
      </div>

      <h2 className="text-2xl font-bold text-white mt-12 mb-4">The Anatomy of a Great Cold Email</h2>
      
      <h3 className="text-xl font-semibold text-white mt-8 mb-4">1. Compelling Subject Line</h3>
      <p className="text-white/80 mb-4">
        Your subject line is the first impression. Make it count:
      </p>
      <ul className="text-white/80 space-y-2 mb-6">
        <li>Keep it under 30 characters</li>
        <li>Personalize when possible</li>
        <li>Create curiosity without being spammy</li>
        <li>Consider using the recipient's company name</li>
      </ul>
      
      <div className="bg-white/5 rounded-lg p-4 my-4">
        <p className="text-green-400 font-mono text-sm">✓ Good: Quick question about [CompanyName]</p>
        <p className="text-green-400 font-mono text-sm">✓ Good: Loved your recent post on [Topic]</p>
        <p className="text-red-400 font-mono text-sm">✗ Bad: Best deal on the market!!!</p>
        <p className="text-red-400 font-mono text-sm">✗ Bad: PLEASE READ - Important Offer</p>
      </div>

      <h3 className="text-xl font-semibold text-white mt-8 mb-4">2. Personal Opening</h3>
      <p className="text-white/80 mb-4">
        Show you've done your research. Reference something specific about:
      </p>
      <ul className="text-white/80 space-y-2 mb-6">
        <li>Their company (product, news, achievements)</li>
        <li>Their role or recent work</li>
        <li>A shared connection or interest</li>
      </ul>

      <h3 className="text-xl font-semibold text-white mt-8 mb-4">3. Clear Value Proposition</h3>
      <p className="text-white/80 mb-4">
        Immediately explain what's in it for THEM, not what you're selling:
      </p>
      <ul className="text-white/80 space-y-2 mb-6">
        <li>Focus on benefits, not features</li>
        <li>Use specific numbers and outcomes</li>
        <li>Keep it to 1-2 sentences maximum</li>
      </ul>

      <h3 className="text-xl font-semibold text-white mt-8 mb-4">4. Low-Friction CTA</h3>
      <p className="text-white/80 mb-4">
        Make it easy for them to take the next step:
      </p>
      <ul className="text-white/80 space-y-2 mb-6">
        <li>Ask for a 15-minute call (not "a call sometime")</li>
        <li>Suggest specific times/dates</li>
        <li>Offer multiple options (calendar link, reply, etc.)</li>
      </ul>

      <h2 className="text-2xl font-bold text-white mt-12 mb-4">AI-Powered Cold Email Templates</h2>
      <p className="text-white/80 mb-6">
        With tools like <a href="https://getmailforge.top" className="text-purple-400 underline">MailForge</a>, 
        you can generate personalized cold email templates in seconds. Here's a sample:
      </p>
      
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 my-8">
        <p className="text-white/60 text-sm mb-2">Subject: Quick question about [CompanyName]'s growth</p>
        <p className="text-white/80 mb-4">Hi [FirstName],</p>
        <p className="text-white/80 mb-4">
          I noticed [CompanyName] recently [specific observation about their company]. 
          Congrats on that!
        </p>
        <p className="text-white/80 mb-4">
          I work with [industry] companies to help them [specific benefit]. 
          We've helped clients achieve [specific result - e.g., "30% faster lead conversion"].
        </p>
        <p className="text-white/80 mb-4">
          Would you be open to a quick 15-minute call next week? 
          I'd love to share a few ideas that might help your team.
        </p>
        <p className="text-white/80 mb-4">Thanks,<br/>[YourName]</p>
      </div>

      <h2 className="text-2xl font-bold text-white mt-12 mb-4">Tips for Using AI Email Generators</h2>
      
      <div className="grid md:grid-cols-2 gap-6 my-8">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 rounded-xl">
          <h3 className="font-bold text-white mb-2">🎯 Be Specific</h3>
          <p className="text-white/70 text-sm">
            The more context you give the AI, the better the output. Include company name, role, and goal.
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6 rounded-xl">
          <h3 className="font-bold text-white mb-2">✨ Choose Tone</h3>
          <p className="text-white/70 text-sm">
            Match the tone to your audience. Formal for executives, friendly for startups.
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6 rounded-xl">
          <h3 className="font-bold text-white mb-2">📝 Review Always</h3>
          <p className="text-white/70 text-sm">
            AI is a starting point. Always personalize and review before sending.
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 p-6 rounded-xl">
          <h3 className="font-bold text-white mb-2">📊 Test & Iterate</h3>
          <p className="text-white/70 text-sm">
            Try different approaches and track what works. AI makes testing fast.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mt-12 mb-4">Get Started Today</h2>
      <p className="text-white/80 mb-6">
        Ready to write cold emails that get replies? Start with 
        <a href="https://getmailforge.top" className="text-purple-400 underline"> MailForge's free plan</a> 
        and generate your first email in under 10 seconds.
      </p>
      
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 my-8 text-center">
        <h3 className="text-xl font-bold text-white mb-4">🚨 Limited Time: Start Free</h3>
        <p className="text-white/80 mb-4">
          No credit card required. Get 20 emails/month on the free plan.
        </p>
        <a href="https://getmailforge.top" className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all">
          Try MailForge Free →
        </a>
      </div>

      <div className="mt-12 pt-8 border-t border-white/10">
        <p className="text-white/60 text-sm">
          <strong className="text-white">MailForge</strong> - AI-Powered Email Generator for B2B Professionals. 
          Write better emails, faster. Visit <a href="https://getmailforge.top" className="text-purple-400">getmailforge.top</a>
        </p>
      </div>
    </article>
  )
}
