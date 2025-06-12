'use strict';



const axios = require('axios');

async function sendFCMNotification(token, title, body, data = {}) {
  try {
    await axios.post('https://us-central1-tutorconnect-1afc7.cloudfunctions.net/sendChatNotification', {
      fcmToken: token, // truyền trực tiếp fcmToken
      senderId: data.senderId,     // id của user gửi
      conversationId: data.conversationId,
      content: body,
      senderName: title,
      type: data.type || 'text'
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
  if (!data?.conversationId || !data?.message) {
    console.error('⚠️ Invalid message payload:', data);
    return;
  }

  const message = data.message;
  const room = `conversation_${data.conversationId}`;
  console.log(`Emit message to room ${room}:`, message);
  io.to(room).emit('message', message);

  // FCM logic
  try {
    const receiverId = message.receiver?.id;
    if (!receiverId) {
      console.error('⚠️ No receiver ID found in message:', message);
      return;
    }

    const receiver = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: receiverId },
      select: ['fcmToken', 'name'],
    });

    console.log('Receiver fetched from DB:', receiver);

    if (receiver?.fcmToken) {
      await sendFCMNotification(
        receiver.fcmToken,
        message.sender?.name || 'Tin nhắn mới',
        message.content || 'Bạn có tin nhắn mới',
        {
          senderId: String(message.sender?.id),
          conversationId: String(data.conversationId),
          type: message.type || 'text',
        }
      );
    } else {
      console.warn('⚠️ Receiver has no fcmToken, notification skipped');
    }
  } catch (err) {
    strapi.log.error('FCM notify error:', err.message || err);
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
