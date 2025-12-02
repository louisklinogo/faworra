import type { BatchRunHandle } from "@trigger.dev/sdk/v3";

const BATCH_SIZE = 100;

interface BatchItem<T> {
  payload: T;
}

interface BatchTriggerTask<T, O = void> {
  batchTrigger: (items: BatchItem<T>[]) => Promise<BatchRunHandle<string, T, O>>;
}

export async function triggerBatch<T, O = void>(data: T[], task: BatchTriggerTask<T, O>) {
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const chunk = data.slice(i, i + BATCH_SIZE);
    await task.batchTrigger(
      chunk.map((item) => ({
        payload: item,
      })),
    );
  }
}
