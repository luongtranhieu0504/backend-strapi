'use strict';

/**
 * conversation controller
 */

'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::conversation.conversation', ({ strapi }) => ({
  async findOrCreate(ctx) {
    const { studentId, tutorId } = ctx.request.body;

    if (!studentId || !tutorId) {
      ctx.status = 400;
      ctx.body = { status: 'error', message: 'Missing studentId or tutorId' };
      return;
    }

    // Tìm conversation đã tồn tại
    const existing = await strapi.entityService.findMany('api::conversation.conversation', {
      filters: {
        student: studentId,
        tutor: tutorId,
      },
      populate: { messages: true },
    });

    if (existing && existing.length > 0) {
      ctx.body = { status: 'success', data: existing[0], message: 'OK' };
      return;
    }

    // Nếu chưa có, tạo mới
    const conversation = await strapi.entityService.create('api::conversation.conversation', {
      data: {
        student: studentId,
        tutor: tutorId,
      },
      populate: { messages: true },
    });

    ctx.body = { status: 'success', data: conversation, message: 'Created' };
  },
}));
