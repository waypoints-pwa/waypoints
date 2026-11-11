export const reasons = {
  data: (err: { message: string; code?: string; table?: string }): string => err.message,
}
