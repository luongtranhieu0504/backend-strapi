'use strict';

module.exports = {
  async saveFcmToken(ctx) {
    const { userId, fcmToken } = ctx.request.body;
    if (!userId || !fcmToken) {
      ctx.status = 400;
      ctx.body = { message: 'Missing userId or fcmToken' };
      return;
    }
    await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: userId },
      data: { fcmToken },
    });
    ctx.body = { message: 'FCM token saved' };
  }
};