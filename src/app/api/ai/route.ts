
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function localSummary(insights: any[] = [], metrics: any = {}): string {
  const lines = insights.slice(0, 6).map(i => '• ' + i.title + ' — ' + i.body);
  if (metrics.revenue != null) {
    lines.unshift(
      `• Period revenue ${Number(metrics.revenue).toLocaleString('en-IN')} across ${metrics.orders ?? 0} orders (AOV ₹${Number(metrics.aov ?? 0).toLocaleString('en-IN')}, margin ${metrics.margin ?? 0}%).`,
    );
  }
  if (metrics.forecastNext7 != null) {
    lines.push(`• Model projects ₹${Number(metrics.forecastNext7).toLocaleString('en-IN')} for the next 7 days.`);
  }
  return lines.join('\n\n') || 'Not enough data to summarise yet.';
}

export async function POST(req: Request) {
  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    /* ignore */
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ source: 'local-engine', summary: localSummary(payload.insights, payload.metrics) });
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'You are a retail analytics assistant for Orison Retail, a 9-store Samsung Experience Store chain in Pune, India. Write a concise executive summary in max 6 bullet points from the provided metrics and insight objects. Use INR (₹) formatting. Be specific and actionable.',
          },
          { role: 'user', content: JSON.stringify({ metrics: payload.metrics, insights: payload.insights }) },
        ],
      }),
    });
    if (!res.ok) throw new Error('OpenAI error ' + res.status);
    const j = await res.json();
    const text = j.choices?.[0]?.message?.content || '';
    return NextResponse.json({ source: 'openai', summary: text });
  } catch {
    return NextResponse.json({ source: 'local-engine', summary: localSummary(payload.insights, payload.metrics) });
  }
}
