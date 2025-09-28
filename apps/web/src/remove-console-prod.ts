// This file disables all console logs in production (NODE_ENV === 'production')
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  for (const method of ['log', 'debug', 'info', 'warn']) {
    // @ts-ignore
    console[method] = () => {};
  }
}
