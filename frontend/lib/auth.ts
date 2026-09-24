import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { isSetupComplete } from "./settings";

export const auth = betterAuth({
    database: db,
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user",
                // Never settable from the client - only assigned server-side.
                input: false,
            },
        },
    },
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path === "/sign-up/email" && isSetupComplete()) {
                throw new APIError("FORBIDDEN", {
                    message: "Sign-up is disabled. Naught naught....",
                });
            }
        }),
    },
    // Must stay last so it can see the Set-Cookie headers other plugins/hooks produce.
    plugins: [nextCookies()],
})