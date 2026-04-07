import type { Metadata } from "next";
import { Hedvig_Letters_Sans, Hedvig_Letters_Serif } from "next/font/google";
import { notFound } from "next/navigation";

import "../../index.css";
import "../../styles/globals.css";
import { defaultLocale, locales } from "@/locales/config";

import { Providers } from "./providers";

const hedvigSans = Hedvig_Letters_Sans({
	display: "swap",
	subsets: ["latin"],
	variable: "--font-hedvig-sans",
	weight: "400",
});

const hedvigSerif = Hedvig_Letters_Serif({
	display: "swap",
	subsets: ["latin"],
	variable: "--font-hedvig-serif",
	weight: "400",
});

export const metadata: Metadata = {
	title: "faworra-new",
	description: "faworra-new",
};

export const generateStaticParams = () => {
	return locales.map((locale) => ({ locale }));
};

export default async function LocaleLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}>) {
	const { locale } = await params;

	if (!locales.includes(locale as (typeof locales)[number])) {
		notFound();
	}

	return (
		<html lang={locale ?? defaultLocale} suppressHydrationWarning>
			<body
				className={`${hedvigSans.variable} ${hedvigSerif.variable} overscroll-none whitespace-pre-line font-sans antialiased`}
			>
				<Providers locale={locale}>{children}</Providers>
			</body>
		</html>
	);
}
