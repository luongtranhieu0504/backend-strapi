'use strict';

/**
 * post controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::post.post', ({ strapi }) => ({
  async create(ctx) {
    // Gọi hàm create gốc
    const response = await super.create(ctx);

    // Lấy data gốc
    const { id, attributes } = response.data;

    // Trả về dữ liệu phẳng
    return {
      status: 'success',
      data: {
        id,
        ...attributes,
      },
      message: 'OK',
    };
  },
  async find(ctx) {
    // Đảm bảo populate author và liked_by
    ctx.query = {
      ...ctx.query,
      populate: {
        author: true,
        liked_by: true,
      },
    };

    const { data, meta } = await super.find(ctx);

    // Flatten each post, lấy thông tin user và liked_by
    const flatData = data.map(post => ({
      id: post.id,
      ...post.attributes,
      author: post.attributes.author?.data
        ? {
            id: post.attributes.author.data.id,
            username: post.attributes.author.data.attributes.username,
            email: post.attributes.author.data.attributes.email,
            name: post.attributes.author.data.attributes.name,
            photoUrl: post.attributes.author.data.attributes.photoUrl,
            type_role: post.attributes.author.data.attributes.type_role,
          }
        : null,
      liked_by: post.attributes.liked_by?.data
        ? post.attributes.liked_by.data.map(user => ({
            id: user.id,
            username: user.attributes.username,
            name: user.attributes.name,
            photoUrl: user.attributes.photoUrl,
          }))
        : [],
    }));

    return {
      status: 'success',
      data: flatData,
      meta,
      message: 'OK',
    };
  },
}));
