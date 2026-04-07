"use client";

import LoginTestimonials from "./login-testimonials";

export function LoginVideoBackground() {
	return (
		<div className="relative m-2 hidden overflow-hidden lg:flex lg:w-1/2">
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_35%),linear-gradient(135deg,_#0f172a_0%,_#111827_35%,_#052e16_100%)]"
			/>
			<div className="absolute inset-0 bg-black/20" />
			<div className="relative z-10 flex h-full w-full items-center justify-center p-4">
				<LoginTestimonials />
			</div>
		</div>
	);
}
