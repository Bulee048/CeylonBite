const errorMiddleware = (err, req, res, next) => {
  // Always log full diagnostic detail server-side (never sent to the client).
  console.error('API Error:', err && (err.stack || err.message || err));

  const status = err && err.status ? err.status : 500;

  // Never leak raw internal/database error text to clients on server errors.
  const message =
    status >= 500
      ? 'An unexpected internal server error occurred. Please try again.'
      : (err && err.message) || 'Request failed';

  res.status(status).json({
    success: false,
    message,
  });
};

module.exports = errorMiddleware;
