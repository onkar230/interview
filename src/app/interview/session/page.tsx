'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
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
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Memoized callback to prevent AudioPlayer from re-playing on every render
  const handleAudioPlaybackEnd = useCallback(() => {
    setCurrentAudioUrl(null);
  }, []);

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

  const handleRedoAnswer = () => {
    // Remove the last user message and AI response to allow re-answering the same question
    if (messages.length >= 2) {
      // Remove last 2 messages (user answer + AI follow-up)
      setMessages((prev) => prev.slice(0, -2));
      // Decrement question count
      setQuestionCount((prev) => Math.max(1, prev - 1));
      // Remove the latest feedback item
      setFeedbackHistory((prev) => prev.slice(1));
      // Clear any errors
      setError(null);
    }
  };

  const handleSkipQuestion = async () => {
    // Skip the current AI question and ask for a different one
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      // Stop and cleanup current audio immediately
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }
      setCurrentAudioUrl(null);

      setMessages((prev) => prev.slice(0, -1));
      setIsProcessing(true);
      setError(null);

      try {
        // Ask GPT-4 for a different question
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
          ...messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
          {
            role: 'user',
            content: 'The previous question was not relevant to my experience or the role. Please ask a different question that better aligns with the interview focus.'
          },
        ];

        const messageResponse = await fetch('/api/interview/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversationMessages,
            industry,
            messageCount: questionCount,
          }),
        });

        if (!messageResponse.ok) {
          throw new Error('Failed to generate new question');
        }

        const { response: aiResponse } = await messageResponse.json();

        // Generate TTS for new question
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

        // Add new assistant message
        const newMessage: Message = {
          role: 'assistant',
          content: aiResponse,
          audioUrl: audioUrl || undefined,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newMessage]);

      } catch (err) {
        console.error('Error skipping question:', err);
        setError('Failed to generate new question. Please try again.');
      } finally {
        setIsProcessing(false);
      }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {role} Interview
              </h1>
              <p className="text-sm text-gray-300">
                {company} | Question {questionCount} of 10
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowWebcam(!showWebcam)}
                variant="outline"
                size="icon"
                title={showWebcam ? "Hide webcam" : "Show webcam"}
                className={showWebcam ? "bg-pink-500/20 border-pink-500 text-pink-400" : "border-slate-600 text-gray-400 hover:text-white"}
              >
                {showWebcam ? (
                  <Camera className="h-4 w-4" />
                ) : (
                  <CameraOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={handleEndInterview}
                variant="outline"
                disabled={isProcessing}
                className="border-slate-600 text-gray-300 hover:bg-slate-800 hover:text-white"
              >
                End Interview & Get Results
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Layout: Q&A (Left) | Webcam + Controls (Center) | Feedback (Right) */}
      <div className="flex-1 bg-gradient-to-b from-slate-900 to-purple-900/50">
        <div className="max-w-7xl mx-auto px-6 py-6 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left Column: Conversation/Q&A */}
            <div className="lg:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <h3 className="text-sm font-semibold text-gray-300 mb-4 sticky top-0 bg-gradient-to-br from-slate-800 to-slate-900 pb-2 border-b border-slate-700">
                Interview Conversation
              </h3>
              <div className="space-y-4">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-600/20 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-pink-400" />
                        </div>
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white'
                          : 'bg-slate-700/50 border border-slate-600 text-gray-200'
                      }`}
                    >
                      <p className="text-xs whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-pink-400" />
                    <span>{!isInitialized ? 'Preparing...' : 'AI thinking...'}</span>
                  </div>
                )}

                {!isInitialized && isProcessing && (
                  <div className="text-center mt-4">
                    <p className="text-sm text-pink-400 font-medium">Take a deep breath. You've got this.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Center Column: Webcam + Controls */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              {/* Webcam */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                {showWebcam ? (
                  <WebcamMirror
                    isVisible={showWebcam}
                    onClose={() => setShowWebcam(false)}
                    mode="embedded"
                    size="large"
                  />
                ) : (
                  <div className="p-8 text-center h-96 flex flex-col items-center justify-center">
                    <CameraOff className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm font-medium text-gray-600 mb-2">Webcam is hidden</p>
                    <p className="text-xs text-gray-500 mb-4">
                      Enable your webcam to practise like a real video interview
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

              {/* Error display */}
              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Voice Recorder */}
              {!isProcessing && currentAudioUrl === null && (
                <div className="space-y-3">
                  <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                    <VoiceRecorder
                      onRecordingComplete={handleRecordingComplete}
                      isProcessing={isProcessing}
                    />
                  </div>

                  {/* Skip Question Button - Show when AI just asked a question */}
                  {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                    <div className="text-center">
                      <Button
                        onClick={handleSkipQuestion}
                        variant="outline"
                        className="border-purple-300 text-purple-600 hover:bg-purple-50 w-full"
                      >
                        ⤭ Skip This Question
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Question not relevant? Get a different one
                      </p>
                    </div>
                  )}

                  {/* Redo Answer Button - Show after user has answered */}
                  {messages.length >= 2 && messages[messages.length - 1].role === 'assistant' && (
                    <div className="text-center">
                      <Button
                        onClick={handleRedoAnswer}
                        variant="outline"
                        className="border-orange-300 text-orange-600 hover:bg-orange-50 w-full"
                      >
                        ↻ Redo Last Answer
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Want to try a better answer?
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Current audio playing */}
              {currentAudioUrl && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg shadow-lg p-4">
                    <AudioPlayer
                      audioUrl={currentAudioUrl}
                      onPlaybackEnd={handleAudioPlaybackEnd}
                      audioRef={currentAudioRef}
                    />
                  </div>

                  {/* Skip Question Button - Available during audio playback */}
                  {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                    <div className="text-center">
                      <Button
                        onClick={handleSkipQuestion}
                        variant="outline"
                        className="border-purple-300 text-purple-600 hover:bg-purple-50 w-full"
                      >
                        ⤭ Skip This Question
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Question not relevant? Get a different one
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Feedback Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                <FeedbackPanel
                  feedbackHistory={feedbackHistory}
                  isAnalyzing={isAnalyzing}
                />
              </div>
            </div>
          </div>
        </div>
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
