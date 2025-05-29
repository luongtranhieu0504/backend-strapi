module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    await next();

    // Chỉ áp dụng cho route bắt đầu bằng /api
    if (ctx.request.path.startsWith('/api')) {
      // Nếu đã có ctx.body
      if (typeof ctx.body !== 'undefined') {
        // Nếu là lỗi, giữ nguyên
        if (ctx.status >= 400) {
          ctx.body = {
            status: 'error',
            data: null,
            message: ctx.body?.error?.message || ctx.body?.message || 'Error',
          };
        } else {
          ctx.body = {
            status: 'success',
            data: ctx.body.data !== undefined ? ctx.body.data : ctx.body,
            message: 'OK',
          };
        }
      }
    }
  };
};