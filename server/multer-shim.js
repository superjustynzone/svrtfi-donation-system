// A minimal shim to replace multer in environments where local disk uploads are not desired.
// Routes that previously used multer should instead call the serverless endpoints under /api/

/* eslint-disable no-unused-vars, no-undef */
// Simple Multer shim for compatibility when switching to serverless uploads.
// It returns middleware that rejects upload attempts with a clear message.

function diskStorage() {
  return {};
}

function memoryStorage() {
  return {};
}

function single(_fieldName) {
  return function (req, res) {
    res.status(501).json({
      error: 'Server compatibility mode: disk uploads are disabled. Use the serverless endpoints under /api/ (e.g., /api/upload-profile or /api/receipt-upload) or upload directly to Supabase Storage.'
    });
  };
}

function fields(_fieldsArray) {
  return function (req, res) {
    res.status(501).json({
      error: 'Server compatibility mode: disk uploads are disabled. Use the serverless endpoints under /api/ or upload directly to Supabase Storage.'
    });
  };
}

exports = module.exports = function () {
  return {
    diskStorage,
    memoryStorage,
    single,
    fields,
  };
};

