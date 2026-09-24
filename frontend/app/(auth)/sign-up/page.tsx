import { redirect } from "next/navigation";

import { isSetupComplete } from "@/lib/settings";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  // Once the first admin exists, this is a closed, self-hosted instance -
  // open registration is no longer allowed.
  if (isSetupComplete()) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <SignUpForm />
    </div>
  );
}
