'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Loader2, Shield, Upload, FileText, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Industry, Difficulty, QuestionSourceType } from '@/lib/interview-prompts';
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
  const [questionCount, setQuestionCount] = useState(10);
  const [errors, setErrors] = useState<{
    company?: string;
    role?: string;
  }>({});
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState('');
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [cvError, setCvError] = useState('');
  const [questionPriority, setQuestionPriority] = useState<QuestionSourceType[]>([
    'custom',
    'cv',
    'generic'
  ]);

  const suggestions = industry ? INDUSTRY_SUGGESTIONS[industry] : null;

  // Question priority labels and descriptions
  const QUESTION_SOURCE_LABELS: Record<QuestionSourceType, string> = {
    custom: 'Your Custom Questions',
    cv: 'CV-Based Questions',
    generic: 'Standard Interview Questions'
  };

  const QUESTION_SOURCE_DESCRIPTIONS: Record<QuestionSourceType, string> = {
    custom: 'Questions you specifically want to be asked',
    cv: 'Questions tailored to your CV/resume',
    generic: 'General industry-specific questions (filtered by your selected types)'
  };

  // Functions to reorder question priorities
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...questionPriority];
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    setQuestionPriority(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === questionPriority.length - 1) return;
    const newOrder = [...questionPriority];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setQuestionPriority(newOrder);
  };

  const handleQuestionTypeToggle = (type: string) => {
    setQuestionTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setCvError('File size must be less than 10MB');
      return;
    }

    setCvFile(file);
    setCvError('');
    setIsUploadingCv(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/interview/parse-cv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse CV');
      }

      setCvText(data.text);
      setIsUploadingCv(false);
    } catch (error) {
      console.error('CV upload error:', error);
      setCvError(error instanceof Error ? error.message : 'Failed to parse CV');
      setCvFile(null);
      setCvText('');
      setIsUploadingCv(false);
    }
  };

  const handleRemoveCv = () => {
    setCvFile(null);
    setCvText('');
    setCvError('');
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

    // Add question count
    params.append('questionCount', questionCount.toString());

    // Add CV text if available
    if (cvText.trim()) {
      params.append('cv', cvText.trim().slice(0, 8000)); // Limit to 8000 chars
    }

    // Add question priority order
    params.append('questionPriority', questionPriority.join('-'));

    router.push(`/interview/session?${params.toString()}`);
  };

  if (!industry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">No industry selected</p>
          <Button onClick={() => router.push('/interview/select')} className="bg-primary hover:bg-secondary text-primary-foreground">
            Select Industry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <ProgressSteps currentStep={2} />

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Customise Your Interview
          </h1>
          <p className="text-lg text-muted-foreground">
            Tell us about your interview to get the most realistic experience
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Industry (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Industry
              </label>
              <div className="px-4 py-3 bg-white rounded-lg border border-border text-gray-900 capitalize font-medium">
                {industry}
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-muted-foreground mb-2"
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
                className={`bg-white text-gray-900 placeholder:text-gray-500 ${errors.company ? 'border-red-500' : 'border-border'}`}
                aria-invalid={!!errors.company}
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-600">{errors.company}</p>
              )}
            </div>

            {/* Role/Position */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-muted-foreground mb-2"
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
                className={`bg-white text-gray-900 placeholder:text-gray-500 ${errors.role ? 'border-red-500' : 'border-border'}`}
                aria-invalid={!!errors.role}
              />
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            {/* Follow-up Intensity */}
            <div>
              <label
                htmlFor="followUpIntensity"
                className="block text-sm font-medium text-muted-foreground mb-2"
              >
                Follow-up Question Intensity <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Control how much the interviewer probes your answers. Real interviewers follow up on vague responses.
              </p>
              <select
                id="followUpIntensity"
                value={followUpIntensity}
                onChange={(e) => setFollowUpIntensity(e.target.value as 'none' | 'light' | 'moderate' | 'intensive')}
                className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors bg-white text-gray-900"
              >
                <option value="none">No Follow-ups - Move to next question immediately</option>
                <option value="light">Light - Only follow up if answer is very vague (max 1 follow-up)</option>
                <option value="moderate">Moderate - Follow up on vague answers (1-2 follow-ups) [Recommended]</option>
                <option value="intensive">Intensive - Deep probing like real interviews (2-3 follow-ups)</option>
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                {followUpIntensity === 'none' && '📝 Quick practise mode - cover more questions in less time'}
                {followUpIntensity === 'light' && '🎯 Gentle practise - some follow-ups for very unclear answers'}
                {followUpIntensity === 'moderate' && '⚖️ Balanced - realistic follow-ups without excessive pressure'}
                {followUpIntensity === 'intensive' && '🔥 Maximum pressure - just like a real challenging interview'}
              </p>
            </div>

            {/* Question Count Slider */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Number of Questions
              </label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">{questionCount}</span>
                  <span className="text-xs text-muted-foreground">questions</span>
                </div>
                <Slider
                  value={[questionCount]}
                  onValueChange={(value) => setQuestionCount(value[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 (Quick)</span>
                  <span>10 (Full)</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {questionCount <= 3 && '⚡ Quick practise - focus on a few key areas'}
                {questionCount > 3 && questionCount <= 6 && '🎯 Medium session - balanced coverage'}
                {questionCount > 6 && '📋 Full interview - comprehensive practise'}
              </p>
            </div>

            {/* Job Description (Optional) */}
            <div>
              <label
                htmlFor="jobDescription"
                className="block text-sm font-medium text-muted-foreground mb-2"
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
                className="resize-y bg-white text-gray-900 placeholder:text-gray-500 border-border"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {jobDescription.length}/2000 characters
              </p>
            </div>

            {/* CV Upload (Optional) */}
            <div>
              <label
                htmlFor="cvUpload"
                className="block text-sm font-medium text-muted-foreground mb-2"
              >
                Upload Your CV/Resume (Optional)
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Upload your CV to get more personalised questions based on your experience. Supports PDF, DOCX, and images.
              </p>

              {!cvFile ? (
                <div className="relative">
                  <input
                    id="cvUpload"
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={handleCvUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="cvUpload"
                    className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors bg-muted"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-card-foreground">
                        Click to upload your CV
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, DOCX, or image (max 10MB)
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="p-4 border border-border rounded-lg bg-primary/5">
                  {isUploadingCv ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-card-foreground">
                          Analysing your CV...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          This may take a few seconds
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-card-foreground">
                          {cvFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(cvFile.size / 1024).toFixed(1)} KB • {cvText.length} characters extracted
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCv}
                        className="p-1 rounded hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {cvError && (
                <p className="mt-2 text-sm text-red-600">{cvError}</p>
              )}
            </div>

            {/* Question Types */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                What types of questions do you want to practise? (Optional)
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Select the types of questions you want the interviewer to focus on. Leave all unchecked for a balanced mix.
              </p>
              <div className="space-y-2">
                {[
                  { id: 'behavioral', label: 'Behavioural', description: 'Tell me about a time when...' },
                  { id: 'technical', label: 'Technical/Role-specific', description: 'Industry-specific knowledge and skills' },
                  { id: 'competency', label: 'Competency-based', description: 'How would you handle...' },
                  { id: 'situational', label: 'Situational', description: 'What would you do if...' },
                  { id: 'strengths', label: 'Strengths & Weaknesses', description: 'Self-assessment questions' },
                  { id: 'culture', label: 'Company/Culture Fit', description: 'Values and work style alignment' },
                ].map((type) => (
                  <label
                    key={type.id}
                    className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={questionTypes.includes(type.id)}
                      onChange={() => handleQuestionTypeToggle(type.id)}
                      className="mt-1 h-4 w-4 text-primary border-border rounded focus:ring-2 focus:ring-primary accent-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-card-foreground">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Questions */}
            <div>
              <label
                htmlFor="customQuestions"
                className="block text-sm font-medium text-muted-foreground mb-2"
              >
                Add Your Own Questions (Optional)
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Enter specific questions that you struggle with or want to practise. One question per line, max 5 questions.
              </p>
              <Textarea
                id="customQuestions"
                placeholder="Example:&#10;Tell me about a time you failed and what you learned from it&#10;How do you handle conflicts with team members?&#10;Describe a situation where you had to meet a tight deadline"
                value={customQuestions}
                onChange={(e) => setCustomQuestions(e.target.value)}
                rows={5}
                className="resize-y bg-white text-gray-900 placeholder:text-gray-500 border-border"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {customQuestions.split('\n').filter(q => q.trim().length > 0).length} / 5 questions
              </p>
            </div>

            {/* Question Priority Order */}
            {/* Only show if user has at least 2 question sources (custom questions or CV) */}
            {(customQuestions.trim().length > 0 || cvText.trim().length > 0) && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Question Priority Order
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Choose the order in which questions will be asked during the interview. Use the arrow buttons to reorder.
                </p>

                <div className="space-y-2">
                  {questionPriority
                    .filter(source => {
                      // Only show 'custom' if user has custom questions
                      if (source === 'custom' && customQuestions.trim().length === 0) return false;
                      // Only show 'cv' if user has uploaded a CV
                      if (source === 'cv' && cvText.trim().length === 0) return false;
                      // Always show 'generic'
                      return true;
                    })
                    .map((source, index, filteredArray) => (
                      <div
                        key={source}
                        className="flex items-center gap-3 p-3 border border-border rounded-lg bg-white"
                      >
                        <span className="text-lg font-bold text-muted-foreground min-w-[24px]">
                          {index + 1}
                        </span>

                        <div className="flex-1">
                          <div className="font-medium text-card-foreground">
                            {QUESTION_SOURCE_LABELS[source]}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {QUESTION_SOURCE_DESCRIPTIONS[source]}
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => moveUp(questionPriority.indexOf(source))}
                            disabled={index === 0}
                            aria-label="Move up"
                            className="h-8 w-8"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => moveDown(questionPriority.indexOf(source))}
                            disabled={index === filteredArray.length - 1}
                            aria-label="Move down"
                            className="h-8 w-8"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="bg-muted border border-border rounded-lg p-4 flex gap-3">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
              </div>
              <div>
                <h4 className="font-semibold text-card-foreground text-sm mb-1">
                  Your privacy is protected
                </h4>
                <p className="text-sm text-muted-foreground">
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
                className="flex items-center gap-2 border-border text-muted-foreground hover:bg-muted hover:text-card-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-secondary text-primary-foreground">
                Start Interview
              </Button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
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
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConfigureInterviewContent />
    </Suspense>
  );
}
