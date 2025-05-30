module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/tutors/flattened',
      handler: 'tutor.flattened',
      config: {
        policies: [],
      },
    },
  ],
};