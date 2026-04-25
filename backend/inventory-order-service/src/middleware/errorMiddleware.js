// map pg error codes to http
const pgErrorMap = (err, req, res, next) => {
  const codes = {
    '23505': { status: 409, message: 'Conflict: Unique constraint violation' },
    '23503': { status: 400, message: 'Bad Request: Foreign key violation' }
  };

  const mapped = codes[err.code];
  if (mapped) {
    // send formatted error
    return res.status(mapped.status).json({
      error: mapped.message,
      code: err.code,
      details: err.detail
    });
  }
  next(err);
};

module.exports = pgErrorMap;