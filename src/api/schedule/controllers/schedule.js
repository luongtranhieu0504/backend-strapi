'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::schedule.schedule', ({ strapi }) => ({
  async flatList(ctx) {
    const { tutorId, studentId, date, status } = ctx.query;
    const filters = {};
    if (tutorId) filters.tutor = tutorId;
    if (studentId) filters.student = studentId;
    if (date) filters.date = date;
    if (status) filters.status = status;

    const schedules = await strapi.entityService.findMany('api::schedule.schedule', {
      filters,
      populate: {
        student: { populate: { user: { fields: ['id', 'name'] } } },
        tutor: { populate: { user: { fields: ['id', 'name'] } } },
        slot: true,
      },
      sort: ['date:asc', 'time:asc'],
    });

    const flatSchedules = schedules.map((schedule) => ({
      id: schedule.id,
      start_date: schedule.start_date,
      status: schedule.status,
      student: schedule.student?.id,
      student_name: schedule.student?.user?.name,
      tutor: schedule.tutor?.id,
      tutor_name: schedule.tutor?.user?.name,
      slot: schedule.slot,
    }));

    ctx.body = {
      status: 'success',
      data: flatSchedules,
      message: 'OK',
    };
  },
}));
