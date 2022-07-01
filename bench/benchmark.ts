import { TrackedJSON } from "../src/tracked-json";

const track = new TrackedJSON<{ value: number }>({
  initialState: { value: 0 },
});

console.log("Starting benchmarks...");

let change = 0;
let undo = 0;
let redo = 0;

let total = 0;

let cap = 1000;

for (let i = 0; i < cap; i++) {
  const changeStart = +new Date();

  track.data.value++;

  track.data.value++;

  track.data.value++;

  track.data.value--;

  track.data.value--;

  track.data.value--;

  change += +new Date() - changeStart;

  const undoStart = +new Date();

  track.undo();

  track.undo();

  track.undo();

  undo += +new Date() - undoStart;

  const redoStart = +new Date();

  track.redo();

  track.redo();

  track.redo();

  redo += +new Date() - redoStart;
}

total = change + redo + undo;

console.log("Benchmarks finished! Results in milliseconds");
console.log("Change:", change);
console.log("Redo:", redo);
console.log("Undo:", undo);
console.log("Total:", total);
console.log("Per run:", total / cap);
