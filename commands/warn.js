module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('warn', async (ctx) => {
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
        let reason = 'Không có lý do';

        if (ctx.message.reply_to_message) {
            targetUserId = ctx.message.reply_to_message.from.id;
            targetUserName = ctx.message.reply_to_message.from.first_name || ctx.message.reply_to_message.from.username || 'Người dùng';
            const args = ctx.message.text.split(/\s+/);
            if (args[1]) {
                reason = ctx.message.text.substring(ctx.message.text.indexOf(args[1])).trim();
            }
        } else {
            const text = ctx.message.text || '';
            const userIdMatch = text.match(/\[id(\d+)\]/);
            if (userIdMatch) {
                targetUserId = parseInt(userIdMatch[1]);
                targetUserName = `ID: ${targetUserId}`;
                reason = text.substring(text.indexOf(userIdMatch[0]) + userIdMatch[0].length).trim() || 'Không có lý do';
            } else {
                return ctx.replyWithHTML(
                    '<b>╔══════════════════════════════╗</b>\n' +
                    '<b>║</b>   ⚠️ CÁCH SỬ DỤNG LỆNH     <b>║</b>\n' +
                    '<b>╠══════════════════════════════╣</b>\n' +
                    '<b>║</b> <code>/warn</code> (reply tin nhắn) [lý do] <b>║</b>\n' +
                    '<b>║</b> <code>/warn</code> [user_id] [lý do] <b>║</b>\n' +
                    '<b>╚══════════════════════════════╝</b>'
                );
            }
        }

        if (targetUserId === ctx.from.id) {
            return ctx.replyWithHTML('⚠️ <b>Bạn không thể tự warn chính mình!</b>');
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
        if (!db[chatId].moderation.warns) {
            db[chatId].moderation.warns = {};
        }
        if (!db[chatId].moderation.muted) {
            db[chatId].moderation.muted = {};
        }

        if (!db[chatId].moderation.warns[targetUserId]) {
            db[chatId].moderation.warns[targetUserId] = [];
        }

        const warnCount = db[chatId].moderation.warns[targetUserId].length;
        const warnData = {
            reason,
            by: fromId,
            at: Date.now()
        };
        db[chatId].moderation.warns[targetUserId].push(warnData);

        let autoMuted = false;
        if (warnCount + 1 >= 3) {
            try {
                await ctx.telegram.restrictChatMember(chatId, targetUserId, {
                    can_send_messages: false,
                    can_send_media_messages: false,
                    can_send_polls: false,
                    can_send_other_messages: false,
                    can_add_web_page_previews: false
                });
                db[chatId].moderation.muted[targetUserId] = true;
                autoMuted = true;
            } catch (e) {
                console.error('Auto mute error:', e.message);
            }
        }

        saveDB(db);

        const userMention = `<a href="tg://user?id=${targetUserId}">${targetUserName}</a>`;
        const warnMsg =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   ⚠️ CẢNH CÁO (WARN)       <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `<b>👤 Người dùng:</b> ${userMention}\n` +
            `<b>📝 Lý do:</b> <i>${reason}</i>\n` +
            `<b>🔢 Số warn:</b> <code>${warnCount + 1}/3</code>\n\n` +
            '<b>╚══════════════════════════════╝</b>';

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '✅ Gỡ Warn', callback_data: `unwarn:${chatId}:${targetUserId}` },
                    { text: '🔇 Mute Vĩnh Viễn', callback_data: `mute:${chatId}:${targetUserId}` }
                ]
            ]
        };

        await ctx.replyWithHTML(warnMsg, { reply_markup: keyboard });

        if (autoMuted) {
            await ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🔇 ĐÃ MUTE VĨNH VIỄN     <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n\n' +
                `${userMention} đã bị mute vì đạt 3 warns!\n\n` +
                '<b>╚══════════════════════════════╝</b>'
            );
        }
    });
};
