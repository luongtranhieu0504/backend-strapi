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
  async update(ctx) {
    // Gọi hàm update gốc
    const response = await super.update(ctx);

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
  async like(ctx) {
    const postId = ctx.params.id;
    const userId = ctx.state.user?.id || ctx.request.body.userId; // lấy từ token hoặc body

    if (!userId) {
      return ctx.badRequest('Missing user id');
    }

    // Lấy post hiện tại
    const post = await strapi.entityService.findOne('api::post.post', postId, {
      populate: { liked_by: true }
    });

    if (!post) {
      return ctx.notFound('Post not found');
    }

    // Kiểm tra user đã like chưa
    const likedByIds = post.liked_by.map(u => u.id);
    let newLikedBy;
    let newLikeCount = post.like_count;

    if (!likedByIds.includes(userId)) {
      // Like mới
      newLikedBy = [...likedByIds, userId];
      newLikeCount += 1;
    } else {
      // Unlike
      newLikedBy = likedByIds.filter(id => id !== userId);
      newLikeCount = Math.max(0, newLikeCount - 1);
    }

    // Cập nhật post
    const updated = await strapi.entityService.update('api::post.post', postId, {
      data: {
        liked_by: newLikedBy,
        like_count: newLikeCount,
      },
      populate: { author: true, liked_by: true }
    });

    // Flatten dữ liệu trả về
    const { id, ...attributes } = updated;
    return ctx.send({
      status: 'success',
      data: {
        id,
        ...attributes,
        author: updated.author
          ? {
              id: updated.author.id,
              username: updated.author.username,
              email: updated.author.email,
              name: updated.author.name,
              photoUrl: updated.author.photoUrl,
              type_role: updated.author.type_role,
            }
          : null,
        liked_by: updated.liked_by
          ? updated.liked_by.map(user => ({
              id: user.id,
              username: user.username,
              name: user.name,
              photoUrl: user.photoUrl,
            }))
          : [],
      },
      message: 'OK',
    });
  },
}));
