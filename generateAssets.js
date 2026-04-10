const fs = require("fs");
const path = require("path");

const basePath = "./src/assets/steps";

const TYPES = ["yoga", "meditation"];
const WEEKS = 4;
const DAYS = 7;
const VARIATIONS = 3;

const getStepRange = (type) =>
  type === "yoga" ? [1, 8] : [9, 16];

TYPES.forEach((type) => {
  for (let w = 1; w <= WEEKS; w++) {
    for (let d = 1; d <= DAYS; d++) {
      const [start, end] = getStepRange(type);

      for (let s = start; s <= end; s++) {
        for (let v = 1; v <= VARIATIONS; v++) {
          const fileName = `${type}-w${w}-d${d}-s${s}-v${v}.png`;
          const filePath = path.join(basePath, type, fileName);

          // Ensure folder exists
          fs.mkdirSync(path.dirname(filePath), { recursive: true });

          // Create empty file
          fs.writeFileSync(filePath, "");
        }
      }
    }
  }
});

console.log("✅ All asset files generated!");
