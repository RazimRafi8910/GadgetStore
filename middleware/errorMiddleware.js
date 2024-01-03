
//error handler
function errorHandler(err, req, res, next) {
  const StatusCode = err.status || 500;
  const message = err.message || "Error occurred on the server";
  const stack = err.stack;
  res.status(StatusCode).render('error', {
    tittle:"error",
    message,
    stack
  })
}

module.exports = errorHandler