export default function IVRPage() {
  return (
    <div className="card">
      <h2>IVR Demo</h2>
      <p>
        Inbound calls hit <code>/api/twilio/webhook/voice</code>, which returns TwiML with a <code>Gather</code>.
        The selection is posted to <code>/api/twilio/ivr-action</code>.
      </p>
      <ul>
        <li>Press 1: transfer to agent (dials your Twilio number).</li>
        <li>Press 2: leave a voicemail (record).</li>
      </ul>
      <p className="muted">Configure your Voice webhook in Twilio Console to the ngrok URL for these endpoints.</p>
    </div>
  );
}


