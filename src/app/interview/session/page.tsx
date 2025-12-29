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
  const maxQuestions = parseInt(searchParams.get('questionCount') || '10', 10);

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
  const [streamingText, setStreamingText] = useState<string>('');
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const initializingRef = useRef(false); // Prevent double initialization

  // Memoized callback to prevent AudioPlayer from re-playing on every render
  const handleAudioPlaybackEnd = useCallback(() => {
    console.log('Audio playback ended, clearing audio URL');
    setCurrentAudioUrl(null);
  }, []);

  // Helper function to handle streaming responses from GPT-4
  const fetchStreamingResponse = async (
    conversationMessages: Array<{ role: string; content: string }>,
    currentQuestionCount: number
  ): Promise<{ response: string; shouldEnd: boolean }> => {
    const response = await fetch('/api/interview/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversationMessages,
        industry,
        messageCount: currentQuestionCount,
        maxQuestions,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate response');
    }

    // Read the stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            break;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullResponse += parsed.content;
              setStreamingText(fullResponse); // Update UI in real-time
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    // Clear streaming text once done
    setStreamingText('');

    // Get metadata from headers
    const shouldEnd = response.headers.get('X-Should-End') === 'true';

    return { response: fullResponse, shouldEnd };
  };

  // Initialize interview with opening question
  useEffect(() => {
    if (!industry || isInitialized || initializingRef.current) return;

    const initializeInterview = async () => {
      // Prevent double initialization (React Strict Mode runs effects twice)
      initializingRef.current = true;
      setIsProcessing(true);

      // Clear any existing audio before starting
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
      setCurrentAudioUrl(null);

      try {
        console.log('Initializing interview...');
        const systemPrompt = generateInterviewPrompt(
          industry,
          role,
          difficulty,
          company,
          jobDescription,
          questionTypes,
          customQuestions,
          followUpIntensity,
          maxQuestions
        );

        // Get streaming response
        const { response: aiResponse } = await fetchStreamingResponse(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Start the interview with an introduction and your first question.' }
          ],
          0
        );

        console.log('Got AI response, generating TTS...');
        // Get TTS for opening question
        const ttsResponse = await fetch('/api/interview/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: aiResponse }),
        });

        if (ttsResponse.ok) {
          const audioBlob = await ttsResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          console.log('Setting initial audio URL');
          setCurrentAudioUrl(audioUrl);
        }

        setMessages([
          {
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date(),
          },
        ]);
        setQuestionCount(1);
        setIsInitialized(true);
        console.log('Interview initialized successfully');
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
        followUpIntensity,
        maxQuestions
      );
      const conversationMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ];

      // Start feedback and streaming response in parallel
      const [feedbackResponse, streamingResult] = await Promise.all([
        feedbackPromise,
        fetchStreamingResponse(conversationMessages, questionCount),
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

      const { response: aiResponse, shouldEnd } = streamingResult;

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
        console.log('[handleRecordingComplete] Setting audio URL:', audioUrl.substring(0, 50));
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
      if (shouldEnd || questionCount >= maxQuestions) {
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

      // Store the question being skipped
      const skippedQuestion = messages[messages.length - 1].content;

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
          followUpIntensity,
          maxQuestions
        );

        const conversationMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
          {
            role: 'user',
            content: `I'd like to skip the question you just asked: "${skippedQuestion}".

Please ask me a COMPLETELY DIFFERENT question on a different topic. Do NOT rephrase the same question or ask about the same subject area. Move on to a new area of questioning entirely.`
          },
        ];

        // Get streaming response for new question
        const { response: aiResponse } = await fetchStreamingResponse(conversationMessages, questionCount);

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
          console.log('[handleSkipQuestion] Setting audio URL:', audioUrl.substring(0, 50));
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
      console.log('Ending interview with', messages.length, 'messages');

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
        const errorData = await evaluationResponse.json().catch(() => ({}));
        console.error('Evaluation API error:', evaluationResponse.status, errorData);
        throw new Error(errorData.error || `Evaluation failed with status ${evaluationResponse.status}`);
      }

      const evaluation = await evaluationResponse.json();
      console.log('Evaluation generated successfully');

      // Store evaluation in sessionStorage
      sessionStorage.setItem('interviewEvaluation', JSON.stringify(evaluation));

      // Navigate to evaluation page
      router.push('/interview/evaluation');
    } catch (err) {
      console.error('Error ending interview:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate evaluation: ${errorMessage}`);
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
      {/* Fullscreen Mode: Webcam background with overlay panels */}
      <div className="flex-1 relative bg-black overflow-hidden">

          {/* Fullscreen Webcam Background - Aligned with side panels */}
          <div className="absolute top-4 left-0 right-0 bottom-48 mx-auto" style={{ maxWidth: 'calc(100% - 680px)' }}>
            {showWebcam ? (
              <div className="w-full h-full rounded-lg overflow-hidden">
                <WebcamMirror
                  isVisible={showWebcam}
                  onClose={() => setShowWebcam(false)}
                  mode="embedded"
                  size="large"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-700">
                <div className="text-center">
                  <CameraOff className="h-16 w-16 text-gray-600 mb-4 mx-auto" />
                  <p className="text-gray-500 mb-4">Webcam is hidden</p>
                  <Button
                    onClick={() => setShowWebcam(true)}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-gray-300"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Enable Webcam
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Left Overlay: Conversation */}
          <div className="absolute left-4 top-4 bottom-4 w-80 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 sticky top-0 bg-slate-900/90 pb-2 border-b border-slate-700">
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

              {streamingText && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-600/20 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-pink-400" />
                    </div>
                  </div>
                  <div className="max-w-[80%] rounded-lg p-3 bg-slate-700/50 border border-slate-600 text-gray-200">
                    <p className="text-xs whitespace-pre-wrap">{streamingText}</p>
                    <span className="inline-block w-2 h-4 bg-pink-400 ml-1 animate-pulse"></span>
                  </div>
                </div>
              )}

              {isProcessing && !streamingText && (
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-pink-400" />
                  <span>{!isInitialized ? 'Preparing...' : 'AI is thinking...'}</span>
                </div>
              )}

              {!isInitialized && isProcessing && (
                <div className="text-center mt-4">
                  <p className="text-sm text-pink-400 font-medium">Take a deep breath. You've got this.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Overlay: Feedback */}
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-4 overflow-y-auto">
            <FeedbackPanel
              feedbackHistory={feedbackHistory}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* Center Bottom: All Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3">
            {/* Top Row: Interview Controls */}
            <div className="flex items-center gap-2">
              <div className="text-xs text-white/80 bg-slate-900/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700">
                Question {questionCount}/{maxQuestions}
              </div>
              <Button
                onClick={() => setShowWebcam(!showWebcam)}
                variant="outline"
                size="icon"
                title={showWebcam ? "Hide webcam" : "Show webcam"}
                className="bg-slate-900/90 backdrop-blur-sm border-slate-700 text-gray-300 hover:bg-slate-800 hover:text-white"
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
                className="bg-slate-900/90 backdrop-blur-sm border-slate-700 text-gray-300 hover:bg-slate-800 hover:text-white text-xs px-3"
              >
                End Interview
              </Button>
            </div>

            {/* Error Messages */}
            {error && (
              <div className="bg-red-900/90 backdrop-blur-sm border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Audio Player */}
            {currentAudioUrl && (
              <div>
                <AudioPlayer
                  audioUrl={currentAudioUrl}
                  onPlaybackEnd={handleAudioPlaybackEnd}
                  audioRef={currentAudioRef}
                />
              </div>
            )}

            {/* Voice Recorder and Action Buttons */}
            {!isProcessing && currentAudioUrl === null && (
              <div className="space-y-3">
                <div className="bg-slate-900/90 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-slate-700">
                  <VoiceRecorder
                    onRecordingComplete={handleRecordingComplete}
                    isProcessing={isProcessing}
                  />
                </div>

                {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSkipQuestion}
                      variant="outline"
                      className="border-purple-300 text-purple-300 hover:bg-purple-900/50 backdrop-blur-sm flex-1"
                    >
                      ⤭ Skip This Question
                    </Button>
                    {messages.length >= 2 && (
                      <Button
                        onClick={handleRedoAnswer}
                        variant="outline"
                        className="border-orange-300 text-orange-300 hover:bg-orange-900/50 backdrop-blur-sm flex-1"
                      >
                        ↻ Redo Answer
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
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
