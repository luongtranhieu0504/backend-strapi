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
      path: '/conversations/list',
      handler: 'conversation.listByUser',
      config: {
        policies: [],
      },
    },
  ],
};