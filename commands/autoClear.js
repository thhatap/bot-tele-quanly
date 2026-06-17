module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('autoclear', async (ctx) => {
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
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ✅ BẬT AUTO CLEAR       <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Auto Clear đã được kích hoạt! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === 'off') {
            db[chatId].autoclear.enabled = false;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🔴 TẮT AUTO CLEAR      <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Auto Clear đã bị tắt! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === 'interval') {
            const seconds = parseInt(args[2], 10);
            if (isNaN(seconds) || seconds < 60) {
                return ctx.replyWithHTML('⚠️ <b>Cách dùng:</b> <code>/autoclear interval [giây]</code>');
            }
            db[chatId].autoclear.interval = seconds;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ⏱️ ĐẶT INTERVAL        <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                `<b>║</b> Interval mới: <code>${seconds} giây</code> <b>║</b>\n` +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        const intervalText = Math.floor(db[chatId].autoclear.interval / 60);
        const status = db[chatId].autoclear.enabled ? '🟢 BẬT' : '🔴 TẮT';

        const helpText =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   🧹 BẢNG ĐIỀU KHIỂN AUTO CLEAR <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `<b>📌 Trạng thái:</b> <code>${status}</code>\n\n` +
            '<b>═══ HƯỚNG DẪN ═══</b>\n' +
            '<code>/autoclear on</code> - Bật Auto Clear\n' +
            '<code>/autoclear off</code> - Tắt Auto Clear\n' +
            '<code>/autoclear interval [giây]</code> - Đặt interval\n\n' +
            `<b>═══ CẤU HÌNH HIỆN TẠI ═══</b>\n` +
            `<b>• Interval:</b> <code>${intervalText} phút</code>\n\n` +
            '<b>╚══════════════════════════════╝</b>';

        ctx.replyWithHTML(helpText);
    });
};
