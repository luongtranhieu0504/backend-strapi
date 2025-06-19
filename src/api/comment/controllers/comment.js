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
    const response = await super.create(ctx);
    const { id, attributes } = response.data;
    let author = null;
    if (attributes.author?.data) {
      author = {
        id: attributes.author.data.id,
        name: attributes.author.data.attributes.name,
        email: attributes.author.data.attributes.email,
        photoUrl: attributes.author.data.attributes.photoUrl,
        type_role: attributes.author.data.attributes.type_role,
      };
    }
    return {
      status: 'success',
      data: {
        id,
        ...attributes,
        author,
      },
      message: 'OK',
    };
  },
}));
