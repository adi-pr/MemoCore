"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded bg-red-500 px-4 py-2 text-white"
    >
      Sign out
    </button>
  );
}