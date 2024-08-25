/**
 * Represents API result.
 * @param T result data type.
 */
export class Result<T> {
  constructor(
    public success: boolean = false,
    public message: String | null = null,
    public data: T | null = null,
    public count: number | null | undefined = undefined,
  ) { }

  /**
   * Create success result.
   * @param message Sucess message.
   * @param data Data to be associated with the result.
   * @param count Count for pagination (optional).
   * @returns Returns success result instance.
   */
  static successResult<T>(message: string | null, data: T,
    count?: number | null | undefined): Result<T> {
    return new Result(
      true,
      message,
      data,
      count,
    )
  }

  /**
   * Create an error result.
   * @param message Error message.
   * @returns Returns error result instance.
   */
  static errorResult<T>(message: string | null): Result<T> {
    return new Result(
      false,
      message,
      null,
      undefined,
    );
  }
}