module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('autoclear', async (ctx) => {
        if (ctx.chat.type === 'private') {
            return ctx.reply('⚠️ Lệnh này chỉ dùng được trong nhóm!');
        }

        const chatId = ctx.chat.id.toString();
        const fromId = ctx.from.id;

        try {
            const admins = await ctx.getChatAdministrators();
            const isAdmin = admins.some(admin => admin.user.id === fromId);
            const isAnonymous = ctx.message.sender_chat && ctx.message.sender_chat.id === ctx.chat.id;

            if (!isAdmin && !isAnonymous) {
                return ctx.replyWithHTML('⛔ Yêu cầu là <b>ADMIN</b> để sử dụng lệnh này!', { reply_to_message_id: ctx.message.message_id }).catch(() => {});
            }
        } catch (e) {
            return ctx.replyWithHTML('⛔ Yêu cầu là <b>ADMIN</b> để sử dụng lệnh này!', { reply_to_message_id: ctx.message.message_id }).catch(() => {});
        }

        ctx.deleteMessage().catch(() => {});

        const text = ctx.message.text || '';
        const args = text.split(/\s+/);
        const cmd = args[1] ? args[1].toLowerCase() : '';

        let db = loadDB();
        if (!db[chatId]) {
            db[chatId] = {
                active: false,
                text: '🎉 <b>CHÀO MỪNG THÀNH VIÊN MỚI!</b> 🎉\n\n🔥 Chào mừng {name} đã hạ cánh xuống Group.\n🎬 Chúc đại ca có những giây phút giải trí cực mạnh!',
                moderation: { warns: {}, muted: {} },
                autoclear: {
                    enabled: false,
                    interval: 3600
                }
            };
        }
        if (!db[chatId].moderation) {
            db[chatId].moderation = { warns: {}, muted: {} };
        }
        if (!db[chatId].autoclear) {
            db[chatId].autoclear = {
                enabled: false,
                interval: 3600
            };
        }

        if (cmd === 'on') {
            db[chatId].autoclear.enabled = true;
            saveDB(db);
            return ctx.replyWithHTML('✅ <b>ĐÃ BẬT</b> Auto Clear!');
        }

        if (cmd === 'off') {
            db[chatId].autoclear.enabled = false;
            saveDB(db);
            return ctx.replyWithHTML('🔴 <b>ĐÃ TẮT</b> Auto Clear!');
        }

        if (cmd === 'interval') {
            const seconds = parseInt(args[2], 10);
            if (isNaN(seconds) || seconds < 60) {
                return ctx.replyWithHTML('⚠️ Cách dùng: <code>/autoclear interval [giây]</code>');
            }
            db[chatId].autoclear.interval = seconds;
            saveDB(db);
            return ctx.replyWithHTML(`✅ Đã đặt interval Auto Clear là <b>${seconds} giây</b>!`);
        }

        const intervalText = Math.floor(db[chatId].autoclear.interval / 60);
        const status = db[chatId].autoclear.enabled ? '🟢 ĐANG BẬT' : '🔴 ĐANG TẮT';

        const helpText = `<blockquote><b>🧹 BẢNG ĐIỀU KHIỂN AUTO CLEAR</b>\n` +
            `Trạng thái: <b>${status}</b>\n〰️〰️〰️〰️〰️〰️\n` +
            `🟢 <code>/autoclear on</code> : Bật Auto Clear.\n` +
            `🔴 <code>/autoclear off</code> : Tắt Auto Clear.\n` +
            `⏱️ <code>/autoclear interval [giây]</code> : Đặt interval.\n\n` +
            `Interval hiện tại: <b>${intervalText} phút</b></blockquote>`;

        ctx.replyWithHTML(helpText);
    });
};
