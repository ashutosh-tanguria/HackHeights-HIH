import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "oosc-web",
    message: "API route is working",
  });
}