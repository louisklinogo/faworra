"use client";

import { AlertCircle, Check, Info, Sparkles } from "lucide-react";
import { Progress } from "./progress";
import { Spinner } from "./spinner";
import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from "./toast";
import { useToast } from "./use-toast";

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider>
			{toasts.map(
				({
					id,
					title,
					description,
					progress = 0,
					action,
					footer,
					...props
				}) => {
					return (
						<Toast key={id} {...props} className="flex flex-col">
							<div className="flex w-full">
								<div className="w-full justify-center space-y-2">
									<div className="flex justify-between space-x-2">
										<div className="flex items-center space-x-2">
											{props?.variant && (
												<div className="flex h-[20px] w-[20px] items-center">
													{props.variant === "ai" && (
														<Sparkles className="h-4 w-4 text-[#0064D9]" />
													)}
													{props?.variant === "success" && (
														<Check className="h-4 w-4" />
													)}
													{props?.variant === "error" && (
														<AlertCircle className="h-4 w-4 text-[#FF3638]" />
													)}
													{props?.variant === "info" && (
														<Info className="h-4 w-4 text-[#878787]" />
													)}
													{props?.variant === "progress" && (
														<Spinner className="h-4 w-4 animate-spin" />
													)}
													{props?.variant === "spinner" && (
														<Spinner className="h-4 w-4 animate-spin" />
													)}
												</div>
											)}
											<div>{title && <ToastTitle>{title}</ToastTitle>}</div>
										</div>

										<div>
											{props?.variant === "progress" && (
												<span className="text-[#878787] text-sm">
													{progress}%
												</span>
											)}
										</div>
									</div>

									{props.variant === "progress" && (
										<Progress
											className="h-[3px] w-full rounded-none bg-border"
											value={progress}
										/>
									)}

									{description && (
										<ToastDescription>{description}</ToastDescription>
									)}
								</div>
								{action}
								<ToastClose />
							</div>

							<div className="flex w-full justify-end">{footer}</div>
						</Toast>
					);
				}
			)}
			<ToastViewport />
		</ToastProvider>
	);
}
