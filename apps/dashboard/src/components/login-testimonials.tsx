"use client";

import { useEffect, useState } from "react";

const testimonials = [
	{
		content:
			"Clearer financial visibility helps small teams move faster and make better decisions every day.",
		name: "Akosua Mensah",
		title: "Retail operations • Ghana",
	},
	{
		content:
			"A single operating system for the business reduces guesswork across transactions, teams, and reporting.",
		name: "Tunde Adebayo",
		title: "Distribution • Nigeria",
	},
	{
		content:
			"Having one place for the company workflow makes it much easier to stay on top of the numbers.",
		name: "Wanjiru Njeri",
		title: "Services • Kenya",
	},
] as const;

export default function LoginTestimonials() {
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		const interval = window.setInterval(() => {
			setCurrentIndex((previous) => (previous + 1) % testimonials.length);
		}, 6000);

		return () => window.clearInterval(interval);
	}, []);

	const testimonial = testimonials[currentIndex];

	return (
		<div className="mx-auto flex h-64 max-w-md items-center justify-center text-center">
			<div className="space-y-4 transition-opacity duration-300">
				<p className="font-sans text-white/80 text-xl leading-relaxed">
					“{testimonial?.content}”
				</p>
				<p className="font-sans text-white/50 text-xs">
					{testimonial?.name}, {testimonial?.title}
				</p>
			</div>
		</div>
	);
}
