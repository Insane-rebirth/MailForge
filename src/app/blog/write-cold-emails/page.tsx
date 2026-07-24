import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How to Write Cold Emails That Get Replies: Complete B2B Guide | MailForge',
  description: 'Learn how to write cold emails that actually get replies. Proven B2B email outreach strategies, templates, and AI tools for better results.',
  keywords: ['how to write cold emails', 'cold email guide', 'b2b email outreach', 'cold email templates', 'email that gets replies'],
  openGraph: {
    title: 'How to Write Cold Emails That Get Replies: Complete B2B Guide',
    description: 'Master the art of cold email outreach. Learn proven strategies, templates, and AI tools to get more replies.',
    type: 'article',
  },
}

export default function BlogPostWriteColdEmails() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-12 prose prose-lg prose-invert">
      <div className="text-white/60 text-sm mb-4">Published: July 2024 | 15 min read</div>
      
      <h1 className="text-4xl font-bold text-white mb-6">
        How to Write Cold Emails That Get Replies: The Complete B2B Guide
      </h1>
      
      <p className="text-xl text-white/80 mb-8">
        Writing cold emails that get replies is both an art and a science. This comprehensive guide 
        covers everything you need to know - from research to follow-ups - with proven strategies and templates.
      </p>

      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 my-8">
        <h3 className="text-lg font-bold text-green-400 mb-4">📈 Cold Email Performance Benchmarks</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/5 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-green-400">2-5%</p>
            <p className="text-white/70 text-sm">Average reply rate for cold emails</p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-green-400">10-15%</p>
            <p className="text-white/70 text-sm">Good reply rate with personalization</p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-green-400">20%+</p>
            <p className="text-white/70 text-sm">Exceptional with AI optimization</p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mt-12 mb-4">The Cold Email Process: Step by Step</h2>
      
      <h3 className="text-xl font-semibold text-white mt-8 mb-4">Step 1: Research Your Prospect</h3>
      <p className="text-white/80 mb-4">
        Every great cold email starts with research. Spend 10-15 minutes gathering:
      </p>
      <ul className="text-white/80 space-y-2 mb-6">
        <li><strong>Company Info:</strong> Size, industry, recent news, funding, products</li>
        <li><strong>Contact Details:</strong> Their role, responsibilities, recent posts, projects</li>
        <li><strong>Pain Points:</strong> What challenges might they face in their role?</li>
        <li><strong>Competitors:</strong> Who are their competitors? What are they doing differently?</li>
        <li><strong>Technologies:</strong> What tools might they already be using?</li>
      </ul>

      <h3 className="text-xl font-semibold text-white mt-8 mb-4">Step 2: Craft a Compelling Subject Line</h3>
      <p className="text-white/80 mb-4">
        Your subject line determines whether your email gets opened. Follow these principles:
      </p>
      <ul className="text-white/80 space-y-2 mb-6">
        <li>Keep it specific and personalized</li>
        <li>Create curiosity without being spammy</li>
        <li>Promise clear value</li>
        <li>Keep it under 50 characters for mobile</li>
      </ul>

      <h3 className="text-xl font-semibold text-white mt-8 mb-4">Step 3: Write an Engaging Opening</h3>
      <p className="text-white/80 mb-4">
        Your opening line needs to grab attention immediately. Use this formula:
      </p>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 my-4">
        <p className="text-white font-mono text-sm">Personalized Hook + Relevance + Value Proposition</p>
      </div>

      <h3 className="text-xl font-semibold text-white mt-8 mb-4">Step 4: Deliver Your Pitch</h3>
      <p className="text-white/80 mb-4">
        Keep your pitch concise and focused on their needs:
      </p>
      <ul className="text-white/80 space-y-2 mb-6">
        <li>Explain how you can help them specifically</li>
        <li>Use social proof (case studies, testimonials)</li>
        <li>Quantify the value (savings, improvements, ROI)</li>
        <li>Keep it to 2-3 sentences max</li>
      </ul>

      <h3 className="text-xl font-semibold text-white mt-8 mb-4">Step 5: Include a Clear Call to Action</h3>
      <p className="text-white/80 mb-4">
        Make it easy for them to take the next step:
      </p>
      <ul className="text-white/80 space-y-2 mb-6">
        <li>Suggest a specific action (not "let's talk")</li>
        <li>Propose a time for a call or meeting</li>
        <li>Offer something of value (demo, proposal, case study)</li>
        <li>Make it low-friction (15-min call, no commitment)</li>
      </ul>

      <h3 className="text-xl font-semibold text-white mt-8 mb-4">Step 6: Follow Up Strategically</h3>
      <p className="text-white/80 mb-4">
        Most replies come after follow-ups. Here's the optimal cadence:
      </p>
      <ul className="text-white/80 space-y-2 mb-6">
        <li><strong>Day 0:</strong> Send initial email</li>
        <li><strong>Day 3:</strong> First follow-up (provide additional value)</li>
        <li><strong>Day 7:</strong> Second follow-up (different angle or new info)</li>
        <li><strong>Day 14:</strong> Final touchpoint (last attempt, be respectful)</li>
      </ul>

      <h2 className="text-2xl font-bold text-white mt-12 mb-4">Cold Email Templates That Work</h2>
      
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 my-6">
        <h3 className="font-bold text-white mb-4">Template 1: The Value Offer</h3>
        <p className="text-white/60 text-sm mb-3">Subject: [Company] professionals - free resource inside</p>
        <p className="text-white/80 mb-2">Hi [First Name],</p>
        <p className="text-white/80 mb-4">
          I've been working with [Similar Companies] to help them [Achieve Result]. 
          Based on [Company]'s recent [Event/Development], I thought you'd find this resource valuable:
        </p>
        <p className="text-white/80 mb-4">
          [Link to resource/case study] shows how [Company in same industry] improved [Metric] by [X]% 
          using [Your Solution/Strategy].
        </p>
        <p className="text-white/80 mb-4">
          I'd be happy to walk you through how this could apply to [Company]. 
          Would [Day] at [Time] work for a quick 15-min call?
        </p>
        <p className="text-white/80">Best,<br/>[Your Name]</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 my-6">
        <h3 className="font-bold text-white mb-4">Template 2: The Insight Email</h3>
        <p className="text-white/60 text-sm mb-3">Subject: 3 insights about [Topic] for [Company]</p>
        <p className="text-white/80 mb-2">Hi [First Name],</p>
        <p className="text-white/80 mb-4">
          I've been analyzing how [Industry] companies are approaching [Topic], 
          and I noticed three things that might interest you as [Role] at [Company]:
        </p>
        <p className="text-white/80 mb-4">
          1. [Insight 1 - specific and actionable]<br/>
          2. [Insight 2 - related to their role]<br/>
          3. [Insight 3 - tied to your solution]
        </p>
        <p className="text-white/80 mb-4">
          I put together a brief report with the full analysis. Would it be helpful 
          to share this with your team?
        </p>
        <p className="text-white/80">Best,<br/>[Your Name]</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 my-6">
        <h3 className="font-bold text-white mb-4">Template 3: The Competitor Angle</h3>
        <p className="text-white/60 text-sm mb-3">Subject: How [Competitor] improved [Metric] by [X]%</p>
        <p className="text-white/80 mb-2">Hi [First Name],</p>
        <p className="text-white/80 mb-4">
          I noticed that [Competitor] recently implemented [Solution] and saw a [X]% improvement 
          in [Metric]. Given [Company]'s position in the market, I thought this might be relevant.
        </p>
        <p className="text-white/80 mb-4">
          Here's what's interesting: [Brief explanation of what [Competitor] did and the results]. 
          At [Your Company], we've helped [X] companies achieve similar results.
        </p>
        <p className="text-white/80 mb-4">
          Would you be open to a 15-minute call to see if this makes sense for [Company]?
        </p>
        <p className="text-white/80">Best,<br/>[Your Name]</p>
      </div>

      <h2 className="text-2xl font-bold text-white mt-12 mb-4">Common Cold Email Mistakes</h2>
      
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 my-8">
        <h3 className="text-lg font-bold text-red-400 mb-4">🚫 The 10 Biggest Cold Email Mistakes</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">1. Too Long</h4>
            <p className="text-white/70 text-sm">Nobody reads paragraphs. Keep it to 3-5 sentences.</p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">2. All About Them</h4>
            <p className="text-white/70 text-sm">Focus on THEIR needs, not your product features.</p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">3. No Personalization</h4>
            <p className="text-white/70 text-sm">Generic emails get ignored. Always personalize.</p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">4. Vague Subject Line</h4>
            <p className="text-white/70 text-sm">"Following up" doesn't get opened.</p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">5. Hard Sell</h4>
            <p className="text-white/70 text-sm">Nobody likes being pushed. Be helpful, not salesy.</p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">6. No Clear CTA</h4>
            <p className="text-white/70 text-sm">Tell them exactly what to do next.</p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">7. Spammy Language</h4>
            <p className="text-white/70 text-sm">Avoid "guarantee", "proven", "amazing" etc.</p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">8. Wrong Tone</h4>
            <p className="text-white/70 text-sm">Match your tone to your audience.</p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">9. No Follow-Up</h4>
            <p className="text-white/70 text-sm">80% of results come from follow-ups.</p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">10. Not Testing</h4>
            <p className="text-white/70 text-sm">Always A/B test subject lines and content.</p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mt-12 mb-4">Using AI to Improve Your Cold Emails</h2>
      <p className="text-white/80 mb-6">
        AI tools like <a href="https://getmailforge.top" className="text-purple-400 underline">MailForge</a> can dramatically 
        improve your cold email outreach by:
      </p>
      
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6 rounded-xl my-8">
        <ul className="text-white/80 space-y-3">
          <li><strong>Instant Personalization:</strong> Input basic details, get personalized emails in seconds</li>
          <li><strong>Multiple Variants:</strong> Generate 3 different versions to A/B test</li>
          <li><strong>Spam Detection:</strong> AI scores your emails for spam likelihood before sending</li>
          <li><strong>Tone Control:</strong> Match your brand's voice perfectly</li>
          <li><strong>Multi-Language:</strong> Reach international prospects in their language</li>
          <li><strong>Consistent Quality:</strong> Every email meets professional standards</li>
        </ul>
      </div>

      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 my-8 text-center">
        <h3 className="text-xl font-bold text-white mb-4">🚀 Write Better Cold Emails with AI</h3>
        <p className="text-white/80 mb-4">
          Ready to transform your cold email outreach? Start free with MailForge and get 20 emails per month. 
          No credit card required.
        </p>
        <a href="https://getmailforge.top" className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all">
          Try MailForge Free →
        </a>
      </div>

      <div className="mt-12 pt-8 border-t border-white/10">
        <p className="text-white/60 text-sm">
          <strong className="text-white">MailForge</strong> - AI-Powered Cold Email Generator. 
          Write emails that get replies. Visit <a href="https://getmailforge.top" className="text-purple-400">getmailforge.top</a>
        </p>
      </div>
    </article>
  )
}