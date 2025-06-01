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
    {
      method: 'GET',
      path: '/tutors/me',
      handler: 'tutor.me',
      config: {
        policies: [],
      },
    },
  ],
};