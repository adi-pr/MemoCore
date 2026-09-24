import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { KnowledgeBasesView } from "@/components/knowledge-bases/knowledge-bases-view";

export default async function KnowledgeBasesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return <KnowledgeBasesView />;
}
