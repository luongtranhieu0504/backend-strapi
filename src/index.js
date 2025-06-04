'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    const httpServer = strapi.server.httpServer;
    const { Server } = require('socket.io');
    const io = new Server(httpServer, {
      cors: {
        origin: '*', // Đổi thành domain frontend khi production
        methods: ['GET', 'POST'],
      },
    });

    // Lưu io vào strapi để dùng ở controller nếu cần
    strapi.io = io;

    io.on('connection', (socket) => {
      // Join room theo conversationId
      socket.on('join', (conversationId) => {
        socket.join(`conversation_${conversationId}`);
      });

      // Nhận message và broadcast cho room
      socket.on('message', (data) => {
        // data: { conversationId, message }
        io.to(`conversation_${data.conversationId}`).emit('message', data.message);
      });

      socket.on('disconnect', () => {
        // handle disconnect nếu cần
      });
    });

    strapi.log.info('Socket.IO server started!');
  },
};
