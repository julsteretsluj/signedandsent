import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { lookupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = lookupSchema.parse(body);

    const accessCode = await prisma.accessCode.findUnique({
      where: { code },
    });

    if (!accessCode) {
      return NextResponse.json(
        { error: "Invalid code. Please check and try again." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: accessCode.code,
      documentUrl: `/${accessCode.documentPath}`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid code format." }, { status: 400 });
    }
    console.error("Lookup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
