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
    // Populate cả user và favorites
    const student = await strapi.db.query('api::student.student').findOne({
      where: { user: user.id },
      populate: ['user', 'favorites'],
    });
    if (!student) {
      return ctx.notFound('Student not found');
    }

    // Flatten favorites (chỉ lấy id, hoặc lấy thêm các trường khác nếu muốn)
    return {
      id: student.id,
      ...student,
      user: student.user
        ? {
            id: student.user.id,
            name: student.user.name,
            fcmToken: student.user.fcmToken,
            email: student.user.email,
            photoUrl: student.user.photoUrl,
            address: student.user.address,
          }
        : null,
      favorites: Array.isArray(student.favorites)
        ? student.favorites.map(tutor => ({
            id: tutor.id,
            name: tutor.name,
            // thêm các trường khác nếu muốn
          }))
        : [],
    };
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
    async findOne(ctx) {
    const { id } = ctx.params;
    // Lấy dữ liệu student, populate user
    const entity = await strapi.entityService.findOne('api::student.student', id, {
      populate: { user: true }
    });
    if (!entity) return ctx.notFound();

    // Trả về dạng phẳng
    ctx.body = {
      id: entity.id,
      ...entity,
      user: entity.user
        ? {
            id: entity.user.id,
            name: entity.user.name,
            fcmToken: entity.user.fcmToken,
            email: entity.user.email,
            photoUrl: entity.user.photoUrl,
            address: entity.user.address,
            // thêm các trường khác nếu cần
          }
        : null,
    };
  }
}));
