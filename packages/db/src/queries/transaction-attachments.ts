import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { transactionAttachments } from "../schema/financial";

export interface CreateTransactionAttachmentInput {
	filename: string;
	mimeType: string;
	path: string;
	size: number;
	teamId: string;
	transactionId: string;
}

export interface DeleteTransactionAttachmentInput {
	id: string;
	teamId: string;
}

export const createTransactionAttachment = async (
	db: Database,
	input: CreateTransactionAttachmentInput,
) => {
	const [attachment] = await db
		.insert(transactionAttachments)
		.values({
			filename: input.filename,
			mimeType: input.mimeType,
			path: input.path,
			size: input.size,
			teamId: input.teamId,
			transactionId: input.transactionId,
		})
		.returning();

	return attachment;
};

export const deleteTransactionAttachment = async (
	db: Database,
	input: DeleteTransactionAttachmentInput,
) => {
	const [attachment] = await db
		.delete(transactionAttachments)
		.where(
			eq(transactionAttachments.id, input.id) &&
				eq(transactionAttachments.teamId, input.teamId),
		)
		.returning();

	return attachment;
};

export const getTransactionAttachments = (
	db: Database,
	{
		teamId,
		transactionId,
	}: {
		teamId: string;
		transactionId: string;
	},
) => {
	return db.query.transactionAttachments.findMany({
		where: (table, { and, eq }) =>
			and(eq(table.teamId, teamId), eq(table.transactionId, transactionId)),
		orderBy: (table, { desc }) => [desc(table.createdAt)],
	});
};
