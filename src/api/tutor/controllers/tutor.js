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

        schedules: tutor.schedules || [],
        reviews: tutor.reviews || [],
        conversations: tutor.conversations || [],
        availability: tutor.availability || [],
        certifications: tutor.certifications || [],

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
}));
