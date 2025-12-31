# AI Mock Interview Platform

An AI-powered mock interview platform featuring voice-based interviews, industry-specific interviewers, real-time feedback, and detailed evaluation reports.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Design System](#design-system)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [API Routes](#api-routes)
- [Environment Variables](#environment-variables)
- [Recent Updates](#recent-updates)

## Overview

The AI Mock Interview Platform helps users prepare for job interviews through realistic, voice-based practice sessions. Users can select from different industries (Technology, Engineering, Finance, Law), customize their interview experience, and receive detailed feedback on their performance.

## Features

### Core Functionality

- **Industry-Specific Interviews**: Tailored interview experiences for Technology, Engineering, Finance, and Law careers
- **Voice-Based Interaction**: Natural conversation flow using speech-to-text and text-to-speech
- **Real-Time Feedback**: Live analysis of answers with strengths, weaknesses, and improvement suggestions
- **Webcam Support**: Optional video mirror for self-monitoring (not recorded)
- **Interview Customization**: Adjust difficulty, question types, follow-up intensity, and add custom questions
- **Comprehensive Evaluation**: Detailed post-interview analysis with verdict, strengths, weaknesses, and critical issues
- **Progress Tracking**: Visual progress indicators throughout the interview flow

### Interview Flow

1. **Industry Selection** - Choose your target industry
2. **Configuration** - Customize interview parameters (company, role, difficulty, question types)
3. **Live Interview** - Voice-based Q&A with AI interviewer
4. **Real-Time Feedback** - Immediate analysis of each answer
5. **Final Evaluation** - Comprehensive performance report

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Fonts**: Inter (UI), Crimson Pro (headings)

### AI & APIs
- **LLM**: OpenAI GPT-4 (conversation & evaluation)
- **Speech-to-Text**: OpenAI Whisper API
- **Text-to-Speech**: OpenAI TTS API

### Database & Auth
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for audio files)

### Deployment
- **Platform**: Vercel (recommended)
- **CI/CD**: Automatic deployments via Git integration

## Design System

The platform uses an **Elicit-inspired** design theme featuring a clean, academic aesthetic:

### Color Palette

```css
/* Primary Colors */
--background: #fcfcf8;      /* Off-white base */
--foreground: #2f332f;      /* Dark charcoal text */
--card: #f2f4dc;            /* Light cream cards */
--primary: #083d44;         /* Dark teal */
--secondary: #026370;       /* Secondary teal */
--accent: #e5ff97;          /* Bright lime accent */
--border: #c6e28b;          /* Sage green border */
--muted: #e8e8e0;           /* Muted backgrounds */
```

### Typography

- **UI Font**: Inter (sans-serif) - clean, readable interface text
- **Heading Font**: Crimson Pro (serif) - elegant, academic-style headings
- **Font Loading**: Google Fonts with `display: swap` for optimal performance

### Design Principles

- **Accessibility First**: WCAG-compliant color contrast ratios
- **Consistent Spacing**: Tailwind's spacing scale for predictable layouts
- **Responsive Design**: Mobile-first approach with breakpoints at sm, md, lg
- **Subtle Animations**: Smooth transitions for enhanced UX without distraction

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm/bun
- OpenAI API key
- Supabase project (database, auth, storage)

### Installation

1. **Clone the repository**
   ```bash
   cd ai-interview-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # OpenAI
   OPENAI_API_KEY=sk-...

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/src
  /app
    /(auth)
      /login              # User login page
      /signup             # User registration
    /interview
      /select             # Industry selection
      /configure          # Interview customization
      /session            # Live interview room
      /evaluation         # Post-interview results
    /api
      /interview
        /message          # AI conversation endpoint
        /audio            # Speech-to-text processing
        /tts              # Text-to-speech generation
        /analyze-answer   # Real-time feedback
        /evaluate         # Final evaluation
    /page.tsx             # Homepage
    /layout.tsx           # Root layout with fonts
    /globals.css          # Global styles & theme variables

  /components
    /interview
      /VoiceRecorder.tsx      # Audio recording component
      /AudioPlayer.tsx        # Audio playback with auto-play
      /FeedbackPanel.tsx      # Live feedback display
      /ProgressSteps.tsx      # Progress indicator
      /WebcamMirror.tsx       # Webcam video component
    /ui                       # shadcn/ui components

  /lib
    /interview-prompts.ts     # Industry-specific system prompts
    /openai.ts                # OpenAI client configuration
    /supabase.ts              # Supabase client

  /types
    /interview.ts             # TypeScript interfaces
```

## Key Components

### VoiceRecorder
Records user audio using the MediaRecorder API, with visual feedback (waveform, timer). Supports WebM/MP3 formats compatible with Whisper API.

```typescript
<VoiceRecorder
  onRecordingComplete={(audioBlob) => handleAudio(audioBlob)}
  isProcessing={false}
/>
```

### AudioPlayer
Automatically plays AI voice responses with loading states and playback controls. Handles React Strict Mode double-initialization gracefully.

```typescript
<AudioPlayer
  audioUrl={currentAudioUrl}
  autoPlay={true}
  onPlaybackEnd={() => enableRecording()}
  audioRef={audioRef}
/>
```

### FeedbackPanel
Displays real-time feedback during interviews with sticky header and scrollable content. Shows strengths, weaknesses, opportunities, and threats (SWOT analysis).

```typescript
<FeedbackPanel
  feedbackHistory={feedbackHistory}
  isAnalyzing={isAnalyzing}
/>
```

### WebcamMirror
Optional webcam view (mirrored) for user self-monitoring. Includes permission handling, error states, and privacy notice. Video is never recorded or transmitted.

```typescript
<WebcamMirror
  isVisible={showWebcam}
  onClose={() => setShowWebcam(false)}
  mode="embedded"
  size="large"
/>
```

## API Routes

### POST /api/interview/message
Sends user message to GPT-4 and receives AI interviewer response.

**Request:**
```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "questionCount": 5
}
```

**Response:**
```json
{
  "response": "AI interviewer's question or response",
  "shouldEnd": false
}
```

### POST /api/interview/audio
Transcribes audio using OpenAI Whisper API.

**Request:** `multipart/form-data` with audio blob

**Response:**
```json
{
  "text": "Transcribed text from audio"
}
```

### POST /api/interview/tts
Converts text to speech using OpenAI TTS API.

**Request:**
```json
{
  "text": "Text to convert to speech"
}
```

**Response:** Audio blob (MP3)

### POST /api/interview/analyze-answer
Provides real-time SWOT analysis of user's answer.

**Request:**
```json
{
  "question": "What are your strengths?",
  "answer": "User's response...",
  "industry": "technology",
  "conversationHistory": [...]
}
```

**Response:**
```json
{
  "strengths": ["Clear communication", "..."],
  "weaknesses": ["Needs more specificity", "..."],
  "opportunities": ["Could mention specific technologies", "..."],
  "threats": ["Vague statements may raise concerns", "..."],
  "suggestedImprovements": ["Add concrete examples", "..."]
}
```

### POST /api/interview/evaluate
Generates comprehensive post-interview evaluation.

**Request:**
```json
{
  "messages": [...],
  "industry": "technology",
  "role": "Software Engineer",
  "company": "Google"
}
```

**Response:**
```json
{
  "verdict": "pass" | "borderline" | "fail",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "dealBreakers": ["..."],
  "detailedFeedback": "Comprehensive analysis..."
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4, Whisper, TTS | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (client-side) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL (for production) | No |

## Recent Updates

### Theme Conversion (Elicit-Inspired Design)

**Date**: December 2025

Comprehensive theme overhaul replacing the original purple/pink gradient theme with Elicit's clean, academic aesthetic.

#### Files Modified:

1. **Global Theme**
   - `src/app/globals.css` - Color variables, font configuration
   - `src/app/layout.tsx` - Font imports (Inter, Crimson Pro)

2. **Pages**
   - `src/app/page.tsx` - Homepage (hero, stats, features, pricing)
   - `src/app/interview/select/page.tsx` - Industry selection
   - `src/app/interview/configure/page.tsx` - Interview configuration
   - `src/app/interview/session/page.tsx` - Live interview session
   - `src/app/interview/evaluation/page.tsx` - Evaluation results

3. **Components**
   - `src/components/interview/ProgressSteps.tsx` - Progress indicator
   - `src/components/interview/FeedbackPanel.tsx` - Live feedback panel
   - `src/components/interview/AudioPlayer.tsx` - Audio playback
   - `src/components/interview/VoiceRecorder.tsx` - Voice recording
   - `src/components/interview/WebcamMirror.tsx` - Webcam view

#### Key Improvements:

- **Contrast Fixes**: Replaced unreadable lime text with dark teal for proper WCAG compliance
- **Background Updates**: Changed black backgrounds to theme-appropriate dark teal
- **Button Visibility**: Fixed "Skip This Question" and "Redo Answer" buttons with better contrast
- **Sticky Headers**: Implemented proper fixed headers in FeedbackPanel to prevent scroll overlap
- **Logo Visibility**: Updated white Apple logo to dark teal for visibility on light backgrounds
- **Semantic Colors**: Used theme variables throughout for consistent theming

### Bug Fixes

#### Audio Loading Issue
**Problem**: Audio stuck on "Loading audio..." due to React Strict Mode double initialization

**Solution**: Added `isInitializingRef` flag to prevent duplicate URL checks during initialization

**File**: `src/components/interview/AudioPlayer.tsx`

#### Conversation Panel Contrast
**Problem**: User message bubbles had lime background with white text - no contrast

**Solution**: Changed to proper background/text color pairings:
- User messages: Lime background with dark text
- AI messages: Semi-transparent dark teal with light text

**File**: `src/app/interview/session/page.tsx`

#### FeedbackPanel Scroll Overlap
**Problem**: Content scrolled over the "Live Feedback" header

**Solution**: Restructured component with `flex-shrink-0` header and separate scroll container

**File**: `src/components/interview/FeedbackPanel.tsx`

## Development Tips

### Clear Next.js Cache
If you make font or theme changes and don't see updates:
```bash
rm -rf .next
npm run dev
```

### Hard Refresh Browser
After CSS changes, use hard refresh to clear browser cache:
- **Mac**: `Cmd + Shift + R`
- **Windows**: `Ctrl + Shift + R`

### Audio Testing
Test audio playback across different browsers as MediaRecorder API support varies:
- ✅ Chrome/Edge: Full WebM support
- ✅ Safari: MP4/AAC support
- ⚠️ Firefox: WebM support with potential codec differences

### Supabase Database Schema
Refer to the plan file at `/Users/onkar/.claude/plans/bright-sleeping-backus.md` for complete database schema and architecture details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## Support

For issues, questions, or feedback, please contact the development team.

---

**Built with** ❤️ **using Next.js, OpenAI, and Supabase**
