"use client";

import { Toaster } from "@faworra-new/ui/components/sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { TRPCReactProvider } from "@/trpc/client";

import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			disableTransitionOnChange
			enableSystem
		>
			<TRPCReactProvider>
				{children}
				<ReactQueryDevtools />
			</TRPCReactProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
