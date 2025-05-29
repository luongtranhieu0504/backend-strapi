'use strict';

const _ = require('lodash');
const { ApplicationError } = require('@strapi/utils').errors;
const { sanitize } = require('@strapi/utils');
const { getService } = require('@strapi/plugin-users-permissions/server/utils');

const sanitizeUser = (user, ctx) =>
  sanitize.contentAPI.output(user, strapi.getModel('plugin::users-permissions.user'), { auth: ctx.state.auth });

module.exports = (plugin) => {
  plugin.controllers.auth.register = async (ctx) => {
    // Lấy settings của plugin
    const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' });
    const settings = await pluginStore.get({ key: 'advanced' });

    if (!settings.allow_register) {
      throw new ApplicationError('Register action is currently disabled');
    }

    // Chỉ lấy các trường cần thiết
    const params = {
      ..._.pick(ctx.request.body, ['email', 'username', 'password', 'role']),
      provider: 'local',
    };

    const { email, username, role } = params;

    // Kiểm tra trùng email hoặc username
    const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
      where: { $or: [{ email }, { username }], provider: 'local' },
    });

    if (existingUser) {
      throw new ApplicationError('Email or Username is already taken');
    }

    // Tạo user mới
    const user = await getService('user').add({
      ...params,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      role: role,
    });

    // Nếu role = 5 → student, role = 6 → tutor
    if (role == 3) {
      await strapi.service('api::student.student').create({
        data: {
          email: user.email,
          user: user.id,
        },
      });
    } else if (role == 4) {
      await strapi.service('api::tutor.tutor').create({
        data: {
          email: user.email,
          user: user.id,
        },
      });
    }

    const sanitizedUser = await sanitizeUser(user, ctx);
    const jwt = getService('jwt').issue(_.pick(user, ['id']));

    return ctx.send({
      jwt,
      user: sanitizedUser,
    });
  };
  return plugin;
};