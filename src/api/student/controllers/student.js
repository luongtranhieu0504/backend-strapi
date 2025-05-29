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
}));
