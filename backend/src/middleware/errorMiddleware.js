const errorMiddleware = (err, req, res, next) => {
  console.error('API Error Stack:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
  });
};

module.exports = errorMiddleware;
