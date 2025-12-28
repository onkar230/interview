'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Mic, Brain, TrendingUp, CheckCircle, Sparkles, Target, Award } from "lucide-react";
import { useState, useEffect } from "react";
import {
  SiGoogle,
  SiApple,
  SiNetflix,
  SiGoldmansachs,
  SiSalesforce,
  SiAdobe,
  SiOracle,
  SiTesla
} from 'react-icons/si'; // Simple Icons from react-icons
import { FaAmazon, FaMicrosoft } from 'react-icons/fa'; // Font Awesome brand icons

// Animated Score Component with Skill Scores
function AnimatedScoreSection() {
  const [score, setScore] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScore((prevScore) => {
        // Progressive animation: 0 → 100 → reset to 0 → repeat
        const randomIncrement = Math.floor(Math.random() * 6) + 3; // Random jump between 3-8
        const newScore = prevScore + randomIncrement;
        if (newScore >= 100) {
          return 0; // Jump back to 0 when reaching 100
        }
        return newScore;
      });
    }, 600); // Update every 600ms for slower, more gradual animation

    return () => clearInterval(interval);
  }, []);

  // Calculate skill scores based on main score (synchronized)
  const communication = Math.floor((score / 100) * 35); // 0-35 based on main score
  const technical = Math.max(0, Math.floor((score / 100) * 35) - 3); // Slightly lower
  const problemSolving = Math.max(0, Math.floor((score / 100) * 35) - 2); // Mid-range

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-12 border border-slate-700 max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="flex-1">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Communication</span>
                <span className="text-pink-400 font-semibold transition-all duration-200">{communication}/35</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-200"
                  style={{width: `${(communication / 35 * 100).toFixed(0)}%`}}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Technical Knowledge</span>
                <span className="text-yellow-400 font-semibold transition-all duration-200">{technical}/35</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full transition-all duration-200"
                  style={{width: `${(technical / 35 * 100).toFixed(0)}%`}}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300">Problem Solving</span>
                <span className="text-green-400 font-semibold transition-all duration-200">{problemSolving}/35</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-200"
                  style={{width: `${(problemSolving / 35 * 100).toFixed(0)}%`}}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-8xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent transition-all duration-200">
            {score}
            <span className="text-5xl">/100</span>
          </div>
          <div className="text-sm text-gray-400 mt-2">Your Interview Confidence Score</div>
          <p className="text-sm text-gray-500 mt-4 italic">Score updates in real-time</p>
        </div>
      </div>
    </div>
  );
}

// Company Logo Component using react-icons
const CompanyLogo = ({ name }: { name: string }) => {
  // Map company names to React Icon components with their brand colors
  // Focused on Tech, Finance, Law & Engineering industries
  const iconMap: Record<string, { Icon: any; color: string } | null> = {
    // Tech/Software
    'Google': { Icon: SiGoogle, color: '#4285F4' },
    'Microsoft': { Icon: FaMicrosoft, color: '#00A4EF' },
    'Apple': { Icon: SiApple, color: '#FFFFFF' },
    'Amazon': { Icon: FaAmazon, color: '#FF9900' },
    'Netflix': { Icon: SiNetflix, color: '#E50914' },
    'Salesforce': { Icon: SiSalesforce, color: '#00A1E0' },
    'Adobe': { Icon: SiAdobe, color: '#FF0000' },
    'Oracle': { Icon: SiOracle, color: '#F80000' },
    // Finance
    'Goldman Sachs': { Icon: SiGoldmansachs, color: '#5C8AB1' },
    'JPMorgan': null, // Not available
    // Engineering
    'Tesla': { Icon: SiTesla, color: '#CC0000' },
  };

  const iconData = iconMap[name];

  if (!iconData) {
    // Fallback for companies not in react-icons - show brand-colored text
    const colorMap: Record<string, string> = {
      'JPMorgan': '#0070CD',
    };

    return (
      <div
        className="text-xl font-bold"
        style={{ color: colorMap[name] || '#D1D5DB' }}
      >
        {name}
      </div>
    );
  }

  const { Icon, color } = iconData;

  return (
    <Icon
      size={50}
      color={color}
      className="transition-transform hover:scale-110"
    />
  );
};

