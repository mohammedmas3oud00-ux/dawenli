/** Uniform Server Action result consumed by `useActionState` forms. */
export type ActionResult<T = undefined> =
  | { status: "idle" }
  | { status: "success"; data?: T; message?: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

export const idle: ActionResult<never> = { status: "idle" };
