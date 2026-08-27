/**
 * Error Middleware
 */
export async function errorMiddleware(err, req, res, next) {
    res.status(err.status || 500).json({
      success: false,
      message:
        typeof err.message === "string"
          ? err.message
          : JSON.stringify(err.message), // fallback safety
    });
}
