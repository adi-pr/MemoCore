"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSetupComplete, markSetupComplete } from "@/lib/settings";

export type SetupFormState = {
  error: string | null;
};

export async function completeSetup(
  _prevState: SetupFormState,
  formData: FormData
): Promise<SetupFormState> {
  if (isSetupComplete()) {
    redirect("/");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email) {
    return { error: "Name and email are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  let userId: string;

  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });
    userId = result.user.id;
  } catch (err) {
    if (err instanceof APIError) {
      return { error: err.message };
    }
    return { error: "Something went wrong. Please try again." };
  }

  db.prepare("UPDATE user SET role = ? WHERE id = ?").run("admin", userId);
  markSetupComplete();

  redirect("/dashboard");
}
