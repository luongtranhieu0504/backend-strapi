'use strict';

/**
 * message controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::message.message', ({ strapi }) => ({
  async flatByConversation(ctx) {
    const conversationId = ctx.query.conversationId;
    if (!conversationId) {
      ctx.status = 400;
      ctx.body = { status: 'error', data: null, message: 'Missing conversationId' };
      return;
    }

    // Lấy messages, populate sender/receiver
    const messages = await strapi.entityService.findMany('api::message.message', {
      filters: { conversation: conversationId },
      populate: { sender: true, receiver: true },
      sort: ['timestamp:asc'],
    });

    // Flatten response
    const flatMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      type: msg.type,
      timestamp: msg.timestamp,
      isRead: msg.isRead,
      imageUrl: msg.imageUrl,
      videoUrl: msg.videoUrl,
      fileUrl: msg.fileUrl,
      reactions: msg.reactions,
      schedule: msg.schedule,
      sender: msg.sender ? {
        id: msg.sender.id,
        username: msg.sender.username,
        email: msg.sender.email,
        // thêm các trường khác nếu cần
      } : null,
      receiver: msg.receiver ? {
        id: msg.receiver.id,
        username: msg.receiver.username,
        email: msg.receiver.email,
        // thêm các trường khác nếu cần
      } : null,
    }));

    ctx.body = {
      status: 'success',
      data: flatMessages,
      message: 'OK',
    };
  },
}));
