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
  async listByUser(ctx) {
    const { studentId, tutorId } = ctx.query;

    if (!studentId && !tutorId) {
      ctx.status = 400;
      ctx.body = { status: 'error', data: null, message: 'Missing studentId or tutorId' };
      return;
    }

    // Ép kiểu về số
    const filters = {};
    if (studentId) filters.student = parseInt(studentId, 10);
    if (tutorId) filters.tutor = parseInt(tutorId, 10);

    // Lấy conversations, populate cả student và tutor
    const conversations = await strapi.entityService.findMany('api::conversation.conversation', {
      filters,
      populate: {
        student: { populate: ['user'] },
        tutor: { populate: ['user'] },
      },
      sort: ['updatedAt:desc'],
    });

    // Trả về info của "other user"
    const result = conversations.map(conv => {
    let otherUser = null;
    if (studentId) {
      // Nếu là student, other user là tutor.user
      otherUser = conv.tutor && conv.tutor.user
        ? {
            id: conv.tutor.user.id,
            name: conv.tutor.user.name,
            email: conv.tutor.user.email,
            photoUrl: conv.tutor.user.photoUrl,
            address: conv.tutor.user.address,
            fcmToken: conv.tutor.user.fcmToken
            // thêm các trường khác nếu cần
          }
        : null;
    } else if (tutorId) {
      // Nếu là tutor, other user là student.user
      otherUser = conv.student && conv.student.user
        ? {
            id: conv.student.user.id,
            name: conv.student.user.name,
            email: conv.student.user.email,
            photoUrl: conv.student.user.photoUrl,
            address: conv.student.user.address,
            fcmToken: conv.student.user.fcmToken
            // thêm các trường khác nếu cần
          }
        : null;
    }
    return {
      id: conv.id,
      lastMessage: conv.lastMessage,
      lastTimestamp: conv.lastTimestamp,
      otherUser,
    };
  });
    ctx.body = {
      status: 'success',
      data: result,
      message: 'OK',
    };
  },
}));
