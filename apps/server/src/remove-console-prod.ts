// Disables all console logs in production (NODE_ENV === 'production')
if (process.env.NODE_ENV === 'production') {
  for (const method of ['log', 'debug', 'info', 'warn']) {
    // @ts-ignore
    console[method] = () => {};
  }
}
