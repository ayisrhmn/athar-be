export function successResponse<T>(data: T, status = 200) {
  return {
    status,
    message: "success",
    data,
  };
}

export function errorResponse(message?: string, status = 400) {
  return {
    status,
    message: message || "error",
    data: null,
  };
}
