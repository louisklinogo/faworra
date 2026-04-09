"use client";

import { Button } from "@faworra-new/ui/components/button";
import { FileUp, Plus } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { type Attachment, AttachmentItem } from "./attachment-item";

type Props = {
	attachments: Attachment[];
	onChange: (attachments: Attachment[]) => void;
};

export function TransactionAttachments({ attachments, onChange }: Props) {
	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const newAttachments: Attachment[] = acceptedFiles.map((file) => ({
				id: crypto.randomUUID(),
				type: file.type,
				name: file.name,
				size: file.size,
				isUploading: false,
			}));

			onChange([...attachments, ...newAttachments]);
		},
		[attachments, onChange]
	);

	const handleDelete = (id: string) => {
		onChange(attachments.filter((a) => a.id !== id));
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
			"application/pdf": [".pdf"],
			"text/csv": [".csv"],
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
				".xlsx",
			],
		},
	});

	return (
		<div className="space-y-4">
			{attachments.length > 0 && (
				<div className="space-y-2">
					<h3 className="font-medium text-sm">Attachments</h3>
					<div className="space-y-2">
						{attachments.map((file) => (
							<AttachmentItem
								file={file}
								key={file.id}
								onDelete={() => handleDelete(file.id!)}
							/>
						))}
					</div>
				</div>
			)}

			<div
				{...getRootProps()}
				className={`relative flex flex-col items-center justify-center rounded-lg border border-dashed transition-colors ${
					isDragActive
						? "border-primary bg-primary/5"
						: "border-muted-foreground/25 hover:border-muted-foreground/50"
				} h-[80px]`}
			>
				<input {...getInputProps()} />
				<Plus className="pointer-events-none absolute size-4 text-muted-foreground" />
				<div className="flex items-center justify-center">
					{isDragActive ? (
						<div className="mt-6 flex items-center space-x-2 text-muted-foreground text-sm">
							<FileUp className="size-4" />
							<span>Drop files here</span>
						</div>
					) : (
						<Button
							className="mt-6 text-muted-foreground text-sm"
							variant="ghost"
						>
							Add attachment
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
