const { parentPort } = require("worker_threads");

/**
 * Calculates a range of digits of pi in hexadecimal
 * @param {number} start Integer for the starting digit to caculate
 * @param {number} end Integer the end digit to calculate
 * @returns {Array[string]} Array containing hexadecimal representations of the digits of pi calculated
 */
function calculateDigits(positions) {
  // calculate each digit of pi using the BBP spigot algorithm
  const calculateDigit = n => {
    // calculate each section of the overall sum calculation
    const partial = (d, c) => {
      let sum = 0;

      let k;
      for (k = 0; k <= d - 1; k += 1) {
        sum += (16 ** (d - 1 - k) % (8 * k + c)) / (8 * k + c);
      }

      let prev = null;
      for (k = d; sum !== prev; k += 1) {
        prev = sum;
        sum += 16 ** (d - 1 - k) / (8 * k + c);
      }

      if (sum > Number.MAX_SAFE_INTEGER) {
        throw new Error("Digit too be calculated unsafe due to integer overflow.");
      } else {
        return sum;
      }
    };

    // converted modulus function to work on negative numbers
    const modulus = x => (x < 0 ? 1 - (-x % 1) : x % 1);

    // calculate all partial summations and add them all together to get the digit
    let s = 0;
    s += 4 * partial(n, 1);
    s += -2 * partial(n, 4);
    s += -1 * partial(n, 5);
    s += -1 * partial(n, 6);

    // extract just the whole part of the full summation (the actual digit of pi)
    s = modulus(s);
    return Math.floor(s * 16).toString(16);
  };

  // for each position in the array, calculate the digit of pi at position and push it to an array
  const digits = [];
  if (positions !== null) {
    for (let p = 0; p < positions.length; p += 1) {
      digits.push({ pos: positions[p], val: calculateDigit(positions[p]) });
    }
  }
  return digits;
}

// when a mesage is received from the controller, calculate the digits and hand it back
parentPort.on("message", positions => {
  parentPort.postMessage(calculateDigits(positions));
});
