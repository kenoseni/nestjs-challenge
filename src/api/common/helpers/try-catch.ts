type Result<T, E = Error> = [T | null, E | null];
export async function tryCatchAsync<T, E = Error>(
  fn: () => Promise<T>,
  handleError: (error: E) => void = (error) => {
    throw error;
  },
): Promise<Result<T, E>> {
  const result: Result<T, E> = [null, null];
  try {
    result[0] = await fn();
  } catch (error) {
    result[1] = error as E;
    handleError(error as E);
  }
  return result;
}
