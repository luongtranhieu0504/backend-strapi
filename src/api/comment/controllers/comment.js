'use strict';

/**
 * comment controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::comment.comment', ({ strapi }) => ({
  async find(ctx) {
    // Đảm bảo populate author
    ctx.query = {
      ...ctx.query,
      populate: {
        author: true,
      },
    };

    const { data, meta } = await super.find(ctx);

    // Flatten dữ liệu
    const flatData = data.map(comment => ({
      id: comment.id,
      ...comment.attributes,
      author: comment.attributes.author?.data
        ? {
            id: comment.attributes.author.data.id,
            name: comment.attributes.author.data.attributes.name,
            email: comment.attributes.author.data.attributes.email,
            photoUrl: comment.attributes.author.data.attributes.photoUrl,
            type_role: comment.attributes.author.data.attributes.type_role,
          }
        : null,
    }));

    return {
      status: 'success',
      data: flatData,
      meta,
      message: 'OK',
    };
  },
  async create(ctx) {
    // Tạo comment như bình thường
    const response = await super.create(ctx);
    const { id, attributes } = response.data;

    // Lấy postId từ body
    const postId = ctx.request.body.data?.post;

    if (postId) {
      // Lấy post hiện tại
      const post = await strapi.entityService.findOne('api::post.post', postId);

      if (post) {
        // Tăng comment_count lên 1
        await strapi.entityService.update('api::post.post', postId, {
          data: {
            comment_count: (post.comment_count || 0) + 1,
          },
        });
      }
    }
    // Flatten dữ liệu trả về
    return {
      status: 'success',
      data: {
        id,
        ...attributes,
      },
      message: 'OK',
    };
  },
  async update(ctx) {
    const response = await super.update(ctx);
    const { id, attributes } = response.data;
    return {
      status: 'success',
      data: {
        id,
        ...attributes,
      },
      message: 'OK',
    };
  },
}));
