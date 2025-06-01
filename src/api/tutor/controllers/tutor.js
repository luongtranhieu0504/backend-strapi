'use strict';

/**
 * tutor controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::tutor.tutor', ({ strapi }) => ({
  async flattened(ctx) {
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

    const flattenTutor = (tutor) => {
      const user = tutor.user;
      return {
        id: tutor.id,
        uid: tutor.uid,
        subjects: tutor.subjects,
        degrees: tutor.degrees,
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
              bio: user.bio,
              address: user.address,
              state: user.state,
              type_role: user.type_role,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            }
          : null,
      };
    };

    ctx.body = {
      status: 'success',
      data: tutors.map(flattenTutor),
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
      populate: ['user'],
    });
    if (!tutor) {
      return ctx.notFound('Tutor not found');
    }
    return tutor;
  },
}));
