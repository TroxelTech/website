/**
 * troxel-contact-mailer
 *
 * Private Worker (no route, no workers.dev) invoked from the site's Pages
 * Function via a MAILER service binding. Sends contact-form submissions
 * through Cloudflare Email Routing to the hello@troxel.tech destinations.
 *
 * POST body (JSON): { name, email, company?, interest?, message }
 */

import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage, Mailbox } from 'mimetext';

const FROM_ADDR = 'contact-form@troxel.tech';
const FROM_NAME = 'TroxelTech Contact Form';
const RECIPIENTS = ['7roxel@gmail.com', 'angie@7roxel.net'];

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return Response.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const name = (data.name || '').toString().trim();
    const email = (data.email || '').toString().trim();
    const company = (data.company || '').toString().trim();
    const interest = (data.interest || '').toString().trim();
    const message = (data.message || '').toString().trim();

    if (!name || !email || !message) {
      return Response.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const subject = `New inquiry from troxel.tech — ${name}`;

    const textBody = [
      'New contact form submission on troxel.tech',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : null,
      interest ? `Interest: ${interest}` : null,
      '',
      'Message:',
      message,
      '',
      `Reply to: ${email}`,
    ].filter(Boolean).join('\n');

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

    const failures = [];
    for (const rcpt of RECIPIENTS) {
      const msg = createMimeMessage();
      msg.setSender({ name: FROM_NAME, addr: FROM_ADDR });
      msg.setRecipient(rcpt);
      msg.setSubject(subject);
      msg.setHeader('Reply-To', new Mailbox(email));
      msg.addMessage({ contentType: 'text/plain', data: textBody });
      msg.addMessage({ contentType: 'text/html', data: htmlBody });

      try {
        await env.EMAIL.send(new EmailMessage(FROM_ADDR, rcpt, msg.asRaw()));
      } catch (err) {
        console.error(`send to ${rcpt} failed:`, err.message);
        failures.push(rcpt);
      }
    }

    if (failures.length === RECIPIENTS.length) {
      return Response.json({ success: false, error: 'Email delivery failed.' }, { status: 502 });
    }
    return Response.json({ success: true, delivered: RECIPIENTS.length - failures.length });
  },
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
