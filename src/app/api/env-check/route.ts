import { NextResponse } from "next/server";
import { getEnvironmentInfo } from "@/lib/env";

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  return NextResponse.json(getEnvironmentInfo());
}
