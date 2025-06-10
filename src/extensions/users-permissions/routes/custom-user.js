module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/user/save-fcm-token',
      handler: 'user.saveFcmToken',
      config: {
        policies: [],
      },
    },
  ],
};