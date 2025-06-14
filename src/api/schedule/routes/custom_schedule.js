module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/my-schedules',
      handler: 'schedule.flatList',
      config: {
        policies: [],
      },
    },
  ],
};