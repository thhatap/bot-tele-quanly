module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('mute', async (ctx) => {
        if (ctx.chat.type === 'private') {
            return ctx.replyWithHTML('⚠️ <b>Lệnh này chỉ dùng được trong nhóm!</b>');
        }

        const chatId = ctx.chat.id.toString();
        const fromId = ctx.from.id;

        try {
            const admins = await ctx.getChatAdministrators();
            const isAdmin = admins.some(admin => admin.user.id === fromId);
            const isAnonymous = ctx.message.sender_chat && ctx.message.sender_chat.id === ctx.chat.id;
            if (!isAdmin && !isAnonymous) {
                return ctx.replyWithHTML('⛔ <b>Yêu cầu là ADMIN để sử dụng lệnh này!</b>', { reply_to_message_id: ctx.message.message_id }).catch(() => {});
            }
        } catch (e) {
            return ctx.replyWithHTML('⛔ <b>Yêu cầu là ADMIN để sử dụng lệnh này!</b>', { reply_to_message_id: ctx.message.message_id }).catch(() => {});
        }

        let targetUserId = null;
        let targetUserName = null;

        if (ctx.message.reply_to_message) {
            targetUserId = ctx.message.reply_to_message.from.id;
            targetUserName = ctx.message.reply_to_message.from.first_name || ctx.message.reply_to_message.from.username || 'Người dùng';
        } else {
            const text = ctx.message.text || '';
            const userIdMatch = text.match(/\[id(\d+)\]/);
            if (userIdMatch) {
                targetUserId = parseInt(userIdMatch[1]);
                targetUserName = `ID: ${targetUserId}`;
            } else {
                return ctx.replyWithHTML(
                    '<b>╔══════════════════════════════╗</b>\n' +
                    '<b>║</b>   ⚠️ CÁCH SỬ DỤNG LỆNH     <b>║</b>\n' +
                    '<b>╠══════════════════════════════╣</b>\n' +
                    '<b>║</b> <code>/mute</code> (reply tin nhắn) <b>║</b>\n' +
                    '<b>║</b> <code>/mute [user_id]</code> <b>║</b>\n' +
                    '<b>╚══════════════════════════════╝</b>'
                );
            }
        }

        if (targetUserId === fromId) {
            return ctx.replyWithHTML('⚠️ <b>Bạn không thể tự mute chính mình!</b>');
        }

        let db = loadDB();
        if (!db[chatId]) {
            db[chatId] = {
                active: false,
                text: '🎉 <b>CHÀO MỪNG THÀNH VIÊN MỚI!</b> 🎉\n\n🔥 Chào mừng {name} đã hạ cánh xuống Group.\n🎬 Chúc đại ca có những giây phút giải trí cực mạnh!',
                moderation: { warns: {}, muted: {} }
            };
        }
        if (!db[chatId].moderation) {
            db[chatId].moderation = { warns: {}, muted: {} };
        }
        if (!db[chatId].moderation.muted) {
            db[chatId].moderation.muted = {};
        }

        try {
            await ctx.telegram.restrictChatMember(chatId, targetUserId, {
                can_send_messages: false,
                can_send_media_messages: false,
                can_send_polls: false,
                can_send_other_messages: false,
                can_add_web_page_previews: false
            });
            db[chatId].moderation.muted[targetUserId] = true;
            saveDB(db);
            const userMention = `<a href="tg://user?id=${targetUserId}">${targetUserName}</a>`;
            await ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🔇 ĐÃ MUTE               <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n\n' +
                `<b>👤 Người dùng:</b> ${userMention}\n` +
                '<b>⏱️ Thời gian:</b> <code>VĨNH VIỄN</code>\n\n' +
                '<b>╚══════════════════════════════╝</b>',
                {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '🔊 Gỡ Mute', callback_data: `unmute:${chatId}:${targetUserId}` }
                        ]]
                    }
                }
            );
        } catch (e) {
            console.error('Mute error:', e.message);
            await ctx.replyWithHTML('❌ <b>Không thể mute người dùng này.</b>\nKiểm tra lại quyền của bot!');
        }
    });

    bot.command('unmute', async (ctx) => {
        if (ctx.chat.type === 'private') {
            return ctx.replyWithHTML('⚠️ <b>Lệnh này chỉ dùng được trong nhóm!</b>');
        }

        const chatId = ctx.chat.id.toString();
        const fromId = ctx.from.id;

        try {
            const admins = await ctx.getChatAdministrators();
            const isAdmin = admins.some(admin => admin.user.id === fromId);
            const isAnonymous = ctx.message.sender_chat && ctx.message.sender_chat.id === ctx.chat.id;
            if (!isAdmin && !isAnonymous) {
                return ctx.replyWithHTML('⛔ <b>Yêu cầu là ADMIN để sử dụng lệnh này!</b>', { reply_to_message_id: ctx.message.message_id }).catch(() => {});
            }
        } catch (e) {
            return ctx.replyWithHTML('⛔ <b>Yêu cầu là ADMIN để sử dụng lệnh này!</b>', { reply_to_message_id: ctx.message.message_id }).catch(() => {});
        }

        let targetUserId = null;
        let targetUserName = null;

        if (ctx.message.reply_to_message) {
            targetUserId = ctx.message.reply_to_message.from.id;
            targetUserName = ctx.message.reply_to_message.from.first_name || ctx.message.reply_to_message.from.username || 'Người dùng';
        } else {
            const text = ctx.message.text || '';
            const userIdMatch = text.match(/\[id(\d+)\]/);
            if (userIdMatch) {
                targetUserId = parseInt(userIdMatch[1]);
                targetUserName = `ID: ${targetUserId}`;
            } else {
                return ctx.replyWithHTML(
                    '<b>╔══════════════════════════════╗</b>\n' +
                    '<b>║</b>   ⚠️ CÁCH SỬ DỤNG LỆNH     <b>║</b>\n' +
                    '<b>╠══════════════════════════════╣</b>\n' +
                    '<b>║</b> <code>/unmute</code> (reply tin nhắn) <b>║</b>\n' +
                    '<b>║</b> <code>/unmute [user_id]</code> <b>║</b>\n' +
                    '<b>╚══════════════════════════════╝</b>'
                );
            }
        }

        let db = loadDB();
        if (!db[chatId]) {
            db[chatId] = {
                active: false,
                text: '🎉 <b>CHÀO MỪNG THÀNH VIÊN MỚI!</b> 🎉\n\n🔥 Chào mừng {name} đã hạ cánh xuống Group.\n🎬 Chúc đại ca có những giây phút giải trí cực mạnh!',
                moderation: { warns: {}, muted: {} }
            };
        }
        if (!db[chatId].moderation) {
            db[chatId].moderation = { warns: {}, muted: {} };
        }
        if (!db[chatId].moderation.muted) {
            db[chatId].moderation.muted = {};
        }

        try {
            await ctx.telegram.restrictChatMember(chatId, targetUserId, {
                can_send_messages: true,
                can_send_media_messages: true,
                can_send_polls: true,
                can_send_other_messages: true,
                can_add_web_page_previews: true
            });
            if (db[chatId].moderation.muted[targetUserId]) {
                delete db[chatId].moderation.muted[targetUserId];
                saveDB(db);
            }
            const userMention = `<a href="tg://user?id=${targetUserId}">${targetUserName}</a>`;
            await ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🔊 ĐÃ GỠ MUTE            <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n\n' +
                `<b>👤 Người dùng:</b> ${userMention}\n` +
                '<b>✅ Trạng thái:</b> <code>Đã được gỡ mute</code>\n\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        } catch (e) {
            console.error('Unmute error:', e.message);
            await ctx.replyWithHTML('❌ <b>Không thể gỡ mute người dùng này.</b>\nKiểm tra lại quyền của bot!');
        }
    });
};
