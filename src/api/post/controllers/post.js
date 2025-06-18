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
    const { data, meta } = await super.find(ctx);

    // Flatten each post
    const flatData = data.map(post => ({
      id: post.id,
      ...post.attributes,
    }));

    return {
      status: 'success',
      data: flatData,
      message: 'OK',
    };
  },
}));
