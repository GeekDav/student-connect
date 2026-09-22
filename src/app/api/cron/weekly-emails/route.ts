import { NextResponse } from "next/server";
import { runWeeklyPausedReminders } from "@/lib/actions/emails";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const ok =
    secret &&
    (auth === `Bearer ${secret}` ||
      new URL(request.url).searchParams.get("secret") === secret);

  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWeeklyPausedReminders();
  return NextResponse.json(result);
}
