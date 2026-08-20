"use server"

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function searchScholars(query: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (!query || query.length < 2) {
    return [];
  }

  // Search for users with role SCHOLAR whose name or email matches the query
  console.log(`Searching scholars with query: "${query}"`);
  const scholars = await db.user.findMany({
    where: {
      role: "SCHOLAR",
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { email: { contains: query, mode: "insensitive" as const } },
      ],
      // Exclude the current user from search results
      NOT: { id: session.user.id }
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    take: 5,
  });

  console.log(`Found ${scholars.length} scholars`);
  return scholars;
}
