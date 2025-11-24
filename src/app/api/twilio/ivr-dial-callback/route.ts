import { NextRequest, NextResponse } from 'next/server';
import { requireEnv } from '@/lib/twilio';
import { validateTwilioSignature } from '@/lib/webhook';
import { logs } from '@/lib/memory';

export async function POST(req: NextRequest) {
  const authToken = requireEnv('TWILIO_AUTH_TOKEN');
  const url = `${process.env.NEXT_PUBLIC_APP_ORIGIN}/api/twilio/ivr-dial-callback`;

  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);
  const signature = req.headers.get('x-twilio-signature') ?? undefined;

  const valid = validateTwilioSignature({ authToken, url, params, signature });
  if (!valid) {
    logs.push({ ts: Date.now(), type: 'error', event: 'ivr-dial-callback-invalid', data: params });
    return new NextResponse('Invalid signature', { status: 401 });
  }

  const dialStatus = params.DialCallStatus || '';
  logs.push({ ts: Date.now(), type: 'webhook', event: 'ivr-dial-callback', data: { dialStatus, ...params } });

  // If call completed successfully, just hang up
  if (dialStatus === 'completed') {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>',
      { status: 200, headers: { 'Content-Type': 'application/xml' } }
    );
  }

  // If call failed (busy, no-answer, failed, canceled), return to menu with message
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">All representatives are busy right now. Please try again later.</Say>
  <Pause length="1"/>
  <Redirect method="POST">/api/twilio/webhook/voice</Redirect>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  });
}

