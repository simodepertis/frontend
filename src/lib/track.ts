export async function track(type: 'VIEW' | 'CONTACT_CLICK' | 'SAVE' | 'BOOKING_CONFIRMED', meta?: any) {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, meta }),
    });
  } catch {}
}
