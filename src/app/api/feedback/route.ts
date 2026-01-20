import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { title, body, email } = await request.json();

    // Validate input
    if (!title || !body || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Mojo Interview Feedback <feedback@mojointerview.com>',
      to: ['on13kar@gmail.com'],
      replyTo: email,
      subject: `Feedback: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
            New Feedback from Mojo Interview
          </h2>

          <div style="margin: 20px 0;">
            <h3 style="color: #4F46E5; margin-bottom: 5px;">Title:</h3>
            <p style="color: #333; font-size: 16px; margin: 0;">${title}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #4F46E5; margin-bottom: 5px;">From:</h3>
            <p style="color: #333; font-size: 16px; margin: 0;">
              <a href="mailto:${email}" style="color: #4F46E5; text-decoration: none;">${email}</a>
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #4F46E5; margin-bottom: 5px;">Message:</h3>
            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; color: #333; line-height: 1.6;">
              ${body.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">
            <p>This feedback was submitted via the Mojo Interview feedback form.</p>
            <p>Reply to this email to respond directly to the user.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send feedback email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Feedback sent successfully', id: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
