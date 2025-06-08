module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/conversations/find-or-create',
      handler: 'conversation.findOrCreate',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/my-conversations',
      handler: 'conversation.listByUser',
      config: {
        policies: [],
      },
    },
  ],
};