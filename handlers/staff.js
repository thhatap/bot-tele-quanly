module.exports = (bot, { loadDB }) => {
    bot.on('message', async (ctx) => {
        const text = (ctx.message.text || '').trim();
        if (!text || ctx.chat.type === 'private') return;

        const chatId = ctx.chat.id.toString();
        const userId = ctx.from.id;

        if (!text.toLowerCase().includes('@admin') && !text.toLowerCase().includes('@staff')) {
            return;
        }

        try {
            const admins = await ctx.getChatAdministrators();
            const isAdmin = admins.some(admin => admin.user.id === userId);

            if (isAdmin) return;

            const userMention = `<a href="tg://user?id=${userId}">${ctx.from.first_name || 'Thành viên'}</a>`;

            const adminMentions = admins
                .filter(a => !a.isAnonymous && !a.user.is_bot)
                .map(a => `<a href="tg://user?id=${a.user.id}>${a.user.first_name || 'Admin'}</a>`)
                .join(' ');

            if (!adminMentions) return;

            const alertText =
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🚨 YÊU CẦU HỖ TRỢ      <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n\n' +
                `${userMention} đang cần Admin giúp!\n\n` +
                `<b>👮 Đã gọi:</b> ${adminMentions}\n\n` +
                '<b>╚══════════════════════════════╝</b>';

            await ctx.replyWithHTML(alertText, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '📍 Xem tin nhắn', url: `https://t.me/c/${chatId.replace('-100', '')}/${ctx.message.message_id}` }
                        ]
                    ]
                }
            });

        } catch (e) {
            console.error('Staff handler error:', e.message);
        }
    });
};