// Company Logos Carousel
function CompanyCarousel() {
  // Companies across our 4 focus industries: Tech, Finance, Law, Engineering
  const companies = [
    'Google', 'Goldman Sachs', 'Microsoft', 'JPMorgan',
    'Apple', 'Amazon', 'Netflix', 'Salesforce',
    'Adobe', 'Oracle', 'Tesla'
  ];

  // Double the array for seamless loop
  const doubledCompanies = [...companies, ...companies];

  return (
    <div className="relative overflow-hidden py-8">
      <div className="flex animate-scroll items-center">
        {doubledCompanies.map((company, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 mx-12 flex items-center justify-center"
            style={{ minWidth: '120px' }}
          >
            <CompanyLogo name={company} />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 50s linear infinite;
          display: flex;
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          InterviewAI
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/interview/select">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
              Get Started Free
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          The Only Free{' '}
          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            AI Mock Interview Platform
          </span>{' '}
          You'll Ever Need
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
          Practice with AI interviewers trained on real questions from top companies.
          Get instant feedback and walk into your interview with confidence.
        </p>

        <Link href="/interview/select">
          <Button
            size="lg"
            className="px-10 py-7 text-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-2xl shadow-pink-500/50"
          >
            Get Started Free →
          </Button>
        </Link>

        <div className="flex items-center justify-center gap-8 mt-6 text-gray-400 text-sm">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            Free forever
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            Setup in 2 minutes
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-center mb-3">
              <div className="h-12 w-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              AI <span className="text-purple-400">Powered</span>
            </div>
            <div className="text-sm text-gray-400">Smart Optimization</div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-center mb-3">
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              100<span className="text-green-400">%</span>
            </div>
            <div className="text-sm text-gray-400">Realistic Feedback</div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-center mb-3">
              <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              50<span className="text-orange-400">%+</span>
            </div>
            <div className="text-sm text-gray-400">Confidence Boost</div>
          </div>
        </div>
      </div>

      {/* Animated Score Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            See Your Interview Performance In Real-Time
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our AI analyses your responses just like a real recruiter would, giving you instant
            feedback on your strengths and areas for improvement.
          </p>
        </div>

        <AnimatedScoreSection />
      </div>

      {/* Company Carousel Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
          Practice Interviews For Jobs At
        </h2>
        <p className="text-xl text-gray-300 text-center mb-12">
          Prepare for Tech, Finance, Law & Engineering roles at top companies
        </p>

        <CompanyCarousel />

        <div className="flex items-center justify-center gap-8 mt-8 text-gray-400 text-sm">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            Industry-specific questions
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            Company-specific prep
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-400" />
            AI-powered feedback
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
          Everything You Need To Ace Your Interview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700">
            <div className="h-14 w-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
              <Mic className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Voice-Based Interviews</h3>
            <p className="text-gray-400">
              Speak naturally just like a real interview. Our AI understands your responses
              and provides instant feedback on your communication style.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700">
            <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <Target className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Industry-Specific AI</h3>
            <p className="text-gray-400">
              From Big Tech to Big Law, our AI interviewers are trained on real questions
              from top companies in 9 different industries.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700">
            <div className="h-14 w-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-6">
              <Award className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Detailed Evaluations</h3>
            <p className="text-gray-400">
              Get brutally honest feedback with Pass/Borderline/Fail ratings, specific
              strengths, weaknesses, and actionable improvement tips.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700">
            <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Real-Time SWOT Analysis</h3>
            <p className="text-gray-400">
              See your Strengths, Weaknesses, Opportunities, and Threats in real-time
              as you answer each question.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700">
            <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Custom Questions</h3>
            <p className="text-gray-400">
              Add your own questions that you struggle with. Practice the exact scenarios
              that make you nervous.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700">
            <div className="h-14 w-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Adjustable Difficulty</h3>
            <p className="text-gray-400">
              Control follow-up intensity from 'No follow-ups' to 'Intensive pressure'
              to match your preparation goals.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section (Placeholder) */}
      <div id="pricing" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
          Choose Your Plan
        </h2>
        <p className="text-xl text-gray-300 text-center mb-16">
          Start free and upgrade when you're ready to accelerate your interview prep
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
            <div className="text-5xl font-bold text-white mb-6">
              $0<span className="text-xl text-gray-400">/forever</span>
            </div>
            <p className="text-gray-400 mb-6">Perfect for getting started</p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                5 mock interviews per month
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                All 9 industries available
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                Real-time feedback
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                Detailed evaluations
              </li>
            </ul>

            <Link href="/interview/select">
              <Button className="w-full bg-slate-700 hover:bg-slate-600">
                Start Free
              </Button>
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-8 border-2 border-pink-500 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-1 rounded-full text-sm font-semibold text-white">
              Most Popular
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
            <div className="text-5xl font-bold text-white mb-6">
              $15<span className="text-xl text-gray-300">/month</span>
            </div>
            <p className="text-gray-300 mb-6">Supercharge your interview prep</p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-white">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                Everything in Free, plus:
              </li>
              <li className="flex items-center gap-3 text-white">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                Unlimited interviews
              </li>
              <li className="flex items-center gap-3 text-white">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                Custom question practise
              </li>
              <li className="flex items-center gap-3 text-white">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                Company-specific prep
              </li>
              <li className="flex items-center gap-3 text-white">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                Priority support
              </li>
            </ul>

            <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
              Coming Soon
            </Button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
            <div className="text-5xl font-bold text-white mb-6">
              $60<span className="text-xl text-gray-400">/6 months</span>
            </div>
            <p className="text-gray-400 mb-6">For your entire job search journey</p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                Everything in Pro, plus:
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                6 months unlimited access
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                Interview history & analytics
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                Advanced AI feedback
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                1-on-1 coaching session
              </li>
            </ul>

            <Button className="w-full bg-slate-700 hover:bg-slate-600">
              Coming Soon
            </Button>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Your career is your most valuable asset.
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Start building it today with AI-powered interview practise.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/interview/select">
            <Button
              size="lg"
              className="px-10 py-7 text-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              Start Your First Interview Free
            </Button>
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Built by someone who understands the interview struggle. No credit card required.
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>© 2024 InterviewAI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
