import { getSession } from "@/lib/auth-server";
import { isSetupComplete } from "@/lib/settings";
import { redirect } from "next/navigation";

export default async function HomePage() {
  if (!isSetupComplete()) {
    redirect("/setup");
  }

  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  redirect("/sign-in");
}