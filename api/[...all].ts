import app from '../server/app.js';
import { handle } from 'hono/vercel';
export const dynamic = 'force-dynamic'

export const GET = handle(app);
export const POST = handle(app);
