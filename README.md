# distributed-pi
Distributed system which calcluates pi across multiple worker nodes using the Bailey–Borwein–Plouffe spigot formula.

# Running
First, install the dependencies with `npm install --production`.
The number of worker nodes (default 3) and the server port (default 3000) can be changed in `.env`.

`npm run bbp` should then expose the `/calculate` endpoint at the specified port on localhost.

# Development
First, install the dependencies with `npm install`.

`npm run dev` should then run the application under nodemon for hot reloading.

# Parameters
`/calculate` takes 2 parameters - `n` and `x`.
* `n` - The number of digits of pi to calculate. A minimum value of 1 will return the 0th digit of pi (3). `n` must be less than 258 due to calculation limitations.
* `x` - The number of cycles to calculate pi over. The `n` digits will be split into `x` separate cycles and passed to the workers one cycle at a time e.g. if `n = 7`
and `x = 2`, then in cycle 1 the digits at positions 0,1,2,6 will be calculated, followed by positions 3,4,5 in cycle 2. `x` must be greater than or equal to 1 and less than
or equal to `n`.
