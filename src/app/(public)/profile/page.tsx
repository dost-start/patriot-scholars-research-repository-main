import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptField } from "@/lib/crypto";
import ProfileClientView from "./ProfileClientView";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile",
};

import { Session } from "@prisma/client";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }
  
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { 
      scholarProfile: true,
      papers: { select: { id: true } }
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Also fetch recent sessions via better-auth or DB.
  // Better-auth manages sessions in DB 'Session' table.
  const sessions = await db.session.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  let decryptedSpasId = "";
  let decryptedFullName = "";

  if (user.scholarProfile) {
    try {
      decryptedSpasId = decryptField(user.scholarProfile.spasId);
      decryptedFullName = decryptField(user.scholarProfile.fullName);
    } catch (e) {
      // Fallback for non-encrypted data (during transition)
      decryptedSpasId = user.scholarProfile.spasId;
      decryptedFullName = user.scholarProfile.fullName;
    }
  }

  const profileData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    submissionsCount: user.papers.length,
    scholarProfile: user.scholarProfile ? {
      spasId: decryptedSpasId,
      fullName: decryptedFullName,
      university: user.scholarProfile.university,
      region: user.scholarProfile.region,
    } : undefined,
    sessions: sessions.map((s: Session) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      isCurrent: s.token === session.session.token,
      createdAt: s.createdAt
    }))
  };

  return (
    <div className="bg-[#F7F9FC] min-h-screen">
      <ProfileClientView user={profileData} />
    </div>
  );
}
