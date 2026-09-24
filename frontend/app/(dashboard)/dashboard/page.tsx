import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return <ChatInterface />;
}
