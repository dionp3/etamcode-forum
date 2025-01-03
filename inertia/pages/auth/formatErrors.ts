// Method to format error messages
export const formatErrors = (error: string | undefined) => {
  return Array.isArray(error) ? error.join(', ') : error
}
