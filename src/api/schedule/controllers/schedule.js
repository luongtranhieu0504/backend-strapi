'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::schedule.schedule', ({ strapi }) => ({
   async flatList(ctx) {
    const { tutorId, studentId, date, status } = ctx.query;
    const filters = {};
    if (tutorId) filters.tutor = tutorId;
    if (studentId) filters.student = studentId;
    if (date) filters.start_date = date; // sửa lại thành start_date
    if (status) filters.status = status;

    const schedules = await strapi.entityService.findMany('api::schedule.schedule', {
      filters,
      populate: {
        student: { populate: { user: { fields: ['id', 'name'] } } },
        tutor: { populate: { user: { fields: ['id', 'name'] } } },
        slots: true, // sửa slot thành slots cho đúng schema
      },
      sort: ['start_date:asc'],
    });

    const flatSchedules = schedules.map((schedule) => ({
      id: schedule.id,
      start_date: schedule.start_date,
      status: schedule.status,
      student: schedule.student?.id,
      student_name: schedule.student?.user?.name,
      tutor: schedule.tutor?.id,
      tutor_name: schedule.tutor?.user?.name,
      slots: schedule.slots,
    }));

    ctx.body = {
      status: 'success',
      data: flatSchedules,
      message: 'OK',
    };
  },
}));
