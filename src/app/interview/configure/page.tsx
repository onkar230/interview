'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Shield } from 'lucide-react';
import { Industry, Difficulty } from '@/lib/interview-prompts';
import ProgressSteps from '@/components/interview/ProgressSteps';

// Industry-specific suggestions
const INDUSTRY_SUGGESTIONS: Record<Industry, { companies: string[]; roles: string[] }> = {
  technology: {
    companies: ['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Netflix', 'Stripe', 'Uber', 'Airbnb'],
    roles: ['Software Engineer', 'Senior Software Engineer', 'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer', 'DevOps Engineer', 'Data Scientist', 'Product Manager'],
  },
  finance: {
    companies: ['Goldman Sachs', 'JPMorgan Chase', 'Morgan Stanley', 'BlackRock', 'Citadel', 'Barclays', 'HSBC', 'Credit Suisse'],
    roles: ['Investment Analyst', 'Financial Analyst', 'Investment Banker', 'Portfolio Manager', 'Quantitative Analyst', 'Risk Analyst', 'Trader', 'Wealth Manager'],
  },
  healthcare: {
    companies: ['Mayo Clinic', 'Cleveland Clinic', 'Kaiser Permanente', 'Johns Hopkins', 'Mass General', 'UCSF Health'],
    roles: ['Registered Nurse', 'Physician', 'Medical Assistant', 'Healthcare Administrator', 'Clinical Research Coordinator', 'Pharmacist'],
  },
  marketing: {
    companies: ['Ogilvy', 'WPP', 'Publicis', 'Omnicom', 'Dentsu', 'HubSpot', 'Salesforce'],
    roles: ['Marketing Manager', 'Brand Manager', 'Digital Marketing Specialist', 'Content Strategist', 'SEO Specialist', 'Product Marketing Manager'],
  },
  sales: {
    companies: ['Salesforce', 'HubSpot', 'Oracle', 'SAP', 'Adobe', 'Cisco', 'IBM'],
    roles: ['Sales Representative', 'Account Executive', 'Sales Manager', 'Business Development Manager', 'Enterprise Account Executive', 'Sales Engineer'],
  },
  consulting: {
    companies: ['McKinsey', 'Boston Consulting Group', 'Bain & Company', 'Deloitte', 'PwC', 'Accenture', 'EY', 'KPMG'],
    roles: ['Management Consultant', 'Strategy Consultant', 'Business Analyst', 'Senior Consultant', 'Associate Consultant', 'Engagement Manager'],
  },
  education: {
    companies: ['Harvard University', 'Stanford', 'MIT', 'Oxford', 'Cambridge', 'UCLA'],
    roles: ['Teacher', 'Professor', 'Academic Advisor', 'Curriculum Developer', 'Education Administrator', 'Research Associate'],
  },
  engineering: {
    companies: ['SpaceX', 'Tesla', 'Boeing', 'General Electric', 'Lockheed Martin', 'Siemens', 'ABB'],
    roles: ['Mechanical Engineer', 'Electrical Engineer', 'Civil Engineer', 'Project Engineer', 'Design Engineer', 'Systems Engineer'],
  },
  law: {
    companies: ['Clifford Chance', 'Linklaters', 'Allen & Overy', 'Freshfields', 'Slaughter and May', 'DLA Piper', 'Herbert Smith Freehills', 'White & Case'],
    roles: ['Associate Solicitor', 'Trainee Solicitor', 'Legal Counsel', 'Senior Associate', 'Partner', 'Paralegal', 'Legal Advisor', 'In-House Counsel'],
  },
};

function ConfigureInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const industry = searchParams.get('industry') as Industry;

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const difficulty: Difficulty = 'entry-level'; // Fixed to entry-level for student/grad-level jobs
  const [jobDescription, setJobDescription] = useState('');
  const [questionTypes, setQuestionTypes] = useState<string[]>([
    'behavioral',
    'technical',
    'competency',
  ]); // Default selections
  const [customQuestions, setCustomQuestions] = useState('');
  const [followUpIntensity, setFollowUpIntensity] = useState<'none' | 'light' | 'moderate' | 'intensive'>('moderate');
  const [errors, setErrors] = useState<{
    company?: string;
    role?: string;
  }>({});

  const suggestions = industry ? INDUSTRY_SUGGESTIONS[industry] : null;

  const handleQuestionTypeToggle = (type: string) => {
    setQuestionTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: { company?: string; role?: string } = {};

    if (!company || company.trim().length < 2) {
      newErrors.company = 'Company name must be at least 2 characters';
    }

    if (!role || role.trim().length < 2) {
      newErrors.role = 'Role must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Navigate to interview session with configuration
    const params = new URLSearchParams({
      industry: industry || '',
      company: company.trim(),
      role: role.trim(),
      difficulty: difficulty,
    });

    if (jobDescription.trim()) {
      params.append('jd', jobDescription.trim().slice(0, 2000));
    }

    // Add question types (comma-separated)
    if (questionTypes.length > 0) {
      params.append('questionTypes', questionTypes.join(','));
    }

    // Add custom questions (one per line, limit to 5 questions max)
    if (customQuestions.trim()) {
      const questions = customQuestions
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0)
        .slice(0, 5); // Limit to 5 custom questions

      if (questions.length > 0) {
        params.append('customQuestions', questions.join('|||'));
      }
    }

    // Add follow-up intensity
    params.append('followUpIntensity', followUpIntensity);

    router.push(`/interview/session?${params.toString()}`);
  };

  if (!industry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">No industry selected</p>
          <Button onClick={() => router.push('/interview/select')}>
            Select Industry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <ProgressSteps currentStep={2} />

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Customize Your Interview
          </h1>
          <p className="text-lg text-gray-600">
            Tell us about your interview to get the most realistic experience
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Industry (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-600 capitalize">
                {industry}
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                What company are you interviewing for?{' '}
                <span className="text-red-500">*</span>
              </label>
              <Input
                id="company"
                type="text"
                placeholder={suggestions ? `e.g., ${suggestions.companies.slice(0, 3).join(', ')}` : 'e.g., Google, Meta'}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={errors.company ? 'border-red-500' : ''}
                aria-invalid={!!errors.company}
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-600">{errors.company}</p>
              )}
              {suggestions && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-2">Popular companies for {industry}:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.companies.map((companyName) => (
                      <button
                        key={companyName}
                        type="button"
                        onClick={() => setCompany(companyName)}
                        className="px-3 py-1 text-xs rounded-full border border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        {companyName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Role/Position */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                What role are you applying for?{' '}
                <span className="text-red-500">*</span>
              </label>
              <Input
                id="role"
                type="text"
                placeholder={suggestions ? `e.g., ${suggestions.roles.slice(0, 2).join(', ')}` : 'e.g., Senior Software Engineer'}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={errors.role ? 'border-red-500' : ''}
                aria-invalid={!!errors.role}
              />
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
              {suggestions && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-2">Common roles for {industry}:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.roles.map((roleName) => (
                      <button
                        key={roleName}
                        type="button"
                        onClick={() => setRole(roleName)}
                        className="px-3 py-1 text-xs rounded-full border border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                      >
                        {roleName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Follow-up Intensity */}
            <div>
              <label
                htmlFor="followUpIntensity"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Follow-up Question Intensity <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Control how much the interviewer probes your answers. Real interviewers follow up on vague responses.
              </p>
              <select
                id="followUpIntensity"
                value={followUpIntensity}
                onChange={(e) => setFollowUpIntensity(e.target.value as 'none' | 'light' | 'moderate' | 'intensive')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
              >
                <option value="none">No Follow-ups - Move to next question immediately</option>
                <option value="light">Light - Only follow up if answer is very vague (max 1 follow-up)</option>
                <option value="moderate">Moderate - Follow up on vague answers (1-2 follow-ups) [Recommended]</option>
                <option value="intensive">Intensive - Deep probing like real interviews (2-3 follow-ups)</option>
              </select>
              <p className="mt-2 text-xs text-gray-600">
                {followUpIntensity === 'none' && '📝 Quick practice mode - cover more questions in less time'}
                {followUpIntensity === 'light' && '🎯 Gentle practice - some follow-ups for very unclear answers'}
                {followUpIntensity === 'moderate' && '⚖️ Balanced - realistic follow-ups without excessive pressure'}
                {followUpIntensity === 'intensive' && '🔥 Maximum pressure - just like a real challenging interview'}
              </p>
            </div>

            {/* Job Description (Optional) */}
            <div>
              <label
                htmlFor="jobDescription"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Job Description (Optional)
              </label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description here to help the AI ask more relevant questions..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                maxLength={2000}
                className="resize-y"
              />
              <p className="mt-1 text-sm text-gray-500">
                {jobDescription.length}/2000 characters
              </p>
            </div>

            {/* Question Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What types of questions do you want to practice? (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select the types of questions you want the interviewer to focus on. Leave all unchecked for a balanced mix.
              </p>
              <div className="space-y-2">
                {[
                  { id: 'behavioral', label: 'Behavioral', description: 'Tell me about a time when...' },
                  { id: 'technical', label: 'Technical/Role-specific', description: 'Industry-specific knowledge and skills' },
                  { id: 'competency', label: 'Competency-based', description: 'How would you handle...' },
                  { id: 'situational', label: 'Situational', description: 'What would you do if...' },
                  { id: 'strengths', label: 'Strengths & Weaknesses', description: 'Self-assessment questions' },
                  { id: 'culture', label: 'Company/Culture Fit', description: 'Values and work style alignment' },
                ].map((type) => (
                  <label
                    key={type.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={questionTypes.includes(type.id)}
                      onChange={() => handleQuestionTypeToggle(type.id)}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Questions */}
            <div>
              <label
                htmlFor="customQuestions"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Add Your Own Questions (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Enter specific questions that you struggle with or want to practice. One question per line, max 5 questions.
              </p>
              <Textarea
                id="customQuestions"
                placeholder="Example:&#10;Tell me about a time you failed and what you learned from it&#10;How do you handle conflicts with team members?&#10;Describe a situation where you had to meet a tight deadline"
                value={customQuestions}
                onChange={(e) => setCustomQuestions(e.target.value)}
                rows={5}
                className="resize-y"
              />
              <p className="mt-1 text-sm text-gray-500">
                {customQuestions.split('\n').filter(q => q.trim().length > 0).length} / 5 questions
              </p>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 text-sm mb-1">
                  Your privacy is protected
                </h4>
                <p className="text-sm text-blue-800">
                  Your webcam feed stays on your device only. We never record, store, or transmit your video or audio. The AI only receives your spoken text.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/interview/select')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button type="submit" className="flex-1">
                Start Interview
              </Button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            The more details you provide, the more realistic and tailored your
            interview will be.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConfigureInterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ConfigureInterviewContent />
    </Suspense>
  );
}
