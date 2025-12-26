# AI Mock Interview Platform - Implementation Guide

## What Was Implemented

This is a fully functional MVP of an AI-powered mock interview platform. The system allows users to practice job interviews with an AI interviewer that uses voice interaction.

### Core Features

1. **OpenAI Integration** (`/src/lib/openai.ts`)
   - Whisper API for speech-to-text transcription
   - GPT-4 for intelligent interview conversations
   - TTS API for natural voice responses
   - Interview evaluation with detailed feedback

2. **Voice Interaction Components**
   - `VoiceRecorder.tsx` - Records user audio with visual feedback
   - `AudioPlayer.tsx` - Plays AI voice responses automatically

3. **User Flow Pages**
   - **Home Page** (`/`) - Landing page with features and CTAs
   - **Industry Selection** (`/interview/select`) - Choose from 8 industries
   - **Interview Session** (`/interview/session`) - Main interview interface
   - **Evaluation Results** (`/interview/evaluation`) - Detailed feedback

4. **API Routes**
   - `/api/interview/audio` - Transcribes voice recordings
   - `/api/interview/message` - Generates AI responses
   - `/api/interview/tts` - Converts text to speech
   - `/api/interview/evaluate` - Evaluates interview performance

5. **Industry Support**
   - Technology
   - Finance
   - Healthcare
   - Marketing
   - Sales
   - Consulting
   - Education
   - Engineering

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- OpenAI API key (get one at https://platform.openai.com/api-keys)
- Modern browser with microphone support

### Installation

1. **Navigate to project directory:**
   ```bash
   cd /Users/onkar/aiinterview/ai-interview-platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## Testing the Application

### Test Checklist

- [ ] **Home Page**
  - Visit `http://localhost:3000`
  - Verify landing page displays correctly
  - Click "Start Interview" button

- [ ] **Industry Selection**
  - Should redirect to `/interview/select`
  - See all 8 industry cards displayed
  - Click any industry (e.g., "Technology")

- [ ] **Interview Session**
  - Should redirect to `/interview/session?industry=technology`
  - AI should automatically ask first question
  - Hear AI voice speaking the question
  - See microphone button when AI finishes speaking

- [ ] **Voice Recording**
  - Click microphone button
  - Allow microphone permissions if prompted
  - Speak your answer (e.g., "I have 5 years of experience in software development...")
  - See recording indicator and timer
  - Click stop button

- [ ] **AI Response**
  - Should see "Processing your response..." indicator
  - Your transcribed answer appears in chat
  - AI generates follow-up question
  - AI voice speaks the new question
  - Conversation continues naturally

- [ ] **Interview Flow**
  - Answer 5-10 questions
  - Watch question counter increase
  - Click "End Interview" button (enabled after 3+ questions)

- [ ] **Evaluation**
  - Should redirect to `/interview/evaluation`
  - See verdict (Pass/Borderline/Fail) with color coding
  - View strengths list
  - View weaknesses/improvement areas
  - View deal-breakers (if any)
  - Read detailed feedback paragraph

- [ ] **Start New Interview**
  - Click "Start New Interview" button
  - Should return to industry selection

## How It Works

### Interview Flow

1. **Initialization**
   - User selects industry
   - System generates industry-specific system prompt
   - AI asks opening question automatically
   - TTS converts question to speech

2. **Conversation Loop**
   - User clicks mic and records answer
   - Audio sent to Whisper API for transcription
   - Transcribed text added to conversation history
   - GPT-4 generates contextual follow-up question
   - TTS converts AI response to speech
   - Process repeats

3. **Evaluation**
   - After 10-12 questions or manual end
   - Full transcript sent to GPT-4 for evaluation
   - AI analyzes technical skills, communication, problem-solving, experience
   - Returns structured feedback with verdict
   - Results displayed on evaluation page

### Technical Details

**State Management:**
- Uses React `useState` for conversation history
- Uses `sessionStorage` to pass evaluation between pages
- No database required for MVP

**Audio Processing:**
- MediaRecorder API captures browser audio
- Blob converted to File for OpenAI API
- Audio visualizer shows recording level
- Automatic playback of AI responses

**Error Handling:**
- API key validation on every request
- Microphone permission errors
- File size limits (25MB for audio)
- Network error recovery
- User-friendly error messages

## API Usage & Costs

### OpenAI API Calls Per Interview

- **Whisper (STT):** ~10-12 calls per interview (~$0.01 each)
- **GPT-4 (Chat):** ~10-12 calls per interview (~$0.03-0.10 each)
- **TTS:** ~10-12 calls per interview (~$0.015 each)
- **GPT-4 (Evaluation):** 1 call per interview (~$0.05)

**Estimated cost per interview:** $0.50-1.50 depending on conversation length

## Known Limitations (MVP)

1. **No Authentication:** Anyone can access without login
2. **No Persistence:** Conversations not saved to database
3. **No History:** Can't review past interviews
4. **Desktop Focus:** Mobile experience not optimized
5. **Single Role:** Uses generic "mid-level" role (could be parameterized)
6. **Browser Audio Only:** Requires modern browser with MediaRecorder API
7. **No Resume Upload:** Doesn't analyze resume/CV

## Troubleshooting

### "Missing OPENAI_API_KEY" Error
- Ensure `.env.local` exists in project root
- Verify API key starts with `sk-`
- Restart development server after adding key

### Microphone Not Working
- Check browser permissions (chrome://settings/content/microphone)
- Use HTTPS or localhost (required for microphone access)
- Try different browser if issues persist

### Audio Not Playing
- Check browser audio permissions
- Verify speakers/headphones connected
- Check browser console for errors

### API Rate Limits
- OpenAI has rate limits on free tier
- Consider upgrading to paid tier for production
- Add rate limiting on API routes if needed

## Next Steps for Production

1. **Add Authentication:** Implement user accounts with Supabase
2. **Add Database:** Store interviews, evaluations, user profiles
3. **Add Resume Analysis:** Upload CV for tailored questions
4. **Add Analytics:** Track progress over time
5. **Add Payment:** Integrate Stripe for premium features
6. **Optimize Mobile:** Improve responsive design
7. **Add More Industries:** Expand to more specialized roles
8. **Add Difficulty Levels:** Parameterize entry/mid/senior/executive
9. **Add Video:** Optional video recording for body language
10. **Add Sharing:** Share results with recruiters/mentors

## File Structure

```
/Users/onkar/aiinterview/ai-interview-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Home page
│   │   ├── interview/
│   │   │   ├── select/page.tsx               # Industry selection
│   │   │   ├── session/page.tsx              # Interview session
│   │   │   └── evaluation/page.tsx           # Results page
│   │   └── api/
│   │       └── interview/
│   │           ├── audio/route.ts            # STT endpoint
│   │           ├── message/route.ts          # Chat endpoint
│   │           ├── tts/route.ts              # TTS endpoint
│   │           └── evaluate/route.ts         # Evaluation endpoint
│   ├── components/
│   │   ├── interview/
│   │   │   ├── VoiceRecorder.tsx             # Voice recording
│   │   │   └── AudioPlayer.tsx               # Audio playback
│   │   └── ui/                               # shadcn components
│   ├── lib/
│   │   ├── openai.ts                         # OpenAI client
│   │   └── interview-prompts.ts              # Industry configs
│   └── types/
│       └── interview.ts                      # TypeScript types
├── .env.local.example                        # Environment template
└── package.json                              # Dependencies
```

## Technologies Used

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **AI:** OpenAI GPT-4, Whisper, TTS
- **Icons:** Lucide React
- **Audio:** MediaRecorder API, Web Audio API

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API key is valid
3. Check OpenAI API status page
4. Review this guide's troubleshooting section

---

**Built as MVP for concept validation. Ready for user testing!**
