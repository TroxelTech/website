/**
 * Contact form handler for TroxelTech
 * POST /api/contact
 *
 * Expects form fields:
 *  - name (required)
 *  - email (required)
 *  - company (optional)
 *  - interest (optional)
 *  - message (required)
 *  - cf-turnstile-response (from Cloudflare Turnstile widget)
 *
 * Environment variables (set in Cloudflare Pages dashboard):
 *  - RESEND_API_KEY
 *  - TURNSTILE_SECRET_KEY
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();

    const name = (formData.get('name') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    const company = (formData.get('company') || '').toString().trim();
    const interest = (formData.get('interest') || '').toString().trim();
    const message = (formData.get('message') || '').toString().trim();
    const turnstileToken = (formData.get('cf-turnstile-response') || '').toString();

    // Basic validation
    if (!name || !email || !message) {
      return Response.json(
        { success: false, error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    // Simple email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!turnstileToken) {
      return Response.json(
        { success: false, error: 'Security check token missing.' },
        { status: 400 }
      );
    }

    // 1. Verify Turnstile token
    const turnstileVerify = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY || '',
          response: turnstileToken,
          // remoteip is optional but helps
          remoteip: request.headers.get('cf-connecting-ip') || '',
        }).toString(),
      }
    );

    const turnstileResult = await turnstileVerify.json();

    if (!turnstileResult.success) {
      console.log('Turnstile failed:', turnstileResult);
      return Response.json(
        { success: false, error: 'Security check failed. Please try again.' },
        { status: 400 }
      );
    }

    // 2. Send email via Resend
    if (!env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return Response.json(
        { success: false, error: 'Email service not configured.' },
        { status: 500 }
      );
    }

    const fromAddress = 'TroxelTech <hello@troxel.tech>'; // Update after verifying domain in Resend
    const toAddress = 'hello@troxel.tech';

    const subject = `New inquiry from troxel.tech — ${name}`;

    // Build a clean, readable email
    const htmlBody = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px;">
        <h2 style="margin: 0 0 20px; color: #0f172a;">New contact form submission</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 0; width: 140px; color: #64748b; font-size: 14px;">From</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email</td>
            <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}" style="color: #0f172a;">${escapeHtml(email)}</a></td>
          </tr>
          ${company ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Company</td>
            <td style="padding: 8px 0; color: #0f172a;">${escapeHtml(company)}</td>
          </tr>` : ''}
          ${interest ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Interest area</td>
            <td style="padding: 8px 0; color: #0f172a;">${escapeHtml(interest)}</td>
          </tr>` : ''}
        </table>

        <div style="margin-bottom: 12px; color: #64748b; font-size: 14px;">Message</div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; white-space: pre-wrap; color: #0f172a; line-height: 1.5;">
${escapeHtml(message)}
        </div>

        <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
          Reply directly to this email to respond to ${escapeHtml(email)}.
        </p>
      </div>
    `;

    const textBody = [
      `New contact form submission on troxel.tech`,
      ``,
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : null,
      interest ? `Interest: ${interest}` : null,
      ``,
      `Message:`,
      message,
      ``,
      `Reply to: ${email}`
    ].filter(Boolean).join('\n');

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toAddress],
        reply_to: email,
        subject: subject,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend API error:', resendResponse.status, errorText);
      return Response.json(
        { success: false, error: 'Failed to send your message. Please try again or email us directly.' },
        { status: 502 }
      );
    }

    // Success
    return Response.json({ success: true });

  } catch (err) {
    console.error('Contact form error:', err);
    return Response.json(
      { success: false, error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

// Minimal HTML escaper for safety in the email body
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
