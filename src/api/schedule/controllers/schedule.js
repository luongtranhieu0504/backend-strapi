'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::schedule.schedule', ({ strapi }) => ({
  async flatList(ctx) {
    const { tutorId, studentId, date, status } = ctx.query;
    const filters = {};
    if (tutorId) filters.tutor = tutorId;
    if (studentId) filters.student = studentId;
    if (date) filters.start_date = date;
    if (status) filters.status = status;

    const schedules = await strapi.entityService.findMany('api::schedule.schedule', {
      filters,
      populate: {
        tutor: { populate: { user: { fields: ['id', 'name'] } } },
        student: { populate: { user: { fields: ['id', 'name'] } } },
        slots: true,
      },
      sort: ['start_date:asc'],
    });

    const flatSchedules = schedules.map((schedule) => ({
      id: schedule.id,
      topic: schedule.topic,
      address: schedule.address,
      start_date: schedule.start_date,
      status: schedule.status,
      slots: schedule.slots,
      tutor: schedule.tutor
        ? {
            id: schedule.tutor.id,
            user: schedule.tutor.user
              ? {
                  id: schedule.tutor.user.id,
                  name: schedule.tutor.user.name,
                }
              : null,
          }
        : null,
      student: schedule.student
        ? {
            id: schedule.student.id,
            user: schedule.student.user
              ? {
                  id: schedule.student.user.id,
                  name: schedule.student.user.name,
                }
              : null,
          }
        : null,
    }));

    ctx.body = {
      status: 'success',
      data: flatSchedules,
      message: 'OK',
    };
  },
}));