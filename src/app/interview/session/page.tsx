'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import VoiceRecorder from '@/components/interview/VoiceRecorder';
import AudioPlayer from '@/components/interview/AudioPlayer';
import FeedbackPanel, { FeedbackItem } from '@/components/interview/FeedbackPanel';
import WebcamMirror from '@/components/interview/WebcamMirror';
import { Industry, generateInterviewPrompt } from '@/lib/interview-prompts';
import { Loader2, User, Bot, Camera, CameraOff } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  timestamp: Date;
}

function InterviewSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const industry = searchParams.get('industry') as Industry;
  const company = searchParams.get('company') || 'A Leading Company';
  const role = searchParams.get('role') || 'General Role';
  const difficulty = (searchParams.get('difficulty') as 'entry-level' | 'mid-level' | 'senior' | 'executive') || 'mid-level';
  const jobDescription = searchParams.get('jd') || '';
  const questionTypesParam = searchParams.get('questionTypes') || '';
  const customQuestionsParam = searchParams.get('customQuestions') || '';
  const followUpIntensity = (searchParams.get('followUpIntensity') as 'none' | 'light' | 'moderate' | 'intensive') || 'moderate';

  // Parse question types from comma-separated string
  const questionTypes = questionTypesParam ? questionTypesParam.split(',') : [];

  // Parse custom questions from delimiter-separated string
  const customQuestions = customQuestionsParam
    ? customQuestionsParam.split('|||').filter(q => q.trim().length > 0)
    : [];

  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showWebcam, setShowWebcam] = useState(true); // Default ON for better UX

  // Initialize interview with opening question
  useEffect(() => {
    if (!industry || isInitialized) return;

    const initializeInterview = async () => {
      setIsProcessing(true);
      try {
        const systemPrompt = generateInterviewPrompt(
          industry,
          role,
          difficulty,
          company,
          jobDescription,
          questionTypes,
          customQuestions,
          followUpIntensity
        );

        const response = await fetch('/api/interview/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: 'Start the interview with an introduction and your first question.' }
            ],
            industry,
            messageCount: 0,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to start interview');
        }

        const data = await response.json();

        // Get TTS for opening question
        const ttsResponse = await fetch('/api/interview/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: data.response }),
        });

        if (ttsResponse.ok) {
          const audioBlob = await ttsResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          setCurrentAudioUrl(audioUrl);
        }

        setMessages([
          {
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
          },
        ]);
        setQuestionCount(1);
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing interview:', err);
        setError('Failed to start interview. Please check your API key and try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    initializeInterview();
  }, [industry, isInitialized]);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    setCurrentAudioUrl(null);

    try {
      // Step 1: Transcribe audio
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const transcriptResponse = await fetch('/api/interview/audio', {
        method: 'POST',
        body: formData,
      });

      if (!transcriptResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const { text } = await transcriptResponse.json();

      // Add user message to conversation
      const userMessage: Message = {
        role: 'user',
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Get the last AI question for feedback context
      const lastQuestion = messages.length > 0 ? messages[messages.length - 1].content : '';

      // Step 2: Generate real-time feedback (parallel with AI response)
      setIsAnalyzing(true);
      const feedbackPromise = fetch('/api/interview/analyze-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: lastQuestion,
          answer: text,
          industry,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      // Step 3: Generate AI response (in parallel)
      const systemPrompt = generateInterviewPrompt(
        industry,
        role,
        difficulty,
        company,
        jobDescription,
        questionTypes,
        customQuestions,
        followUpIntensity
      );
      const conversationMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ];

      const messagePromise = fetch('/api/interview/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationMessages,
          industry,
          messageCount: questionCount,
        }),
      });

      // Wait for both feedback and AI response
      const [feedbackResponse, messageResponse] = await Promise.all([
        feedbackPromise,
        messagePromise,
      ]);

      // Process feedback
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        const newFeedback: FeedbackItem = {
          questionNumber: questionCount,
          question: lastQuestion,
          answer: text,
          strengths: feedbackData.strengths || [],
          weaknesses: feedbackData.weaknesses || [],
          opportunities: feedbackData.opportunities || [],
          threats: feedbackData.threats || [],
          timestamp: new Date(),
        };
        setFeedbackHistory((prev) => [newFeedback, ...prev]); // Newest at top
      } else {
        console.error('Failed to generate feedback');
      }
      setIsAnalyzing(false);

      // Process AI response
      if (!messageResponse.ok) {
        throw new Error('Failed to generate response');
      }

      const { response: aiResponse, shouldEnd } = await messageResponse.json();

      // Step 4: Generate TTS for AI response
      const ttsResponse = await fetch('/api/interview/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiResponse }),
      });

      let audioUrl = null;
      if (ttsResponse.ok) {
        const audioBlob = await ttsResponse.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        setCurrentAudioUrl(audioUrl);
      }

      // Add assistant message to conversation
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        audioUrl: audioUrl || undefined,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setQuestionCount((prev) => prev + 1);

      // Check if interview should end
      if (shouldEnd || questionCount >= 10) {
        setTimeout(() => {
          handleEndInterview();
        }, 3000); // Give time for final message to play
      }
    } catch (err) {
      console.error('Error processing response:', err);
      setError('An error occurred. Please try again.');
      setIsAnalyzing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndInterview = async () => {
    setIsProcessing(true);

    try {
      // Generate evaluation
      const evaluationResponse = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: messages.map(m => ({ role: m.role, content: m.content })),
          industry,
        }),
      });

      if (!evaluationResponse.ok) {
        throw new Error('Failed to generate evaluation');
      }

      const evaluation = await evaluationResponse.json();

      // Store evaluation in sessionStorage
      sessionStorage.setItem('interviewEvaluation', JSON.stringify(evaluation));

      // Navigate to evaluation page
      router.push('/interview/evaluation');
    } catch (err) {
      console.error('Error ending interview:', err);
      setError('Failed to generate evaluation. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!industry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {role} Interview
              </h1>
              <p className="text-sm text-gray-600">
                {company} | Question {questionCount} of 10
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowWebcam(!showWebcam)}
                variant="outline"
                size="icon"
                title={showWebcam ? "Hide webcam" : "Show webcam"}
                className={showWebcam ? "bg-blue-50 border-blue-300" : ""}
              >
                {showWebcam ? (
                  <Camera className="h-4 w-4 text-blue-600" />
                ) : (
                  <CameraOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={handleEndInterview}
                variant="outline"
                disabled={isProcessing}
              >
                End Interview & Get Results
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Section - Webcam + Feedback Side by Side */}
      <div className="bg-gradient-to-b from-gray-100 to-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Webcam */}
            <div className="flex-1 lg:w-[55%]">
              {showWebcam ? (
                <WebcamMirror
                  isVisible={showWebcam}
                  onClose={() => setShowWebcam(false)}
                  mode="embedded"
                  size="large"
                />
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center h-96 flex flex-col items-center justify-center">
                  <CameraOff className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm font-medium text-gray-600 mb-2">Webcam is hidden</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Enable your webcam to practice like a real video interview
                  </p>
                  <Button
                    onClick={() => setShowWebcam(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Enable Webcam
                  </Button>
                </div>
              )}
            </div>

            {/* Right: Feedback Panel */}
            <div className="flex-1 lg:w-[45%]">
              <div className="bg-white rounded-lg border border-gray-200 h-96 overflow-hidden">
                <FeedbackPanel
                  feedbackHistory={feedbackHistory}
                  isAnalyzing={isAnalyzing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Conversation (Full Width) */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="space-y-6 mb-8">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-2xl rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{!isInitialized ? 'Preparing your interview...' : 'AI is thinking...'}</span>
            </div>
          )}

          {!isInitialized && isProcessing && (
            <div className="text-center mt-4">
              <p className="text-lg text-blue-600 font-medium">Take a deep breath. You've got this.</p>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-8">
            {error}
          </div>
        )}

        {/* Voice Recorder */}
        {!isProcessing && currentAudioUrl === null && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 max-w-2xl mx-auto">
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {/* Current audio playing */}
        {currentAudioUrl && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 max-w-2xl mx-auto">
            <AudioPlayer
              audioUrl={currentAudioUrl}
              onPlaybackEnd={() => setCurrentAudioUrl(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterviewSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <InterviewSessionContent />
    </Suspense>
  );
}
