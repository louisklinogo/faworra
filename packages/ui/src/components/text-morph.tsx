"use client";

import {
	AnimatePresence,
	motion,
	type Transition,
	type Variants,
} from "framer-motion";
import { cn } from "../utils";

export type TextMorphProps = {
	children: string;
	as?: React.ElementType;
	className?: string;
	style?: React.CSSProperties;
	variants?: Variants;
	transition?: Transition;
};

export function TextMorph({
	children,
	as: Component = "p",
	className,
	style,
	variants,
	transition,
}: TextMorphProps) {
	const defaultVariants: Variants = {
		initial: { opacity: 0, y: -6, filter: "blur(2px)" },
		animate: { opacity: 1, y: 0, filter: "blur(0px)" },
		exit: { opacity: 0, y: 6, filter: "blur(2px)" },
	};

	const defaultTransition: Transition = {
		duration: 0.3,
		ease: "easeOut",
	};

	return (
		<Component
			className={cn("relative overflow-hidden", className)}
			style={style}
		>
			<AnimatePresence initial={false} mode="popLayout">
				<motion.span
					animate="animate"
					className="inline-block whitespace-nowrap"
					exit="exit"
					initial="initial"
					key={children}
					transition={transition || defaultTransition}
					variants={variants || defaultVariants}
				>
					{children}
				</motion.span>
			</AnimatePresence>
		</Component>
	);
}
