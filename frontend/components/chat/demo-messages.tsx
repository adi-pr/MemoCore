import type { ChatMessageData } from "@/components/chat/types"

export const DEMO_MESSAGES: ChatMessageData[] = [
  {
    id: "1",
    role: "assistant",
    name: "MemoCore",
    timestamp: "9:41 AM",
    content: (
      <p>
        Hi! I&apos;m MemoCore. I can answer questions using your indexed Wiki.js
        knowledge base.
      </p>
    ),
  },
  {
    id: "2",
    role: "user",
    name: "You",
    timestamp: "9:41 AM",
    content: <p>Explain how authentication works.</p>,
  },
  {
    id: "3",
    role: "assistant",
    name: "MemoCore",
    timestamp: "9:42 AM",
    content: (
      <>
        <p>
          Authentication in your Wiki.js knowledge base is handled through a
          session-based flow that verifies user credentials before granting
          access to protected pages.
        </p>
        <p>Here&apos;s a high-level breakdown of how the system works:</p>
        <ul>
          <li>
            The client submits credentials to the <code>/login</code> endpoint.
          </li>
          <li>The server validates the credentials against the stored user record.</li>
          <li>A signed session token is issued and stored as an HTTP-only cookie.</li>
        </ul>
        <p>The request lifecycle for an authenticated page load looks like this:</p>
        <ol>
          <li>The browser sends the session cookie with each request.</li>
          <li>Middleware verifies the token signature and expiration.</li>
          <li>If valid, the user object is attached to the request context.</li>
          <li>
            If invalid, the request is redirected to <code>/sign-in</code>.
          </li>
        </ol>
        <p>You can inspect the current session server-side using a helper like this:</p>
        <pre>
          <code>{`import { getSession } from "@/lib/auth-server";

const session = await getSession();
if (!session) {
  redirect("/sign-in");
}`}</code>
        </pre>
        <p>
          This pattern keeps authentication logic centralized and easy to reuse
          across server components.
        </p>
      </>
    ),
  },
]
