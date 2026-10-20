import axios from 'axios';

export const getErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === 'string') {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item: { msg?: string }) => item.msg ?? '')
        .filter(Boolean)
        .join(', ');
    }

    const message = error.response?.data?.message;

    if (typeof message === 'string') {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};