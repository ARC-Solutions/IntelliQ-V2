import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export const GET = async () => {
  return NextResponse.json({ message: "Hello, world!" });
};
