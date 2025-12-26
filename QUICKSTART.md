# Quick Start Guide

Get your AI Mock Interview Platform running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Modern browser (Chrome, Firefox, Safari, or Edge)

## Setup Steps

### 1. Navigate to Project
```bash
cd /Users/onkar/aiinterview/ai-interview-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and add your OpenAI API key
# OPENAI_API_KEY=sk-your-actual-key-here
```

**To get your API key:**
1. Visit https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. Paste it in `.env.local`

### 4. Start Development Server
```bash
npm run dev
```

### 5. Open Browser
Navigate to: **http://localhost:3000**

## Test the Interview

1. **Click "Start Interview"** on the home page
2. **Select an industry** (e.g., "Technology")
3. **Wait for AI** to ask the first question
4. **Click microphone icon** and speak your answer
5. **Click stop** when done speaking
6. **Wait for AI response** (it will speak back to you)
7. **Continue the conversation** for 5-10 questions
8. **Click "End Interview"** to get your evaluation

## Troubleshooting

### "Missing OPENAI_API_KEY" error
- Check that `.env.local` exists in the project root
- Verify your API key is correct
- Restart the dev server: `Ctrl+C` then `npm run dev`

### Microphone not working
- Allow microphone permissions in your browser
- Use HTTPS or localhost (required for microphone)
- Check browser console for errors

### No audio playback
- Check your speakers/headphones
- Verify browser audio is not muted
- Some browsers block autoplay - click the page first

## Production Build

```bash
npm run build
npm start
```

## Need Help?

See `IMPLEMENTATION_GUIDE.md` for detailed documentation.

---

**You're ready to practice interviews!**
