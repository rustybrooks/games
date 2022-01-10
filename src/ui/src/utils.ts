export function debounce(fn: (...args: any[]) => void, time: number) {
  let timeoutId: ReturnType<typeof setTimeout>;

  function wrapper(...args: any[]) {
    console.log('timeout 1', timeoutId);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;

      fn(...args);
    }, time);
    console.log('timeout 2', timeoutId);
  }

  return wrapper;
}
