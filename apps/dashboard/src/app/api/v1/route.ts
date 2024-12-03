import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async () => {
  return NextResponse.json({ message: "Hello, world!" });
};
