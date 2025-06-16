'use strict';



const axios = require('axios');

async function sendFCMNotification(token, title, body, data = {}) {
  try {
    await axios.post('https://us-central1-tutorconnect-1afc7.cloudfunctions.net/sendChatNotification', {
      fcmToken: token, // truyền trực tiếp fcmToken
      senderId: data.senderId,     // id của user gửi
      conversation: data.conversation,
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
    const cron = require('node-cron');
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
                conversation: message.conversation, // truyền object conversation
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

    cron.schedule('0 0 * * *', async () => {
      const today = new Date();
      const todayWeekday = today.getDay(); // 0=CN, 1=Thứ 2, ..., 6=Thứ 7
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      // Lấy các schedule còn hiệu lực
      const schedules = await strapi.entityService.findMany('api::schedule.schedule', {
        filters: {
          status: 'approved',
          start_date: { $lte: todayStr }
        },
        populate: {
          tutor: { populate: { user: true } },
          student: { populate: { user: true } },
          slots: true,
        }
      });

      for (const schedule of schedules) {
        for (const slot of schedule.slots) {
          if (slot.weekday === todayWeekday) {
            // Tính giờ nhắc (trước start_time 30 phút)
            const [hour, minute] = slot.start_time.split(':').map(Number);
            const remindDate = new Date(today);
            remindDate.setHours(hour, minute - 30, 0, 0);

            // Nếu giờ nhắc còn ở tương lai (tránh gửi lại nếu đã quá giờ)
            if (remindDate > new Date()) {
              // Gọi Cloud Function để gửi notify
              await axios.post('https://us-central1-tutorconnect-1afc7.cloudfunctions.net/remindSchedule', {
                scheduleId: schedule.id,
                topic: schedule.topic,
                address: schedule.address,
                startDate: todayStr + 'T' + slot.start_time,
                slot,
                tutor: {
                  id: schedule.tutor?.id,
                  name: schedule.tutor?.user?.name,
                  fcmToken: schedule.tutor?.user?.fcmToken,
                },
                student: {
                  id: schedule.student?.id,
                  name: schedule.student?.user?.name,
                  fcmToken: schedule.student?.user?.fcmToken,
                }
              });
            }
          }
        }
      }
      strapi.log.info(`[CRON] Đã gửi nhắc lịch học cho các buổi học hôm nay`);
    });
  },

};
