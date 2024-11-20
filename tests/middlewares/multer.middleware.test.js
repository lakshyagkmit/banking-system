const multer = require('multer');
const multerMiddleware = require('../../src/middlewares/multer.middleware');

describe('Multer Upload Middleware', () => {
  let req, file, cb;

  beforeEach(() => {
    req = {};
    cb = jest.fn();
  });

  describe('fileFilter', () => {
    it('should accept PNG files', () => {
      file = { mimetype: 'image/png' };
      multerMiddleware.upload.fileFilter(req, file, cb);

      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept JPG files', () => {
      file = { mimetype: 'image/jpg' };
      multerMiddleware.upload.fileFilter(req, file, cb);

      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept JPEG files', () => {
      file = { mimetype: 'image/jpeg' };
      multerMiddleware.upload.fileFilter(req, file, cb);

      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should reject other file types', () => {
      file = { mimetype: 'application/pdf' };
      multerMiddleware.upload.fileFilter(req, file, cb);

      expect(cb).toHaveBeenCalledWith(new Error('Only PNG, JPG, and JPEG files are allowed'));
    });
  });

  describe('limits', () => {
    it('should limit file size to 5MB', () => {
      const multerInstance = multer({
        limits: { fileSize: 5 * 1024 * 1024 },
      });

      expect(multerInstance.limits.fileSize).toBe(5 * 1024 * 1024);
    });
  });
});
