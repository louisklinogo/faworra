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
import { getPolarCheckoutProducts } from "./lib/polar-products";

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

// Billing/Polar is explicitly deferred for this mission.
// The Polar plugin is only registered when all required billing env vars are
// present so the API can boot and serve auth without billing configuration.
const billingPlugins =
	polarClient && env.POLAR_PRO_PRODUCT_ID && env.POLAR_SUCCESS_URL
		? [
				polar({
					client: polarClient,
					createCustomerOnSignUp: true,
					enableCustomerPortal: true,
					use: [
						checkout({
							products: getPolarCheckoutProducts(env.POLAR_PRO_PRODUCT_ID),
							successUrl: env.POLAR_SUCCESS_URL,
							authenticatedUsersOnly: true,
						}),
						portal(),
					],
				}),
			]
		: [];

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
	plugins: [...billingPlugins, expo()],
});
