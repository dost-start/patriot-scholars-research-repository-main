import { Metadata } from "next";
import SubmitPaperForm from "./SubmitPaperForm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Submit Research",
};

export default async function SubmitPaperPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user.isActive) {
    redirect("/login");
  }

  return <SubmitPaperForm />;
}
