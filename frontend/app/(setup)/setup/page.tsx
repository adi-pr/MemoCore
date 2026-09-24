import { redirect } from "next/navigation";

import { isSetupComplete } from "@/lib/settings";
import { SetupForm } from "./setup-form";

export default function SetupPage() {
  if (isSetupComplete()) {
    redirect("/");
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <SetupForm />
    </div>
  );
}
