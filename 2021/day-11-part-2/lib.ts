import { bgYellow, blue } from "https://deno.land/x/nanocolors@0.1.12/mod.ts";

type Square = number;

type Grid = Square[][];

interface Result {
  grid: Grid;
  flashes: number;
  novas: number[];
}

interface PrintOptions {
  fancy: boolean;
}

const isFlashing = (energy: number | undefined) => (energy ?? 0) > 9;

const justFlashed = (energy: number | undefined) => (energy ?? -1) === 0;

const printEnergy = (energy: number, options?: PrintOptions) => {
  const colour = options?.fancy
    ? (justFlashed(energy) ? bgYellow : blue)
    : (x: number) => x;
  return colour(energy);
};

export const print = (grid: Grid, options?: PrintOptions): string => {
  return grid.map(
    (row) => row.map((e) => printEnergy(e, options)).join(""),
  ).join("\n");
};

export const parse = (input: string): Grid => {
  return input.split("\n")
    .filter((s) => !!s.trim())
    .map((line) =>
      line.split("")
        .filter((s) => !!s.trim())
        .map((e) => +e)
    );
};

const key = ([x, y]: [number, number]) => [x, y].toString();

const flash = (
  x: number,
  y: number,
  grid: Grid,
  flashed: Set<string>,
) => {
  flashed.add(key([x, y]));

  for (const k of [y - 1, y, y + 1]) {
    for (const j of [x - 1, x, x + 1]) {
      if (
        grid[k]?.[j] !== undefined &&
        (k !== y || j !== x) &&
        !flashed.has(key([j, k]))
      ) {
        grid[k][j]++;
        if (isFlashing(grid[k][j])) {
          flash(j, k, grid, flashed);
        }
      }
    }
  }
};

const dims = (grid: Grid) => {
  return {
    height: grid.length,
    width: grid[0].length,
  };
};

const increment = (grid: Grid): Grid => {
  const increased = grid.map((row) => row.map((energy) => energy + 1));
  const flashed = new Set<string>();
  const { height, width } = dims(increased);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isFlashing(increased[y][x]) && !flashed.has(key([x, y]))) {
        flash(x, y, increased, flashed);
      }
    }
  }

  return increased;
};

const count = (grid: Grid): number => {
  return grid.reduce(
    (sum, row) =>
      sum + row.reduce(
        (sum, energy) => sum + (isFlashing(energy) ? 1 : 0),
        0,
      ),
    0,
  );
};

const reset = (grid: Grid): Grid => {
  return grid.map(
    (row) =>
      row.map(
        (energy) => isFlashing(energy) ? 0 : energy,
      ),
  );
};

const isNova = (grid: Grid): boolean => {
  const { height, width } = dims(grid);
  return count(grid) === (width * height);
};

export const simulate = (grid: Grid, n: number): Result => {
  return Array.from({ length: n }).reduce<Result>(
    (result, _, i) => {
      const grid = increment(result.grid);
      return {
        grid: reset(grid),
        flashes: result.flashes + count(grid),
        novas: isNova(grid) ? [...result.novas, i + 1] : result.novas,
      };
    },
    { grid, flashes: 0, novas: [] },
  );
};

export const firstNova = (grid: Grid, max = 999): number => {
  for (let t = 1; t < max; t++) {
    grid = increment(grid);
    if (isNova(grid)) {
      return t;
    }
    grid = reset(grid);
  }
  throw new Error(`😢 no nova's by time ${max}`);
};
