module.exports = {
  routes: [
    {
      method: 'PUT',
      path: '/posts/:id/like',
      handler: 'post.like',
      config: {
        policies: [],
      },
    },
  ],
};