import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/auth/sign-out-button";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>
        Welcome {session.user.name}
      </h1>

      <p>
        Email: {session.user.email}
      </p>

      <SignOutButton />
    </div>
  );
}