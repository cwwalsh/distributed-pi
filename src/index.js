/* eslint-disable prettier/prettier */
const express = require("express");
const path = require("path");

const workerController = require("./workerController");

require("dotenv").config();

// initialise 3 worker threads
const workers = workerController.createWorkerPool(
  process.env.WORKER_POOL_SIZE,
  path.join(__dirname, "workerProcess.js")
);

// initialise server
const app = express();

app.use(express.json());

app.post("/calculate", async (req, res) => {
  const x = parseInt(req.body.x, 10);
  const n = parseInt(req.body.n, 10);

  if (x < 1) {
    return res.status(400).send("x must be an integer value greater than or equal to 1.");
  }

  if (n < 1 || n >= 258) {
    return res.status(400).send("n must be an integer value greater than or equal to 1 and less than 258.");
  }
  if (!x) {
    return res.status(400).send("x value missing from request.");
  }
  if (!n) {
    return res.status(400).send("n value missing from request.");
  }
  if (n < x) {
    return res.status(400).send("n digits must be greater than or equal to x.")
  }

  const result = await workerController.calculateDigits(workers, n, x)
  if (result.err) {
    return res.status(500).send();
  }
  
  return res.status(200).send({pi: result});
});

// eslint-disable-next-line no-console
app.listen(process.env.PORT, () => console.log(`App running on port ${process.env.PORT}.`));
