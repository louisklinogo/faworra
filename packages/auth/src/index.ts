import { expo } from "@better-auth/expo";
import { db } from "@faworra-new/db";
import {
	account,
	accountRelations,
	session,
	sessionRelations,
	user,
	userRelations,
	verification,
} from "@faworra-new/db/schema/auth";
import { env } from "@faworra-new/env/server";
import { checkout, polar, portal } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { polarClient } from "./lib/payments";

const localCookieDomain = "faworra.localhost";
const localHostnameSuffix = `.${localCookieDomain}`;
const betterAuthHostname = new URL(env.BETTER_AUTH_URL).hostname;
const shouldShareLocalCookieDomain =
	env.NODE_ENV === "development" &&
	betterAuthHostname.endsWith(localHostnameSuffix);

const authSchema = {
	account,
	accountRelations,
	session,
	sessionRelations,
	user,
	userRelations,
	verification,
};

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",

		schema: authSchema,
	}),
	trustedOrigins: [
		env.CORS_ORIGIN,
		"faworra-new://",
		...(env.NODE_ENV === "development"
			? [
					"exp://",
					"exp://**",
					"exp://192.168.*.*:*/**",
					"http://localhost:8081",
				]
			: []),
	],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			...(shouldShareLocalCookieDomain ? { domain: localCookieDomain } : {}),
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
	},
	plugins: [
		polar({
			client: polarClient,
			createCustomerOnSignUp: true,
			enableCustomerPortal: true,
			use: [
				checkout({
					products: [
						{
							productId: "your-product-id",
							slug: "pro",
						},
					],
					successUrl: env.POLAR_SUCCESS_URL,
					authenticatedUsersOnly: true,
				}),
				portal(),
			],
		}),
		expo(),
	],
});
