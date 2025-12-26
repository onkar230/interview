/**
 * Company-Specific Interview Styles
 *
 * This file contains mappings of well-known companies to their interview styles,
 * values, and typical questions. This helps the AI conduct more authentic interviews.
 */

export interface CompanyStyle {
  values: string[];
  interviewFocus: string[];
  typicalQuestions: string[];
  culturalNotes: string;
}

/**
 * Mapping of company names (case-insensitive) to their interview styles
 */
export const COMPANY_STYLES: Record<string, CompanyStyle> = {
  google: {
    values: [
      'Focus on the user and all else will follow',
      'Think 10x, not 10%',
      'Be bold and innovative',
      'Respect the user, respect the opportunity',
    ],
    interviewFocus: [
      'Googleyness and Leadership',
      'Role-related knowledge',
      'General cognitive ability',
      'Technical depth for engineering roles',
    ],
    typicalQuestions: [
      'Tell me about a time you had to influence someone without authority',
      'Describe a situation where you had to solve an ambiguous problem',
      'How would you design a system for [specific product]?',
      'Give me an example of when you took a calculated risk',
    ],
    culturalNotes:
      'Google emphasizes innovation, data-driven decision making, and "Googleyness" (collaboration, comfort with ambiguity, and user focus). Expect behavioral questions using the STAR method.',
  },

  meta: {
    values: [
      'Move fast',
      'Be bold',
      'Focus on impact',
      'Build social value',
      'Be open',
    ],
    interviewFocus: [
      'Culture fit and values alignment',
      'Technical depth and system design',
      'Impact and ownership',
      'Collaboration across teams',
    ],
    typicalQuestions: [
      'Tell me about your biggest impact at your current company',
      'How would you design Facebook News Feed / Instagram Stories?',
      'Describe a time you had to move fast and make a decision with incomplete information',
      'Give an example of when you challenged the status quo',
    ],
    culturalNotes:
      'Meta (Facebook) values speed, impact, and boldness. They look for people who can operate autonomously and drive significant impact. Expect questions about handling ambiguity and moving quickly.',
  },

  amazon: {
    values: [
      'Customer Obsession',
      'Ownership',
      'Invent and Simplify',
      'Are Right, A Lot',
      'Learn and Be Curious',
      'Hire and Develop the Best',
      'Insist on the Highest Standards',
      'Think Big',
      'Bias for Action',
      'Frugality',
      'Earn Trust',
      'Dive Deep',
      'Have Backbone; Disagree and Commit',
      'Deliver Results',
    ],
    interviewFocus: [
      'Leadership Principles alignment',
      'Behavioral examples using STAR method',
      'Customer obsession examples',
      'Ownership and bias for action',
    ],
    typicalQuestions: [
      'Tell me about a time you failed',
      'Describe a situation where you went above and beyond for a customer',
      'Give an example of when you had to make a difficult decision with limited data',
      'Tell me about a time you simplified a complex process',
      'Describe a time you had to earn trust with a skeptical stakeholder',
    ],
    culturalNotes:
      'Amazon heavily emphasizes their 16 Leadership Principles. Every behavioral question maps to one or more principles. Be prepared with specific, measurable examples. Expect a "Bar Raiser" round.',
  },

  microsoft: {
    values: [
      'Respect',
      'Integrity',
      'Accountability',
      'Growth Mindset',
      'Customer Focus',
    ],
    interviewFocus: [
      'Growth mindset and learning',
      'Technical excellence',
      'Collaboration and teamwork',
      'Customer empathy',
    ],
    typicalQuestions: [
      'Tell me about a time you learned from failure',
      'Describe how you approach learning new technologies',
      'Give an example of when you collaborated across teams to solve a problem',
      'How do you ensure your work delivers customer value?',
    ],
    culturalNotes:
      'Microsoft emphasizes a growth mindset culture. They value continuous learning, collaboration, and humility. Expect questions about how you learn and grow from challenges.',
  },

  apple: {
    values: [
      'Innovation that matters',
      'Excellence and attention to detail',
      'Privacy and security',
      'Environmental responsibility',
      'Accessibility for all',
    ],
    interviewFocus: [
      'Product excellence and attention to detail',
      'Innovation and creativity',
      'Technical depth',
      'Alignment with Apple values',
    ],
    typicalQuestions: [
      'Tell me about a time you obsessed over a small detail that made a big difference',
      'Describe a product you built and what made it excellent',
      'How do you balance innovation with practicality?',
      'Give an example of when you had to make tradeoffs in product design',
    ],
    culturalNotes:
      'Apple is known for extreme attention to detail and product excellence. They value people who are passionate about building great products and care deeply about user experience.',
  },

  netflix: {
    values: [
      'Judgment',
      'Communication',
      'Impact',
      'Curiosity',
      'Innovation',
      'Courage',
      'Passion',
      'Selflessness',
      'Inclusion',
    ],
    interviewFocus: [
      'Culture fit with "Freedom and Responsibility"',
      'High performance and impact',
      'Direct and honest communication',
      'Independent decision-making',
    ],
    typicalQuestions: [
      'Tell me about a time you made a tough decision independently',
      'Describe a situation where you gave or received radical candor',
      'Give an example of high-impact work you delivered',
      'How do you operate with freedom and responsibility?',
    ],
    culturalNotes:
      'Netflix has a unique "Freedom and Responsibility" culture. They hire high performers, pay top of market, and expect excellence. Direct feedback and independent decision-making are highly valued.',
  },

  'goldman sachs': {
    values: [
      'Client service',
      'Integrity',
      'Excellence',
      'Partnership',
    ],
    interviewFocus: [
      'Financial acumen and technical skills',
      'Client focus and service',
      'Teamwork and collaboration',
      'Ethical decision-making',
    ],
    typicalQuestions: [
      'Walk me through a DCF valuation',
      'Tell me about a time you had to work under extreme pressure',
      'Describe how you would advise a client on [financial scenario]',
      'Give an example of when you put the client first',
    ],
    culturalNotes:
      'Goldman Sachs emphasizes client service, excellence, and integrity. Expect technical finance questions combined with behavioral questions about teamwork and ethics.',
  },

  'jpmorgan chase': {
    values: [
      'Exceptional client service',
      'Operational excellence',
      'Integrity',
      'A commitment to diversity',
    ],
    interviewFocus: [
      'Financial analysis skills',
      'Risk management',
      'Client relationship management',
      'Attention to detail',
    ],
    typicalQuestions: [
      'How do you approach financial modeling?',
      'Tell me about a time you identified a risk others missed',
      'Describe your experience with [financial product or service]',
      'Give an example of exceptional client service you provided',
    ],
    culturalNotes:
      'JPMorgan emphasizes operational excellence, risk management, and client service. They value detail-oriented people who can balance innovation with risk management.',
  },

  stripe: {
    values: [
      'Move with urgency',
      'Default to transparency',
      'Optimism',
      'Obsess over quality',
      'Think rigorously',
    ],
    interviewFocus: [
      'Technical excellence',
      'Product thinking',
      'Startup mentality and speed',
      'User empathy',
    ],
    typicalQuestions: [
      'Tell me about a time you shipped something quickly while maintaining quality',
      'How would you design a payment processing system?',
      'Describe a technical tradeoff you made and why',
      'Give an example of when you identified and solved a user problem',
    ],
    culturalNotes:
      'Stripe values technical rigor, speed, and quality. They look for builders who can move fast while maintaining high standards. Expect deep technical discussions.',
  },

  airbnb: {
    values: [
      'Champion the Mission',
      'Be a Host',
      'Embrace the Adventure',
      'Be a Cereal Entrepreneur',
      'Simplify',
    ],
    interviewFocus: [
      'Mission alignment and passion',
      'User empathy and design thinking',
      'Entrepreneurial mindset',
      'Technical excellence',
    ],
    typicalQuestions: [
      'Why Airbnb? What does our mission mean to you?',
      'Tell me about a time you created a great user experience',
      'Describe a situation where you had to be scrappy and resourceful',
      'How would you improve [Airbnb product feature]?',
    ],
    culturalNotes:
      'Airbnb deeply cares about mission alignment and being a "host" to users and colleagues. They value entrepreneurial thinking and user empathy. Expect questions about belonging and community.',
  },

  uber: {
    values: [
      'We build globally, we live locally',
      'Customer obsession',
      'We celebrate differences',
      'We do the right thing',
      'We act like owners',
      'We persevere',
      'We value ideas over hierarchy',
      'We make big bold bets',
    ],
    interviewFocus: [
      'Operational excellence at scale',
      'Data-driven decision making',
      'Resilience and perseverance',
      'Ownership mindset',
    ],
    typicalQuestions: [
      'Tell me about a time you used data to make a decision',
      'Describe a situation where you had to operate in ambiguity',
      'Give an example of when you took ownership of a problem',
      'How would you optimize [Uber operational challenge]?',
    ],
    culturalNotes:
      'Uber values operators who can handle complexity and scale. They look for data-driven thinking, ownership, and resilience. Expect questions about handling ambiguity and fast-paced environments.',
  },

  tesla: {
    values: [
      'Accelerate the world\'s transition to sustainable energy',
      'Innovation and speed',
      'First principles thinking',
      'Excellence and high standards',
    ],
    interviewFocus: [
      'Technical depth and problem-solving',
      'Passion for the mission',
      'Ability to work under pressure',
      'Innovation and creativity',
    ],
    typicalQuestions: [
      'Tell me about a technical challenge you solved from first principles',
      'Why Tesla? How do you connect with our mission?',
      'Describe a time you had to deliver results under extreme pressure',
      'How would you improve [Tesla product or process]?',
    ],
    culturalNotes:
      'Tesla is fast-paced, demanding, and mission-driven. They value technical excellence, first principles thinking, and people passionate about sustainable energy. Expect intense technical discussions.',
  },

  mckinsey: {
    values: [
      'Put client interests first',
      'Uphold the obligation to dissent',
      'Maintain high ethical standards',
      'Build the firm',
    ],
    interviewFocus: [
      'Problem-solving and case interviews',
      'Analytical thinking',
      'Client service excellence',
      'Communication skills',
    ],
    typicalQuestions: [
      'How would you help a retail client increase profits?',
      'Estimate the market size for [product or service]',
      'Tell me about a time you had to structure a complex problem',
      'Describe a situation where you influenced a senior stakeholder',
    ],
    culturalNotes:
      'McKinsey heavily emphasizes case interviews and structured problem-solving. They value analytical rigor, client service, and the ability to communicate complex ideas simply.',
  },

  'boston consulting group': {
    values: [
      'Client focus',
      'Diversity and inclusion',
      'Social impact',
      'Partnership',
    ],
    interviewFocus: [
      'Case interview performance',
      'Creativity and innovation',
      'Collaboration',
      'Quantitative analysis',
    ],
    typicalQuestions: [
      'A pharmaceutical company wants to enter a new market. How would you advise them?',
      'Estimate the number of [common item] in [location]',
      'Tell me about a time you worked on a team with diverse perspectives',
      'Describe an innovative solution you developed',
    ],
    culturalNotes:
      'BCG values creativity alongside analytical thinking. They look for problem solvers who can think outside the box while maintaining rigor. Case interviews are central to their process.',
  },

  'bain & company': {
    values: [
      'Results orientation',
      'Teamwork',
      'Client focus',
      'Global perspective',
    ],
    interviewFocus: [
      'Case interview excellence',
      'Teamwork and collaboration',
      'Results-driven mindset',
      'Client relationship building',
    ],
    typicalQuestions: [
      'A private equity firm is considering acquiring a company. Should they?',
      'How many [item] are sold in [timeframe]?',
      'Tell me about a time you delivered exceptional results as part of a team',
      'Describe how you build relationships with clients or stakeholders',
    ],
    culturalNotes:
      'Bain emphasizes teamwork and results. They have a collaborative culture and strong private equity practice. Expect case interviews with a focus on practical business outcomes.',
  },

  oracle: {
    values: [
      'Customer first',
      'Innovation',
      'Teamwork',
      'Integrity',
      'Results-driven',
    ],
    interviewFocus: [
      'Technical expertise',
      'Enterprise solution thinking',
      'Sales and business acumen',
      'Problem-solving at scale',
    ],
    typicalQuestions: [
      'Tell me about a time you implemented a large-scale technical solution',
      'How would you handle a customer who is frustrated with our product?',
      'Describe your experience with database systems and cloud infrastructure',
      'Give an example of when you drove revenue or business growth',
    ],
    culturalNotes:
      'Oracle is enterprise-focused with emphasis on technical depth and business impact. They value people who understand both technology and customer needs at scale.',
  },

  adobe: {
    values: [
      'Creativity',
      'Innovation',
      'Exceptional customer experiences',
      'Integrity',
      'Involvement',
    ],
    interviewFocus: [
      'Creative problem-solving',
      'Technical excellence',
      'User experience focus',
      'Collaboration and teamwork',
    ],
    typicalQuestions: [
      'Tell me about a creative solution you developed for a complex problem',
      'How do you balance creativity with technical constraints?',
      'Describe a time you improved user experience in a product',
      'Give an example of when you collaborated across teams to ship a feature',
    ],
    culturalNotes:
      'Adobe values creativity, innovation, and user-centered design. They look for people passionate about creating exceptional digital experiences.',
  },

  salesforce: {
    values: [
      'Trust',
      'Customer success',
      'Innovation',
      'Equality',
      'Sustainability',
    ],
    interviewFocus: [
      'Customer obsession',
      'Ohana culture fit',
      'Technical and business acumen',
      'Values alignment',
    ],
    typicalQuestions: [
      'Tell me about a time you went above and beyond for a customer',
      'Describe how you build trust with stakeholders',
      'Give an example of innovation that drove business impact',
      'How do you approach equality and inclusion in your work?',
    ],
    culturalNotes:
      'Salesforce has a strong "Ohana" (family) culture emphasizing trust, customer success, and giving back. They value people aligned with their core values.',
  },

  'morgan stanley': {
    values: [
      'Putting clients first',
      'Doing the right thing',
      'Leading with exceptional ideas',
      'Committing to diversity and inclusion',
      'Giving back',
    ],
    interviewFocus: [
      'Financial analysis and modeling',
      'Client relationship management',
      'Ethical decision-making',
      'Teamwork under pressure',
    ],
    typicalQuestions: [
      'Walk me through a financial model you built',
      'Tell me about a time you had to make a difficult ethical decision',
      'How would you approach valuing [company or asset]?',
      'Describe a situation where you managed competing client priorities',
    ],
    culturalNotes:
      'Morgan Stanley emphasizes client service, integrity, and intellectual capital. They value analytical rigor combined with strong interpersonal skills.',
  },

  blackrock: {
    values: [
      'Fiduciary to our clients',
      'One BlackRock',
      'Passion to perform',
      'Innovation',
      'Commitment to excellence',
    ],
    interviewFocus: [
      'Investment analysis',
      'Risk management',
      'Collaborative mindset',
      'Analytical thinking',
    ],
    typicalQuestions: [
      'How do you approach investment research and analysis?',
      'Tell me about a time you identified an investment risk',
      'Describe your experience with portfolio management',
      'Give an example of when you collaborated across teams on a complex problem',
    ],
    culturalNotes:
      'BlackRock is a global asset manager emphasizing fiduciary duty, collaboration ("One BlackRock"), and rigorous analysis. They value people who put clients first.',
  },

  spacex: {
    values: [
      'Make life multiplanetary',
      'Innovation and rapid iteration',
      'Extreme ownership',
      'Technical excellence',
    ],
    interviewFocus: [
      'Technical depth',
      'Problem-solving under constraints',
      'Mission passion',
      'Ability to work at high pace',
    ],
    typicalQuestions: [
      'Why SpaceX? Why do you want to make life multiplanetary?',
      'Tell me about the hardest technical problem you\'ve solved',
      'Describe a time you had to deliver results under extreme pressure',
      'How would you optimize [rocket/spacecraft component or process]?',
    ],
    culturalNotes:
      'SpaceX is intensely mission-driven with a fast-paced, high-pressure environment. They value technical excellence, scrappiness, and passion for space exploration.',
  },

  'clifford chance': {
    values: [
      'Excellence',
      'Teamwork',
      'Integrity',
      'Respect',
      'Client service',
    ],
    interviewFocus: [
      'Legal analysis and reasoning',
      'Commercial awareness',
      'Communication skills',
      'Teamwork and collaboration',
    ],
    typicalQuestions: [
      'Tell me about a complex legal problem you analyzed',
      'How do you stay updated with legal developments?',
      'Describe a time you worked on a team to deliver client work',
      'Give an example of when you balanced competing client interests',
    ],
    culturalNotes:
      'Clifford Chance is a leading global law firm emphasizing excellence and client service. They value strong legal minds with commercial awareness and teamwork.',
  },

  linklaters: {
    values: [
      'Excellence in client service',
      'Integrity',
      'Teamwork',
      'Innovation',
      'Diversity',
    ],
    interviewFocus: [
      'Legal knowledge and application',
      'Commercial understanding',
      'Client focus',
      'Analytical thinking',
    ],
    typicalQuestions: [
      'Walk me through how you would approach a corporate M&A transaction',
      'Tell me about a time you provided excellent client service',
      'How do you approach legal research for complex questions?',
      'Describe a situation where you had to explain legal concepts to a non-lawyer',
    ],
    culturalNotes:
      'Linklaters values intellectual rigor, client service, and commercial awareness. They look for lawyers who can think strategically and communicate clearly.',
  },

  'allen & overy': {
    values: [
      'Client excellence',
      'Collaboration',
      'Ambition',
      'Inclusion',
      'Innovation',
    ],
    interviewFocus: [
      'Legal expertise',
      'Commercial awareness',
      'Global perspective',
      'Problem-solving',
    ],
    typicalQuestions: [
      'Tell me about your interest in [practice area]',
      'How would you advise a client on [legal scenario]?',
      'Describe a time you worked across cultures or jurisdictions',
      'Give an example of when you showed commercial awareness',
    ],
    culturalNotes:
      'Allen & Overy emphasizes global reach, innovation, and collaboration. They value lawyers with strong commercial understanding and cross-border expertise.',
  },

  freshfields: {
    values: [
      'Excellence',
      'Partnership',
      'Integrity',
      'Diversity and inclusion',
    ],
    interviewFocus: [
      'Legal analysis',
      'Technical excellence',
      'Client relationships',
      'Collaborative approach',
    ],
    typicalQuestions: [
      'Walk me through a legal issue you researched in depth',
      'Tell me about a time you worked collaboratively on a complex matter',
      'How do you approach client communication?',
      'Describe your understanding of [legal area relevant to the firm]',
    ],
    culturalNotes:
      'Freshfields is known for technical excellence and high-quality work. They value precision, collaboration, and lawyers who can handle complex transactions.',
  },

  'slaughter and may': {
    values: [
      'Technical excellence',
      'Partnership approach',
      'Integrated global practice',
      'Long-term client relationships',
    ],
    interviewFocus: [
      'Legal reasoning',
      'Attention to detail',
      'Commercial judgment',
      'Cultural fit with partnership model',
    ],
    typicalQuestions: [
      'Tell me about a time you had to analyze a complex legal problem',
      'How do you approach working in a team without hierarchy?',
      'Describe your understanding of our partnership model',
      'Give an example of when attention to detail was critical',
    ],
    culturalNotes:
      'Slaughter and May has a unique partnership structure with no formal hierarchy. They emphasize technical excellence, teamwork, and long-term thinking.',
  },
};

/**
 * Get company-specific style by name (case-insensitive)
 */
export function getCompanyStyle(companyName: string): CompanyStyle | null {
  const normalizedName = companyName.toLowerCase().trim();
  return COMPANY_STYLES[normalizedName] || null;
}

/**
 * Check if a company has a defined style
 */
export function hasCompanyStyle(companyName: string): boolean {
  return getCompanyStyle(companyName) !== null;
}

/**
 * Get a list of all companies with defined styles
 */
export function getKnownCompanies(): string[] {
  return Object.keys(COMPANY_STYLES).map(
    (name) => name.charAt(0).toUpperCase() + name.slice(1)
  );
}
