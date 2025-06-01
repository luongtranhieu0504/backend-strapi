module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/reviews/flat',
      handler: 'review.flatByTutor',
      config: {
        policies: [],
      },
    },
  ],
};