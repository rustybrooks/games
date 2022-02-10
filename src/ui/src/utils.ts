export function debounce(fn: (...args: any[]) => void, time: number) {
  let timeoutId: ReturnType<typeof setTimeout>;

  function wrapper(...args: any[]) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;

      fn(...args);
    }, time);
  }

  return wrapper;
}

export function formatDistance(d1: Date, d2: Date) {
  const signedOffset = d2.valueOf() - d1.valueOf();
  const offsetMinutes = Math.abs(signedOffset) / (60 * 1000);

  if (offsetMinutes < 120) {
    return signedOffset > 0 ? `${offsetMinutes} minutes ago` : `${offsetMinutes} minutes from now`;
  }

  const offsetHours = Math.round(offsetMinutes / 60);
  if (offsetHours < 48) {
    return signedOffset > 0 ? `${offsetHours} hours ago` : `${offsetHours} hours from now`;
  }

  const offsetDays = Math.round(offsetHours / 24);
  if (offsetDays < 90) {
    return signedOffset > 0 ? `${offsetDays} days ago` : `${offsetDays} days from now`;
  }

  const offsetMonths = Math.round(offsetDays / 30);
  return signedOffset > 0 ? `${offsetMonths} months ago` : `${offsetMonths} months from now`;
}
