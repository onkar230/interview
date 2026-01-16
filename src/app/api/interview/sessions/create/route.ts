import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  createInterviewSession,
  canUserStartInterview,
  incrementInterviewCounter,
} from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // CHECK INTERVIEW LIMIT BEFORE CREATING SESSION
    const accessCheck = await canUserStartInterview(user.id);

    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          error: accessCheck.reason,
          limitReached: true,
          tier: accessCheck.tier,
          limit: accessCheck.limit,
          used: accessCheck.used,
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const session = await createInterviewSession(user.id, {
      industry: body.industry,
      role: body.role,
      company: body.company,
      difficulty: body.difficulty,
      jobDescription: body.jobDescription,
      questionTypes: body.questionTypes,
      customQuestions: body.customQuestions,
      followUpIntensity: body.followUpIntensity,
      maxQuestions: body.maxQuestions,
      cvText: body.cvText,
      questionPriority: body.questionPriority,
      companyResearch: body.companyResearch,
      // Personalized coaching settings
      usePersonalization: body.usePersonalization,
      personalizationRelevance: body.personalizationRelevance,
    });

    // INCREMENT COUNTER FOR FREE USERS AFTER SUCCESSFUL SESSION CREATION
    if (accessCheck.tier === 'free') {
      await incrementInterviewCounter(user.id);
    }

    return NextResponse.json({
      sessionId: session.id,
      tier: accessCheck.tier,
      interviewsUsed: (accessCheck.used || 0) + 1,
      interviewsLimit: accessCheck.limit,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
