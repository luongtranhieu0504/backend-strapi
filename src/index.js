'use strict';



const axios = require('axios');

async function sendFCMNotification(token, title, body, data = {}) {
  try {
    await axios.post('https://us-central1-tutorconnect-1afc7.cloudfunctions.net/sendChatNotification', {
      to: token,
      notification: { title, body },
      data,
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (err) {
    console.error('Send FCM error:', err.response?.data || err.message);
  }
}

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
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    strapi.io = io;

    io.on('connection', (socket) => {
      console.log(`User ${socket.id} connected`);
      socket.on('join', (conversationId) => {
        console.log(`User ${socket.id} joined room conversation_${conversationId}`);
        socket.join(`conversation_${conversationId}`);
      });

      socket.on('message', async (data) => {
        // data: { conversationId, message }
        console.log(`Emit message to room conversation_${data.conversationId}:`, data.message);
        io.to(`conversation_${data.conversationId}`).emit('message', data.message);

        // Gửi notify qua FCM cho receiver nếu cần
        try {
          const message = data.message;
          const receiverId = message.receiver?.id || message.receiver;
          // Lấy user receiver từ DB
          const receiver = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { id: receiverId },
            select: ['fcmToken', 'name'],
          });

          // Nếu có fcmToken thì gửi notify
          if (receiver && receiver.fcmToken) {
            await sendFCMNotification(
              receiver.fcmToken,
              `Tin nhắn mới từ ${message.sender?.name || 'ai đó'}`,
              message.content || 'Bạn có tin nhắn mới',
              {
                conversationId: data.conversationId,
                senderId: message.sender?.id,
              }
            );
          }
        } catch (err) {
          strapi.log.error('FCM notify error:', err);
        }
      });

      socket.on('disconnect', () => {
        // handle disconnect nếu cần
        console.log(`User ${socket.id} disconnected`);
      });
    });

    strapi.log.info('Socket.IO server started!');
  },
};
