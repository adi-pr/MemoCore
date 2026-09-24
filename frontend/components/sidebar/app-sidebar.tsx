import { getSession } from "@/lib/auth-server";
import { SidebarClient } from "@/components/sidebar/sidebar-client";

function getInitials(name: string | null) {
  if (!name) return "GU";

  const parts = name.trim().split(/\s+/);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "GU";
}

export async function AppSidebar() {
  const session = await getSession();
  const name = session?.user.name ?? "Guest User";

  return (
    <SidebarClient
      user={{
        name,
        email: session?.user.email ?? null,
        image: session?.user.image ?? null,
        initials: getInitials(session?.user.name ?? null),
      }}
    />
  );
}
