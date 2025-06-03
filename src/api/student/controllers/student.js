'use strict';

/**
 * student controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::student.student', ({ strapi }) => ({
  async me(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }
    const student = await strapi.db.query('api::student.student').findOne({
      where: { user: user.id },
      populate: ['user'],
    });
    if (!student) {
      return ctx.notFound('Student not found');
    }
    return student;
  },

  async updateFavorites(ctx) {
    const studentId = ctx.params.id;
    const { favorites } = ctx.request.body;

    if (!favorites || !Array.isArray(favorites)) {
      ctx.status = 400;
      ctx.body = { status: 'error', data: null, message: 'favorites must be an array of tutor ids' };
      return;
    }

    // Update favorites
    const updatedStudent = await strapi.entityService.update('api::student.student', studentId, {
      data: { favorites },
      populate: ['favorites', 'user'],
    });

    // Flatten response
    const { id, user, favorites: favs, ...rest } = updatedStudent;
    ctx.body = {
      status: 'success',
      data: {
        id,
        ...rest,
        user,
        favorites: favs?.map(tutor => tutor.id),
      },
      message: 'OK',
    };
  },
}));
