import { z } from 'zod';

export function identity<T>(arg: T) {
  return arg;
}

type PromiseResolveFunction<T> = (value: T) => void;
type PromiseRejectFunction = (reason?: Error) => void;
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: PromiseResolveFunction<T>;
  reject: PromiseRejectFunction;
}

export function defer<T>(): Deferred<T> {
  let innerResolve: PromiseResolveFunction<T> | null = null;
  let innerReject: PromiseRejectFunction | null = null;

  const resolve = (value: T) => {
    if (innerResolve) innerResolve(value);
  };
  const reject = (reason?: Error) => {
    if (innerReject) innerReject(reason);
  };

  const promise = new Promise<T>((res, rej) => {
    innerResolve = res;
    innerReject = rej;
  });

  return { promise, resolve, reject };
}

export function removeFromArray<T>(arr: Array<T>, el: T) {
  const idx = arr.indexOf(el);
  if (idx > -1) {
    arr.splice(idx, 1);
  }
}

export function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  return keys.reduce((o, k) => ({ ...o, [k]: obj[k] }), {} as Pick<T, K>);
}

export function partitionByType<T, U extends T>(
  guard: (x: T) => x is U,
  arr: T[],
): [U[], Exclude<T, U>[]] {
  const ret: [U[], Exclude<T, U>[]] = [[], []];
  arr.forEach((el) =>
    guard(el) ? ret[0].push(el) : ret[1].push(el as Exclude<T, U>),
  );
  return ret;
}

export function zodEnumFromObjKeys<K extends string>(
  obj: Record<K, any>,
): z.ZodEnum<[K, ...K[]]> {
  const [firstKey, ...otherKeys] = Object.keys(obj) as K[];
  return z.enum([firstKey, ...otherKeys]);
}

export function nonNullable<T>(value: T): value is NonNullable<T> {
  return value != null;
}
