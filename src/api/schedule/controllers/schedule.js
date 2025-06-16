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
  async create(ctx) {
    // Tạo schedule mới
    const response = await super.create(ctx);
    const schedule = response.data;

    // Lấy thông tin populate sâu để gửi notify
    const fullSchedule = await strapi.entityService.findOne('api::schedule.schedule', schedule.id, {
      populate: {
        tutor: { populate: { user: true } },
        student: { populate: { user: true } },
      }
    });

    // Gửi notify cho student khi tutor tạo lịch (status mặc định là pending)
    if (fullSchedule.status === 'pending') {
      await strapi.service('api::notification.notification').send({
        type: 'schedule',
        title: 'Lịch học mới',
        content: `Bạn có một lịch học mới từ gia sư ${fullSchedule.tutor?.user?.name}, vui lòng xác nhận hoặc từ chối.`,
        fromUserId: fullSchedule.tutor?.user?.id,
        toUserId: fullSchedule.student?.user?.id,
        entityId: schedule.id
      });
    }

    return response;
  },

  async update(ctx) {
    // Cập nhật schedule
    const response = await super.update(ctx);
    const schedule = response.data;

    // Lấy thông tin populate sâu để gửi notify
    const fullSchedule = await strapi.entityService.findOne('api::schedule.schedule', schedule.id, {
      populate: {
        tutor: { populate: { user: true } },
        student: { populate: { user: true } },
      }
    });

    // Gửi notify cho tutor khi student xác nhận hoặc hủy lịch
    if (fullSchedule.status === 'approved') {
      await strapi.service('api::notification.notification').send({
        type: 'schedule',
        title: 'Lịch học đã được xác nhận',
        content: `Sinh viên ${fullSchedule.student?.user?.name} đã xác nhận lịch học.`,
        fromUserId: fullSchedule.student?.user?.id,
        toUserId: fullSchedule.tutor?.user?.id,
        entityId: schedule.id
      });
    }
    if (fullSchedule.status === 'cancelled') {
      await strapi.service('api::notification.notification').send({
        type: 'schedule',
        title: 'Lịch học bị hủy',
        content: `Sinh viên ${fullSchedule.student?.user?.name} đã từ chối/hủy lịch học.`,
        fromUserId: fullSchedule.student?.user?.id,
        toUserId: fullSchedule.tutor?.user?.id,
        entityId: schedule.id
      });
    }

    return response;
  },

}));