import { TrackedJSON } from "tracked-json";

const track = new TrackedJSON<{ value: number }>({
  initialState: { value: 0 },
});

console.log("Asserting values are tracked correctly");

console.assert(track.data.value === 0);

track.data.value++;
console.assert(track.data.value === 1);

track.data.value++;
console.assert(track.data.value === 2);

track.data.value++;
console.assert(track.data.value === 3);

track.data.value--;
console.assert(track.data.value === 2);

track.data.value--;
console.assert(track.data.value === 1);

track.data.value--;
console.assert(track.data.value === 0);

track.undo();
console.assert(track.data.value === 1);

track.undo();
console.assert(track.data.value === 2);

track.undo();
console.assert(track.data.value === 3);

track.redo();
console.assert(track.data.value === 2);

track.redo();
console.assert(track.data.value === 1);

track.redo();
console.assert(track.data.value === 0);

console.log("All worked as expected!");
