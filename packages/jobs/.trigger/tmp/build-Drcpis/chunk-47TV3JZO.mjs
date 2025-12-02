import {
  __name,
  init_esm
} from "./chunk-FHYA7B3S.mjs";

// src/utils/trigger-batch.ts
init_esm();
var BATCH_SIZE = 100;
async function triggerBatch(data, task) {
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const chunk = data.slice(i, i + BATCH_SIZE);
    await task.batchTrigger(
      chunk.map((item) => ({
        payload: item
      }))
    );
  }
}
__name(triggerBatch, "triggerBatch");

export {
  triggerBatch
};
//# sourceMappingURL=chunk-47TV3JZO.mjs.map
