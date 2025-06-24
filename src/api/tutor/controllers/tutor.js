'use strict';

/**
 * tutor controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::tutor.tutor', ({ strapi }) => ({
  async flattened(ctx) {
    // Lấy subject filter từ query (?subject=Toán)
    const subject = ctx.query.subject;

    // Lấy tất cả tutors, populate các trường cần thiết
    const tutors = await strapi.entityService.findMany('api::tutor.tutor', {
      populate: {
        user: true,
        schedules: true,
        reviews: true,
        conversations: true,
        availability: true,
        certifications: true,
      },
    });

    // Flatten dữ liệu tutor
    let flatTutors = tutors.map((tutor) => {
      const user = tutor.user;
      return {
        id: tutor.id,
        subjects: tutor.subjects,
        experienceYears: tutor.experienceYears,
        pricePerHour: tutor.pricePerHour,
        rating: tutor.rating,
        createdAt: tutor.createdAt,
        updatedAt: tutor.updatedAt,
        publishedAt: tutor.publishedAt,
        schedules: Array.isArray(tutor.schedules) ? tutor.schedules : [],
        reviews: Array.isArray(tutor.reviews) ? tutor.reviews : [],
        conversations: Array.isArray(tutor.conversations) ? tutor.conversations : [],
        availability: Array.isArray(tutor.availability) ? tutor.availability : [],
        certifications: Array.isArray(tutor.certifications) ? tutor.certifications : [],
        user: user
          ? {
              id: user.id,
              username: user.username,
              email: user.email,
              confirmed: user.confirmed,
              blocked: user.blocked,
              name: user.name,
              school: user.school,
              grade: user.grade,
              phone: user.phone,
              photoUrl: user.photoUrl,
              address: user.address,
              state: user.state,
              type_role: user.type_role,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            }
          : null,
      };
    });
    // Nếu có subject, filter theo subject trong mảng subjects
    if (subject) {
      flatTutors = flatTutors.filter(
        tutor => Array.isArray(tutor.subjects) && tutor.subjects.includes(subject)
      );
    }
    ctx.body = {
      status: 'success',
      data: flatTutors,
      message: 'OK',
    };
  },
  async me(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }
    const tutor = await strapi.db.query('api::tutor.tutor').findOne({
      where: { user: user.id },
      populate: ['user', 'availability', 'certifications'],
    });
    if (!tutor) {
      return ctx.notFound('Tutor not found');
    }
    return tutor;
  },
  async findOne(ctx) {
    // Ép populate user
    ctx.query = {
      ...ctx.query,
      populate: {
        user: true,
      },
    };

    const response = await super.findOne(ctx);

    if (!response?.data) {
      return ctx.notFound('Tutor not found');
    }
    // Flatten trường user
    const tutor = response.data;
    const user = tutor.attributes.user?.data;

    return {
      status: 'success',
      data: {
        id: tutor.id,
        ...tutor.attributes,
        user: user
          ? {
              id: user.id,
              name: user.attributes.name,
              email: user.attributes.email,
              photoUrl: user.attributes.photoUrl,
              type_role: user.attributes.type_role,
            }
          : null,
      },
      message: 'OK',
    };
  },

  async find(ctx) {
    // Ép populate user
    ctx.query = {
      ...ctx.query,
      populate: {
        user: true,
      },
    };

    const response = await super.find(ctx);
    // Flatten user cho từng tutor
    const flatData = response.data.map(tutor => {
      const user = tutor.attributes.user?.data;
      return {
        id: tutor.id,
        ...tutor.attributes,
        user: user
          ? {
              id: user.id,
              name: user.attributes.name,
              email: user.attributes.email,
              photoUrl: user.attributes.photoUrl,
              type_role: user.attributes.type_role,
            }
          : null,
      };
    });

    return {
      status: 'success',
      data: flatData,
      meta: response.meta,
      message: 'OK',
    };
  }
}));
