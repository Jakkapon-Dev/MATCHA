import { z } from 'zod';
import multer from 'multer';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const isClientError =
    error instanceof z.ZodError ||
    error.code === 'LIMIT_FILE_SIZE' ||
    error instanceof multer.MulterError ||
    error.code === 11000 ||
    (error.status && error.status < 500);

  if (!isClientError && process.env.NODE_ENV !== 'test') {
    console.error('🚨 [ErrorHandler]', error?.message || error);
  }

  const status =
    error instanceof z.ZodError
      ? 400
      : error.code === 'LIMIT_FILE_SIZE'
      ? 413
      : error instanceof multer.MulterError
      ? 400
      : error.code === 11000
      ? 409
      : error.status || 500;

  res.status(status).json({
    success: false,
    message:
      status === 500
        ? 'บันทึกไม่สำเร็จ กรุณาลองใหม่'
        : error instanceof z.ZodError
        ? 'กรุณาตรวจข้อมูลที่กรอก'
        : error.code === 'LIMIT_FILE_SIZE'
        ? 'รูปต้องมีขนาดไม่เกิน 8 MB'
        : error.code === 11000
        ? 'ข้อมูลถูกบันทึกแล้ว กรุณาโหลดใหม่'
        : error.message,
    ...(error.usage ? { usage: error.usage } : {})
  });
}

export default errorHandler;
