import React, { useMemo, useState } from "react";
import "./App.css";
import { TrackedJSON } from "tracked-json";

import { SketchPicker } from "react-color";

const getRandomNumber = (maxNum: number) => {
  return Math.floor(Math.random() * maxNum);
};

function getHSL(hsl: { h: number; s: number; l: number }) {
  return `hsl(${parseInt(`${hsl.h}`)}deg, ${parseInt(
    `${hsl.s * 100}`
  )}%, ${parseInt(`${hsl.l * 100}`)}%)`;
}

function HSLStringToObject(hsl: string) {
  console.log(hsl);
  const [h, s, l] = hsl
    .replace("hsl(", "")
    .replace(")", "")
    .replace("deg", "")
    .replace("%", "")
    .replace("%", "")
    .split(",");

  return { h: parseInt(h), s: parseInt(s), l: parseInt(l) };
}

function getColorCode() {
  const h = getRandomNumber(360);

  const invertH = (h + 180) % 360;

  const color = getHSL({ h, s: 0.4, l: 0.5 });
  const invert = getHSL({ h: invertH, s: 0.4, l: 0.5 });

  return {
    color,
    invert,
  };
}

function getRandomSquare() {
  const { color, invert } = getColorCode();

  return {
    backgroundColor: color,
    width: 500,
    height: 500,
    border: `solid 10px ${invert}`,
    color: invert,
    fontSize: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
  };
}

function useTrackedJSON() {
  const tracked = useMemo(
    () => new TrackedJSON({ initialState: getRandomSquare() }),
    []
  );
  const [value, setValue] = useState(tracked.clone());

  return {
    value,
    set: (styles: React.CSSProperties) => {
      tracked.data = styles;
      setValue(tracked.clone());
    },
    undo: () => {
      tracked.undo();
      setValue(tracked.clone());
    },
    redo: () => {
      tracked.redo();
      setValue(tracked.clone());
    },
    undoSize: tracked.undoSize,
    redoSize: tracked.redoSize,
  };
}

function App() {
  const { value, set, undo, redo, undoSize, redoSize } = useTrackedJSON();

  console.log(value);

  return (
    <div className="App">
      <button
        name="set"
        onClick={() => {
          const newValues = { ...getRandomSquare() };
          set(newValues);
        }}
      >
        RANDOM SQUARE
      </button>

      <button
        name="inverse"
        onClick={() => {
          set({
            ...value,
            backgroundColor: value.color,
            color: value.backgroundColor,
            border: `solid 10px ${value.backgroundColor}`,
          });
        }}
      >
        SWAP COLORS
      </button>
      <button
        id="undo"
        style={{ backgroundColor: "#e7e7e7" }}
        name="undo"
        disabled={undoSize === 0}
        onClick={() => {
          undo();
        }}
      >
        UNDO ({undoSize})
      </button>
      <button
        id="redo"
        style={{ backgroundColor: "#e7e7e7" }}
        name="redo"
        disabled={redoSize === 0}
        onClick={() => {
          redo();
        }}
      >
        REDO ({redoSize})
      </button>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div>
          <SketchPicker
            disableAlpha={true}
            color={HSLStringToObject(value.color)}
            onChangeComplete={(color) => {
              const hsl = getHSL(color.hsl);
              set({
                ...value,
                color: hsl,
                border: `solid 10px ${hsl}`,
              });
            }}
          />
        </div>
        <div>
          <SketchPicker
            disableAlpha={true}
            color={HSLStringToObject(value.backgroundColor)}
            onChangeComplete={(color) => {
              set({ ...value, backgroundColor: getHSL(color.hsl) });
            }}
          />
        </div>

        <div style={value}>
          <pre>{JSON.stringify(value, null, 4)}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;
