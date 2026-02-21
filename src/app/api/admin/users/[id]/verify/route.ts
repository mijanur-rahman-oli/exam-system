import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(params.id) },
      data: { isVerified: true },
    });

    return NextResponse.json({ message: "User verified successfully", user });
  } catch (error) {
    console.error("Verify user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}