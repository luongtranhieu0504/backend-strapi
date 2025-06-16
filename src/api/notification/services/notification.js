'use strict';

const axios = require('axios');

module.exports = {
  /**
   * Gửi notification và lưu vào DB
   * @param {Object} params
   * @param {string} params.type - Loại notify (schedule, review, post, ...)
   * @param {string} params.title - Tiêu đề notify
   * @param {string} params.content - Nội dung notify
   * @param {number} params.fromUserId - ID người gửi
   * @param {number} params.toUserId - ID người nhận
   * @param {number} params.entityId - ID entity liên quan (schedule, review, ...)
   * @param {Object} [params.extraData] - Dữ liệu bổ sung gửi lên app
   */
  async send({ type, title, content, fromUserId, toUserId, entityId, extraData }) {
    // 1. Lưu vào DB notification
    await strapi.entityService.create('api::notification.notification', {
      data: {
        type,
        title,
        content,
        from_user: fromUserId,
        to_user: toUserId,
        entity_id: entityId,
        is_read: false,
      }
    });

    // 2. Lấy fcmToken của user nhận
    const user = await strapi.entityService.findOne('plugin::users-permissions.user', toUserId, {
      fields: ['id', 'username', 'fcmToken'], // Thêm 'fcmToken' vào fields
    });
    const fcmToken = user?.fcmToken;
    console.log('Notify to user:', toUserId, 'FCM Token:', fcmToken);
    // 3. Gọi Cloud Function gửi push notify
    if (fcmToken) {
      await axios.post('https://us-central1-tutorconnect-1afc7.cloudfunctions.net/sendAppNotification', {
        fcmToken,
        title,
        body: content,
        data: {
          type,
          entityId: String(entityId),
          ...extraData
        }
      });
    }
  }
};
