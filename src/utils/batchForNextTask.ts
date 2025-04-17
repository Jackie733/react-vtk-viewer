export function batchForNextTask<T extends (...args: any[]) => void>(fn: T) {
  let scheduled = false;
  let lastArgs: Parameters<T> | null = null;

  const wrapper = ((...args: Parameters<T>) => {
    lastArgs = args;

    if (scheduled) return;
    scheduled = true;

    queueMicrotask(() => {
      scheduled = false;
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
    });
  }) as T;

  return wrapper;
}
