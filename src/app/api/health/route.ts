import { NextResponse } from "next/server";

import { getSystemHealth } from "@/server/system/get-health";

export async function GET() {
  return NextResponse.json(getSystemHealth());
}
