"use client";

import { Button } from "@faworra-new/ui/components/button";
import { Skeleton } from "@faworra-new/ui/components/skeleton";
import { File, X } from "lucide-react";
import { formatSize } from "@/utils/format";

export type Attachment = {
	id?: string;
	type: string;
	name: string;
	size: number;
	isUploading?: boolean;
	path?: string[];
	url?: string;
};

type Props = {
	file: Attachment;
	onDelete: () => void;
};

export function AttachmentItem({ file, onDelete }: Props) {
	const handleDeleteClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onDelete();
	};

	return (
		<div className="flex items-center justify-between">
			<button
				className="flex flex-1 items-center space-x-4 text-left transition-opacity hover:opacity-80"
				disabled={file.isUploading || !file?.url}
				type="button"
			>
				<div className="relative flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
					{file.isUploading ? (
						<Skeleton className="h-full w-full" />
					) : (
						<File className="h-5 w-5 text-muted-foreground" />
					)}
				</div>

				<div className="flex w-80 min-w-0 flex-col space-y-0.5">
					<span className="truncate text-sm">{file.name}</span>
					<span className="text-muted-foreground text-xs">
						{file.size && formatSize(file.size)}
					</span>
				</div>
			</button>

			<Button
				className="flex w-auto flex-shrink-0 hover:bg-transparent"
				onClick={handleDeleteClick}
				size="icon"
				variant="ghost"
			>
				<X size={14} />
			</Button>
		</div>
	);
}
