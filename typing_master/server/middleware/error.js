/**
 * Central error handling: 404 for unknown API routes, then a final
 * error handler that maps Mongoose errors and unexpected failures to
 * a consistent JSON shape.
 */

function notFound(req, res) {
  res.status(404).json({
    error: "Not found",
    method: req.method,
    path: req.originalUrl,
  });
}

function errorHandler(err, req, res, _next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {}).join(", ");
    message = `Duplicate value for: ${field || "unique field"}`;
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid value for "${err.path}"`;
  }

  if (status >= 500) {
    console.error("[error]", err);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
