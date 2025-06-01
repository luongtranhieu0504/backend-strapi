'use strict';

/**
 * review controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::review.review', ({ strapi }) => ({
  async flatByTutor(ctx) {
    const tutorId = ctx.query.tutorId;
    if (!tutorId) {
      ctx.status = 400;
      return (ctx.body = { status: 'error', data: null, message: 'Missing tutorId' });
    }

    // Lấy tất cả review của tutor, populate student
    const reviews = await strapi.entityService.findMany('api::review.review', {
      filters: { tutor: tutorId },
      populate: { student: { fields: ['name'] } },
      sort: ['date:desc'],
    });

    // Trả về dạng phẳng, chỉ lấy name của student
    const flatReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      date: review.date,
      student: review.student.id,
      tutor: parseInt(tutorId, 10),
      studentName: review.student_name,
    }));

    ctx.body = {
      status: 'success',
      data: flatReviews,
      message: 'OK',
    };
  },
}));
