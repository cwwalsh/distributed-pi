const { Worker } = require("worker_threads");
const Decimal = require("decimal.js");

/**
 * Spawns worker pool.
 * @param {number} poolSize Integer value for number of workers
 * @param {string} filePath Path to JS file for worker process to run
 * @returns {array[Worker]} Worker pool of size poolSize with process filePath
 */
function createWorkerPool(poolSize, filePath) {
  const workers = [];
  for (let i = 0; i < poolSize; i += 1) {
    workers.push(new Worker(filePath));
  }

  return workers;
}

/**
 * Use existing worker pool running circle points calculator to return 3 random points for each cycle.
 * @param {array[Worker]} workerPool Pre-existing pool of workers running the BBP digit calculator
 * @param {number} n Number of digits required
 * @param {number} x Number of cycles
 * @returns {number} Pi to required number of digits
 */
async function calculateDigits(workerPool, n, x) {
  let results = [];

  const fullDigits = [...Array(n).keys()];
  const cycleDigits = [];

  // break digits into cycles to be run
  const digitsPerCycle = Math.floor(n / x);
  for (let i = 0; i < fullDigits.length; i += digitsPerCycle) {
    cycleDigits.push(fullDigits.slice(i, i + digitsPerCycle));
  }
  // if x does not divide into n evenly, split the remaining digits into first few cycles
  if (n % x !== 0) {
    const remainingDigits = cycleDigits.pop();
    for (let i = 0; i < remainingDigits.length; i += 1) {
      cycleDigits[i].push(remainingDigits[i]);
    }
  }

  for (let c = 0; c < cycleDigits.length; c += 1) {
    // for each cycle, calculate number of digits to pass to each worker
    const workerDigits = [];

    const digits = cycleDigits[c];

    // if there is less digits per cycle than workers, simply hand digits off to the first workers available and give the other workers null
    if (digits.length < workerPool.length) {
      for (let i = 0; i < workerPool.length; i += 1) {
        if (digits[i] !== undefined) {
          workerDigits.push([digits[i]]);
        } else {
          workerDigits.push(null);
        }
      }
    } else {
      const digitsPerWorker = Math.floor(digits.length / workerPool.length);
      for (let i = 0; i < digits.length; i += digitsPerWorker) {
        workerDigits.push(digits.slice(i, i + digitsPerWorker));
      }

      // if there is remaining digits not assigned to a worker assign them
      const numberRemaining = digits.length % workerPool.length;
      if (numberRemaining !== 0) {
        const remainingDigits = workerDigits.pop();

        for (let i = 0; i < remainingDigits.length; i += 1) {
          workerDigits[i].push(remainingDigits[i]);
        }
      }
    }

    // hand off digits to the workers
    const workerResults = [];
    for (let w = 0; w < workerPool.length; w += 1) {
      const currentWorker = workerPool[w];

      // remove old listeners from worker
      currentWorker.removeAllListeners("message");
      currentWorker.removeAllListeners("error");
      currentWorker.removeAllListeners("exit");

      workerResults.push(
        new Promise((resolve, reject) => {
          // once a worker returns a result, add it to the total digits. If a worker fails, reject the promise and store the error
          currentWorker.on("message", res => {
            resolve(res);
          });
          currentWorker.on("error", error => {
            reject(error);
          });
          currentWorker.on("exit", code => {
            if (code !== 0) {
              reject(new Error(`Worker crashed with code ${code}`));
            }
          });
        })
      );

      // trigger worker process if worker has digits to calculate
      workerPool[w].postMessage(workerDigits[w]);
    }

    // wait for all workers to return their results before adding them all together
    try {
      // eslint-disable-next-line no-await-in-loop
      const cycleResults = await Promise.all(workerResults);
      results = results.concat(...cycleResults);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return { err: true };
    }
  }

  // sort results by pos and reduce to just the vals
  results = results.sort((a, b) => a.pos - b.pos).map(digit => digit.val);

  // add decimal point
  if (results.length > 1) {
    results.splice(1, 0, ".");
  }

  let hexPi = results.join("");

  // add hex indicator
  hexPi = `0x${hexPi}`;

  // convert hexadecimal pi to decimal
  const decimalPi = new Decimal(hexPi);

  return decimalPi.toString().slice(0, n + 1);
}

module.exports = { createWorkerPool, calculateDigits };
