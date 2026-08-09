import type { IncomingMessage, ServerResponse } from 'node:http';
import { connectDB } from '../../src/db/mongoose';
import { processDailyEggs } from '../../src/jobs/daily-eggs';
import { logger } from '../../src/lib/logger';

// Vercel Cron hits this on the schedule defined in vercel.json (see the
// `crons` array there). Vercel automatically sends
// `Authorization: Bearer $CRON_SECRET` on cron-triggered requests once
// CRON_SECRET is set as a project env var - this rejects anyone else who
// finds the URL and tries to trigger egg credits on demand.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const expected = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (expected && authHeader !== `Bearer ${expected}`) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Unauthorized' }));
    return;
  }

  try {
    await connectDB();
    await processDailyEggs();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (error) {
    logger.error({ error }, 'Cron daily-eggs run failed');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Cron run failed' }));
  }
}
