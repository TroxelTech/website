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
 * Bindings/env (set on the Pages project):
 *  - TURNSTILE_SECRET_KEY (secret)
 *  - MAILER (service binding -> troxel-contact-mailer Worker)
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

    // 2. Send email via the troxel-contact-mailer Worker (MAILER service
    // binding), which delivers through Cloudflare Email Routing.
    if (!env.MAILER) {
      console.error('MAILER service binding is not configured');
      return Response.json(
        { success: false, error: 'Email service not configured.' },
        { status: 500 }
      );
    }

    const mailerResponse = await env.MAILER.fetch('https://mailer.internal/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, company, interest, message }),
    });

    if (!mailerResponse.ok) {
      const errorText = await mailerResponse.text();
      console.error('Mailer error:', mailerResponse.status, errorText);
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
