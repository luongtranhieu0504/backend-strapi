module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/students/me',
      handler: 'student.me',
      config: {
        policies: [],
      },
    },
    {
      method: 'PUT',
      path: '/students/:id/update-favorites',
      handler: 'student.updateFavorites',
      config: {
        policies: [],
      },
    },
  ],
};