import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  const { fieldColumns, firstRows } = (await req.json()) as {
    fieldColumns: string[];
    firstRows: Record<string, string>[];
  };

  const { partialObjectStream } = await streamObject({
    model: google("gemini-flash-latest"),
    schema: z.object({
      date: z
        .string()
        .optional()
        .describe("Name of the CSV column that contains the transaction date"),
      description: z
        .string()
        .optional()
        .describe("Name of the CSV column that contains the transaction description"),
      amount: z
        .string()
        .optional()
        .describe("Name of the CSV column that contains the transaction amount (signed if possible)"),
      balance: z
        .string()
        .optional()
        .describe("Name of the CSV column that contains the running account balance (if present)"),
    }),
    prompt: `
      The following columns are the headings from a CSV import file for importing transactions.
      Map these column names to the correct fields (date, description, amount, balance) by returning the exact COLUMN NAME for each field.
      Use ONLY a value from the provided Columns list. If there is no clear match, omit the field.
      You may consult the first few rows to infer which column corresponds to which field, but return column NAMES, not values.

      Columns:
      ${fieldColumns.join(",")}

      First few rows of data:
      ${firstRows.map((row) => JSON.stringify(row)).join("\n")}
    `,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const partial of partialObjectStream) {
          controller.enqueue(encoder.encode(JSON.stringify(partial) + "\n"));
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ error: (error as Error)?.message ?? "stream error" }) + "\n",
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
