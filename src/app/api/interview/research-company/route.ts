import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface ResearchCompanyRequest {
  company: string;
  industry?: string;
  role?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { company, industry, role }: ResearchCompanyRequest = await request.json();

    if (!company || company.trim().length === 0) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    console.log(`[research-company] Researching company: ${company} (${industry}, ${role})`);

    // Check if Tavily API key is configured
    if (!process.env.TAVILY_API_KEY) {
      console.warn('[research-company] TAVILY_API_KEY not configured, returning empty research');
      return NextResponse.json({
        research: '',
        message: 'Web search not configured'
      });
    }

    // Construct a focused search query
    const searchQuery = `${company} company ${industry || ''} values culture mission interview process career`.trim();

    // Use web search to find information about the company
    const searchResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: searchQuery,
        max_results: 5,
        search_depth: 'basic',
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!searchResponse.ok) {
      console.error('[research-company] Tavily search failed:', searchResponse.status);
      // Return empty research rather than failing - interview can still work
      return NextResponse.json({
        research: '',
        message: 'Web search failed'
      });
    }

    const searchData = await searchResponse.json();
    console.log(`[research-company] Found ${searchData.results?.length || 0} search results`);

    // Extract and format the research
    let research = '';

    // Use the answer if available
    if (searchData.answer) {
      research += `Summary: ${searchData.answer}\n\n`;
    }

    // Add top search results
    if (searchData.results && searchData.results.length > 0) {
      research += 'Key Information:\n';
      searchData.results.slice(0, 3).forEach((result: any, idx: number) => {
        research += `${idx + 1}. ${result.title}\n`;
        if (result.content) {
          research += `   ${result.content.substring(0, 300)}...\n\n`;
        }
      });
    }

    if (!research || research.trim().length === 0) {
      console.warn('[research-company] No research found for company');
      return NextResponse.json({ research: '' });
    }

    console.log(`[research-company] Research compiled: ${research.length} characters`);

    return NextResponse.json({
      research: research.trim(),
      sources: searchData.results?.slice(0, 3).map((r: any) => r.url) || []
    });

  } catch (error) {
    console.error('[research-company] Error:', error);
    return NextResponse.json(
      { error: 'Failed to research company' },
      { status: 500 }
    );
  }
}
