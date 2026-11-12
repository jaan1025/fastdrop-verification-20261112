export const runInNextTick = <T>(fn: () => T, delay = 100) => {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn())
      } catch (error) {
        reject(error)
      }
    }, delay)
  })
}
