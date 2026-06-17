module.exports = (bot, { loadDB }) => {
    bot.command('staff', async (ctx) => {
        if (ctx.chat.type === 'private') {
            return ctx.replyWithHTML('⚠️ <b>Lệnh này chỉ dùng được trong nhóm!</b>');
        }

        const chatId = ctx.chat.id.toString();
        const userId = ctx.from.id;

        try {
            const admins = await ctx.getChatAdministrators();
            const isAdmin = admins.some(admin => admin.user.id === userId);

            if (isAdmin) {
                return ctx.replyWithHTML('⚠️ <b>Mày đã là Admin rồi, gọi cái gì nữa?</b>');
            }

            ctx.deleteMessage().catch(() => {});

            const userMention = `<a href="tg://user?id=${userId}">${ctx.from.first_name || 'Thành viên'}</a>`;
            const messageText = ctx.message.text.replace('/staff', '').trim();

            const adminMentions = admins
                .filter(a => !a.isAnonymous && !a.user.is_bot)
                .map(a => `<a href="tg://user?id=${a.user.id}>${a.user.first_name || 'Admin'}</a>`)
                .join(' ');

            if (!adminMentions) {
                return ctx.replyWithHTML('⚠️ <b>Không tìm thấy Admin nào trong nhóm!</b>');
            }

            const alertText =
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🚨 YÊU CẦU HỖ TRỢ         <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n\n' +
                `${userMention} đang cần Admin giúp!\n\n` +
                `📌 <i>"${messageText || 'Không có nội dung'}"</i>\n\n` +
                `<b>👮 Đã gọi:</b> ${adminMentions}\n\n` +
                '<b>╚══════════════════════════════╝</b>';

            const sent = await ctx.replyWithHTML(alertText, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '📍 Xem tin nhắn', url: `https://t.me/c/${chatId.replace('-100', '')}/${ctx.message.message_id}` }
                        ]
                    ]
                }
            });

            setTimeout(() => {
                ctx.deleteMessage(sent.message_id).catch(() => {});
            }, 3000);

        } catch (e) {
            console.error('Staff command error:', e.message);
            return ctx.replyWithHTML('⚠️ <b>Không thể gọi Admin lúc này!</b>');
        }
    });

    bot.command('admin', async (ctx) => {
        if (ctx.chat.type === 'private') {
            return ctx.replyWithHTML('⚠️ <b>Lệnh này chỉ dùng được trong nhóm!</b>');
        }

        const chatId = ctx.chat.id.toString();
        const userId = ctx.from.id;

        try {
            const admins = await ctx.getChatAdministrators();
            const isAdmin = admins.some(admin => admin.user.id === userId);

            if (isAdmin) {
                return ctx.replyWithHTML('⚠️ <b>Mày đã là Admin rồi, gọi cái gì nữa?</b>');
            }

            ctx.deleteMessage().catch(() => {});

            const userMention = `<a href="tg://user?id=${userId}">${ctx.from.first_name || 'Thành viên'}</a>`;
            const messageText = ctx.message.text.replace('/admin', '').trim();

            const adminMentions = admins
                .filter(a => !a.isAnonymous && !a.user.is_bot)
                .map(a => `<a href="tg://user?id=${a.user.id}>${a.user.first_name || 'Admin'}</a>`)
                .join(' ');

            if (!adminMentions) {
                return ctx.replyWithHTML('⚠️ <b>Không tìm thấy Admin nào trong nhóm!</b>');
            }

            const alertText =
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🚨 YÊU CẦU HỖ TRỢ         <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n\n' +
                `${userMention} đang cần Admin giúp!\n\n` +
                `📌 <i>"${messageText || 'Không có nội dung'}"</i>\n\n` +
                `<b>👮 Đã gọi:</b> ${adminMentions}\n\n` +
                '<b>╚══════════════════════════════╝</b>';

            const sent = await ctx.replyWithHTML(alertText, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '📍 Xem tin nhắn', url: `https://t.me/c/${chatId.replace('-100', '')}/${ctx.message.message_id}` }
                        ]
                    ]
                }
            });

            setTimeout(() => {
                ctx.deleteMessage(sent.message_id).catch(() => {});
            }, 3000);

        } catch (e) {
            console.error('Admin command error:', e.message);
            return ctx.replyWithHTML('⚠️ <b>Không thể gọi Admin lúc này!</b>');
        }
    });
};
