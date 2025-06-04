module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/messages/flat',
      handler: 'message.flatByConversation',
      config: {
        policies: [],
      },
    },
  ],
};