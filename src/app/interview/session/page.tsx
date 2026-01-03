'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import VoiceRecorder from '@/components/interview/VoiceRecorder';
import AudioPlayer from '@/components/interview/AudioPlayer';
import FeedbackPanel, { FeedbackItem } from '@/components/interview/FeedbackPanel';
import WebcamMirror from '@/components/interview/WebcamMirror';
import PerformanceScore from '@/components/interview/PerformanceScore';
import { Industry, generateInterviewPrompt } from '@/lib/interview-prompts';
import { Loader2, User, Bot, Camera, CameraOff, Home, GraduationCap } from 'lucide-react';

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
  const cvText = searchParams.get('cv') || '';

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
  const [showIdealAnswers, setShowIdealAnswers] = useState(false); // Toggle for ideal answers
  const [streamingText, setStreamingText] = useState<string>('');
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const initializingRef = useRef(false); // Prevent double initialization

  // Performance scoring state
  const [cumulativeScores, setCumulativeScores] = useState({
    communication: [] as number[],
    technicalKnowledge: [] as number[],
    problemSolving: [] as number[],
    relevantExperience: [] as number[],
  });

  // Calculate average scores
  const calculateAverage = (scores: number[]) => {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  const currentScores = {
    communication: calculateAverage(cumulativeScores.communication),
    technicalKnowledge: calculateAverage(cumulativeScores.technicalKnowledge),
    problemSolving: calculateAverage(cumulativeScores.problemSolving),
    relevantExperience: calculateAverage(cumulativeScores.relevantExperience),
  };

  const overallScore = (
    currentScores.communication +
    currentScores.technicalKnowledge +
    currentScores.problemSolving +
    currentScores.relevantExperience
  ) / 4;

  // Memoized callback to prevent AudioPlayer from re-playing on every render
  const handleAudioPlaybackEnd = useCallback(() => {
    console.log('Audio playback ended, clearing audio URL');
    setCurrentAudioUrl(null);
  }, []);

  // Helper function to handle streaming responses from GPT-4 with optimistic UI
  const fetchStreamingResponse = async (
    conversationMessages: Array<{ role: string; content: string }>,
    currentQuestionCount: number,
    onStreamUpdate?: (text: string) => void
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
              // Call callback to update UI optimistically
              if (onStreamUpdate) {
                onStreamUpdate(fullResponse);
              }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

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
          maxQuestions,
          cvText
        );

        // Add optimistic message immediately
        const optimisticMessage: Message = {
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };
        setMessages([optimisticMessage]);

        // Get streaming response with optimistic UI
        const { response: aiResponse } = await fetchStreamingResponse(
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Start the interview with an introduction and your first question.' }
          ],
          0,
          (streamingText) => {
            // Update message as text streams in
            setMessages([{
              role: 'assistant',
              content: streamingText,
              timestamp: new Date(),
            }]);
          }
        );

        console.log('Got AI response, generating TTS in background...');

        // Generate TTS in background (non-blocking)
        fetch('/api/interview/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: aiResponse }),
        }).then(async (ttsResponse) => {
          if (ttsResponse.ok) {
            const audioBlob = await ttsResponse.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log('Initial TTS ready, auto-playing...');

            // Update message with audio
            setMessages([{
              role: 'assistant',
              content: aiResponse,
              audioUrl,
              timestamp: new Date(),
            }]);

            // Auto-play
            setCurrentAudioUrl(audioUrl);
          }
        }).catch((err) => {
          console.error('Initial TTS failed:', err);
        });

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

    // LATENCY MASKING: Show immediate "thinking" response
    const thinkingMessage: Message = {
      role: 'assistant',
      content: '...',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, thinkingMessage]);

    try {
      // Step 1: Transcribe audio
      console.log(`[handleRecordingComplete] Audio blob size: ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`);

      const formData = new FormData();
      formData.append('audio', audioBlob);

      console.log('[handleRecordingComplete] Sending audio for transcription...');
      const transcriptResponse = await fetch('/api/interview/audio', {
        method: 'POST',
        body: formData,
      });

      if (!transcriptResponse.ok) {
        const errorData = await transcriptResponse.json().catch(() => ({}));
        console.error('[handleRecordingComplete] Transcription failed:', transcriptResponse.status, errorData);
        throw new Error(errorData.error || `Failed to transcribe audio (${transcriptResponse.status})`);
      }

      const { text } = await transcriptResponse.json();
      console.log(`[handleRecordingComplete] Transcription successful: ${text.substring(0, 50)}...`);

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

      // Step 3: Generate AI response with optimistic UI
      const systemPrompt = generateInterviewPrompt(
        industry,
        role,
        difficulty,
        company,
        jobDescription,
        questionTypes,
        customQuestions,
        followUpIntensity,
        maxQuestions,
        cvText
      );
      const conversationMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ];

      // Replace thinking indicator with streaming content
      // (thinking message was already added at the start of handleRecordingComplete)

      // Start feedback and streaming response in parallel
      const [feedbackResponse, streamingResult] = await Promise.all([
        feedbackPromise,
        fetchStreamingResponse(conversationMessages, questionCount, (streamingText) => {
          // Update the optimistic message as text streams in
          setMessages((prev) => {
            const updated = [...prev];
            // Find the LAST assistant message (the "..." thinking indicator)
            // Don't just use lastIndex because user message was added after thinking message
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === 'assistant') {
                updated[i] = {
                  ...updated[i],
                  content: streamingText,
                };
                break;
              }
            }
            return updated;
          });
        }),
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
          suggestedImprovements: feedbackData.suggestedImprovements || [],
          timestamp: new Date(),
        };

        // Update cumulative scores
        if (feedbackData.scores) {
          setCumulativeScores(prev => ({
            communication: [...prev.communication, feedbackData.scores.communication],
            technicalKnowledge: [...prev.technicalKnowledge, feedbackData.scores.technicalKnowledge],
            problemSolving: [...prev.problemSolving, feedbackData.scores.problemSolving],
            relevantExperience: [...prev.relevantExperience, feedbackData.scores.relevantExperience],
          }));
        }

        // Generate ideal answer if enabled
        if (showIdealAnswers) {
          try {
            const idealAnswerResponse = await fetch('/api/interview/ideal-answer', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                question: lastQuestion,
                answer: text, // Pass the candidate's actual answer
                industry,
                role,
                difficulty,
                company,
              }),
            });

            if (idealAnswerResponse.ok) {
              const { idealAnswer } = await idealAnswerResponse.json();
              newFeedback.idealAnswer = idealAnswer;
            }
          } catch (error) {
            console.error('Failed to generate ideal answer:', error);
          }
        }

        setFeedbackHistory((prev) => [newFeedback, ...prev]); // Newest at top
      } else {
        console.error('Failed to generate feedback');
      }
      setIsAnalyzing(false);

      const { response: aiResponse, shouldEnd } = streamingResult;

      // Step 4: Generate TTS for AI response (in background while user reads text)
      // Don't await - let TTS generate while user reads the text
      const ttsPromise = fetch('/api/interview/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiResponse }),
      }).then(async (ttsResponse) => {
        if (ttsResponse.ok) {
          const audioBlob = await ttsResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          console.log('[handleRecordingComplete] TTS ready, setting audio URL');

          // Update the message with audio URL
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex]?.role === 'assistant') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                audioUrl,
              };
            }
            return updated;
          });

          // Auto-play the audio
          setCurrentAudioUrl(audioUrl);
        }
      }).catch((err) => {
        console.error('TTS generation failed:', err);
        // Text is already showing, so this is non-critical
      });

      setQuestionCount((prev) => prev + 1);

      // Don't auto-end the interview - let the user review their feedback and manually click "End Interview"
      // The AI will naturally wrap up by asking "Do you have any questions for me?" after maxQuestions
      // but the user controls when to actually end the session
    } catch (err) {
      console.error('Error processing response:', err);

      // Provide more specific error messages
      let errorMessage = 'An error occurred. Please try again.';

      if (err instanceof Error) {
        // Check for common error types
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (err.message.includes('413') || err.message.includes('too large')) {
          errorMessage = 'Recording too long. Please keep answers under 60 seconds and try again.';
        } else if (err.message.includes('No speech detected')) {
          errorMessage = 'No speech detected. Please ensure your microphone is working and try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try a shorter answer or check your connection.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }

      setError(errorMessage);
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
      // Remove the latest scores
      setCumulativeScores((prev) => ({
        communication: prev.communication.slice(0, -1),
        technicalKnowledge: prev.technicalKnowledge.slice(0, -1),
        problemSolving: prev.problemSolving.slice(0, -1),
        relevantExperience: prev.relevantExperience.slice(0, -1),
      }));
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
          maxQuestions,
          cvText
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

        // Add optimistic message for new question
        const optimisticMessage: Message = {
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, optimisticMessage]);

        // Get streaming response for new question with optimistic UI
        const { response: aiResponse } = await fetchStreamingResponse(
          conversationMessages,
          questionCount,
          (streamingText) => {
            // Update message as text streams in
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              if (updated[lastIndex]?.role === 'assistant') {
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  content: streamingText,
                };
              }
              return updated;
            });
          }
        );

        // Generate TTS in background (non-blocking)
        fetch('/api/interview/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: aiResponse }),
        }).then(async (ttsResponse) => {
          if (ttsResponse.ok) {
            const audioBlob = await ttsResponse.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log('[handleSkipQuestion] TTS ready');

            // Update message with audio
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              if (updated[lastIndex]?.role === 'assistant') {
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  audioUrl,
                };
              }
              return updated;
            });

            // Auto-play
            setCurrentAudioUrl(audioUrl);
          }
        }).catch((err) => {
          console.error('Skip question TTS failed:', err);
        });

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

  const handleGoHome = () => {
    const confirmLeave = window.confirm(
      'Are you sure you want to leave? Your interview progress will be lost.'
    );
    if (confirmLeave) {
      router.push('/');
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
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Fullscreen Mode: Webcam background with overlay panels */}
      <div className="flex-1 relative bg-primary overflow-hidden">

          {/* Fullscreen Webcam Background - Aligned with side panels */}
          <div className="absolute top-4 left-0 right-0 bottom-48 mx-auto" style={{ maxWidth: 'calc(100% - 680px)' }}>
            {showWebcam ? (
              <div className="w-full h-full rounded-lg overflow-hidden border border-primary/30">
                <WebcamMirror
                  isVisible={showWebcam}
                  onClose={() => setShowWebcam(false)}
                  mode="embedded"
                  size="large"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary rounded-lg border border-primary/30">
                <div className="text-center">
                  <CameraOff className="h-16 w-16 text-primary-foreground/40 mb-4 mx-auto" />
                  <p className="text-primary-foreground/60">Webcam is hidden</p>
                </div>
              </div>
            )}
          </div>

          {/* Left Overlay: Conversation */}
          <div className="absolute left-4 top-4 bottom-4 w-80 bg-primary/95 backdrop-blur-md border border-primary/30 rounded-lg shadow-2xl flex flex-col">
            <h3 className="text-sm font-semibold text-primary-foreground/90 p-4 pb-3 border-b border-primary/30 flex-shrink-0">
              Interview Conversation
            </h3>
            <div className="flex-1 overflow-y-auto p-4 pt-3 space-y-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br bg-accent/20 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-accent" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-accent text-accent-foreground shadow-md'
                        : 'bg-primary/50 border border-primary/20 text-primary-foreground shadow-md'
                    }`}
                  >
                    <p className="text-xs whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {streamingText && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                  <div className="max-w-[80%] rounded-lg p-3 bg-primary/50 border border-primary/20 text-primary-foreground shadow-md">
                    <p className="text-xs whitespace-pre-wrap">{streamingText}</p>
                    <span className="inline-block w-2 h-4 bg-accent ml-1 animate-pulse"></span>
                  </div>
                </div>
              )}

              {isProcessing && !streamingText && (
                <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  <span>{!isInitialized ? 'Preparing...' : 'AI is thinking...'}</span>
                </div>
              )}

              {!isInitialized && isProcessing && (
                <div className="text-center mt-4">
                  <p className="text-sm text-accent font-medium">Take a deep breath. You've got this.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Overlay: Feedback */}
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-primary/95 backdrop-blur-md border border-primary/30 rounded-lg overflow-hidden shadow-2xl">
            <FeedbackPanel
              feedbackHistory={feedbackHistory}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* Center Bottom: All Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3">
            {/* Top Row: Interview Controls */}
            <TooltipProvider>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleGoHome}
                      variant="outline"
                      size="icon"
                      className="bg-primary/95 backdrop-blur-md border-primary/30 text-primary-foreground/90 hover:bg-secondary hover:text-primary-foreground shadow-lg"
                    >
                      <Home className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Back to home</p>
                  </TooltipContent>
                </Tooltip>

                <div className="text-xs text-primary-foreground/90 bg-primary/95 backdrop-blur-md px-3 py-2 rounded-lg border border-primary/30 shadow-lg">
                  Question {questionCount}/{maxQuestions}
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowWebcam(!showWebcam)}
                      variant="outline"
                      size="icon"
                      className="bg-primary/95 backdrop-blur-md border-primary/30 text-primary-foreground/90 hover:bg-secondary hover:text-primary-foreground shadow-lg"
                    >
                      {showWebcam ? (
                        <Camera className="h-4 w-4" />
                      ) : (
                        <CameraOff className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showWebcam ? 'Hide webcam' : 'Show webcam'}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowIdealAnswers(!showIdealAnswers)}
                      variant="outline"
                      size="icon"
                      className={`backdrop-blur-md border-primary/30 hover:bg-secondary hover:text-primary-foreground shadow-lg ${
                        showIdealAnswers
                          ? 'bg-blue-600/90 text-white'
                          : 'bg-primary/95 text-primary-foreground/90'
                      }`}
                    >
                      <GraduationCap className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showIdealAnswers ? 'Hide answer improvements' : 'Show how to improve your answers after each question'}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleEndInterview}
                      variant="outline"
                      disabled={isProcessing}
                      className="bg-primary/95 backdrop-blur-md border-primary/30 text-primary-foreground/90 hover:bg-secondary hover:text-primary-foreground text-xs px-3 shadow-lg"
                    >
                      End Interview
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Finish interview and get evaluation report</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            {/* Performance Score Display */}
            {cumulativeScores.communication.length > 0 && (
              <PerformanceScore
                overallScore={overallScore}
                categoryScores={currentScores}
                answersCount={cumulativeScores.communication.length}
                industry={industry}
              />
            )}

            {/* Error Messages */}
            {error && (
              <div className="bg-red-900/90 backdrop-blur-md border border-red-500/50 rounded-lg p-3 text-red-400 text-sm shadow-lg">
                {error}
              </div>
            )}

            {/* Interview Complete Notice */}
            {questionCount >= maxQuestions && !error && (
              <div className="bg-indigo-900/90 backdrop-blur-md border border-indigo-500/50 rounded-lg p-4 text-indigo-200 shadow-lg animate-in fade-in slide-in-from-top duration-500">
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-indigo-300 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-indigo-100 mb-1">Interview Questions Complete</p>
                    <p className="text-sm text-indigo-300">
                      You've answered all {maxQuestions} questions. Take time to review your feedback on the right, then click <span className="font-semibold">"End Interview"</span> when you're ready to see your final evaluation report.
                    </p>
                  </div>
                </div>
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
                <div className="bg-card backdrop-blur-md rounded-lg shadow-xl p-4 border border-border">
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
                      className="border-primary text-primary hover:bg-primary/10 backdrop-blur-md flex-1 shadow-md bg-background/80"
                    >
                      ⤭ Skip This Question
                    </Button>
                    {messages.length >= 2 && (
                      <Button
                        onClick={handleRedoAnswer}
                        variant="outline"
                        className="border-amber-700 text-amber-700 hover:bg-amber-900/50 backdrop-blur-md flex-1 shadow-md bg-background/80"
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
