module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('captcha', async (ctx) => {
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
                return ctx.deleteMessage().catch(() => {});
            }
        } catch (e) {
            return ctx.replyWithHTML('⚠️ <b>Bot cần quyền Admin để sử dụng lệnh này!</b>');
        }

        ctx.deleteMessage().catch(() => {});

        let db = loadDB();
        if (!db[chatId]) {
            db[chatId] = {
                active: false,
                text: '🎉 <b>CHÀO MỪNG THÀNH VIÊN MỚI!</b> 🎉\n\n🔥 Chào mừng {name} đã hạ cánh xuống Group.\n🎬 Chúc đại ca có những giây phút giải trí cực mạnh!',
                moderation: { warns: {}, muted: {} },
                captcha: {
                    enabled: false,
                    kickAfter: 300,
                    verified: {}
                }
            };
        }
        if (!db[chatId].moderation) {
            db[chatId].moderation = { warns: {}, muted: {} };
        }
        if (!db[chatId].captcha) {
            db[chatId].captcha = {
                enabled: false,
                kickAfter: 300,
                verified: {}
            };
        }

        const text = ctx.message.text || '';
        const args = text.split(/\s+/);
        const cmd = args[1] ? args[1].toLowerCase() : '';

        if (cmd === 'on') {
            db[chatId].captcha.enabled = true;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ✅ BẬT CAPTCHA           <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Captcha / Anti-Bot đã được kích hoạt! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === 'off') {
            db[chatId].captcha.enabled = false;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🔴 TẮT CAPTCHA          <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Captcha / Anti-Bot đã bị tắt! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === 'time') {
            const minutes = parseInt(args[2], 10);
            if (isNaN(minutes) || minutes < 1) {
                return ctx.replyWithHTML('⚠️ <b>Cách dùng:</b> <code>/captcha time [phút]</code>');
            }
            db[chatId].captcha.kickAfter = minutes * 60;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ⏱️ ĐẶT THỜI GIAN        <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                `<b>║</b> Thời gian xác minh: <code>${minutes} phút</code> <b>║</b>\n` +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === 'reset') {
            db[chatId].captcha.verified = {};
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🔄 RESET CAPTCHA         <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Đã reset danh sách đã xác minh! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        const status = db[chatId].captcha.enabled ? '🟢 BẬT' : '🔴 TẮT';
        const timeText = Math.floor(db[chatId].captcha.kickAfter / 60);

        const helpText =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   🔐 BẢNG ĐIỀU KHIỂN CAPTCHA <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `<b>📌 Trạng thái:</b> <code>${status}</code>\n\n` +
            '<b>═══ HƯỚNG DẪN ═══</b>\n' +
            '<code>/captcha on</code> - Bật Captcha\n' +
            '<code>/captcha off</code> - Tắt Captcha\n' +
            '<code>/captcha time [phút]</code> - Thời gian xác minh\n' +
            '<code>/captcha reset</code> - Reset danh sách đã xác minh\n\n' +
            `<b>═══ CẤU HÌNH HIỆN TẠI ═══</b>\n` +
            `<b>• Thời gian xác minh:</b> <code>${timeText} phút</code>\n\n` +
            '<b>╚══════════════════════════════╝</b>';

        ctx.replyWithHTML(helpText);
    });
};
