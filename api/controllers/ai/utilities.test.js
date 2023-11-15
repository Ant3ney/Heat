const extraLogging = true;
const { getCoordinates } = require("./utilities");

if (!Test) {
  var Test = (name, test) => {
    console.log(name);
    test();
  };
}

if (!expect) {
  var expect = (actual) => {
    return {
      not: {
        toBe: (expected) => {
          if (actual === expected) {
            throw new Error(`Expected ${actual} to be ${expected}`);
          } else {
            console.log("Test passed");
          }
        },
      },
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${actual} to be ${expected}`);
        } else {
          console.log("Test passed");
        }
      },
    };
  };
}

const testFires = [
  {
    center: 4,
    severity: "Spotting",
  },
  {
    center: 5,
    severity: "Uphill Runs",
  },
];

Test(
  "Check if given a fire coordinate and its severity, it returns a list of coordinates  of where the fire should spread.",
  async () => {
    const coordinates = await getCoordinates(testFires);
    if (extraLogging) console.log("coordinates:", coordinates);
    expect(coordinates).not.toBe(undefined);
  }
);
