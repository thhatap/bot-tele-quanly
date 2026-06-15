module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('captcha', async (ctx) => {
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
                return ctx.deleteMessage().catch(() => {});
            }
        } catch (e) {
            return ctx.reply('⚠️ Bot cần quyền Admin để sử dụng lệnh này!');
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
            return ctx.replyWithHTML('✅ <b>ĐÃ BẬT</b> Captcha / Anti-Bot!');
        }

        if (cmd === 'off') {
            db[chatId].captcha.enabled = false;
            saveDB(db);
            return ctx.replyWithHTML('🔴 <b>ĐÃ TẮT</b> Captcha / Anti-Bot!');
        }

        if (cmd === 'time') {
            const minutes = parseInt(args[2], 10);
            if (isNaN(minutes) || minutes < 1) {
                return ctx.replyWithHTML('⚠️ Cách dùng: <code>/captcha time [phút]</code>');
            }
            db[chatId].captcha.kickAfter = minutes * 60;
            saveDB(db);
            return ctx.replyWithHTML(`✅ Đã đặt thời gian xác minh là <b>${minutes} phút</b>!`);
        }

        if (cmd === 'reset') {
            db[chatId].captcha.verified = {};
            saveDB(db);
            return ctx.replyWithHTML('✅ Đã <b>RESET</b> danh sách đã xác minh!');
        }

        const status = db[chatId].captcha.enabled ? '🟢 ĐANG BẬT' : '🔴 ĐANG TẮT';
        const timeText = Math.floor(db[chatId].captcha.kickAfter / 60);

        const helpText = `<blockquote><b>🔐 BẢNG ĐIỀU KHIỂN CAPTCHA / ANTI-BOT</b>\n` +
            `Trạng thái: <b>${status}</b>\n〰️〰️〰️〰️〰️〰️\n` +
            `🟢 <code>/captcha on</code> : Bật Captcha.\n` +
            `🔴 <code>/captcha off</code> : Tắt Captcha.\n` +
            `⏱️ <code>/captcha time [phút]</code> : Thời gian xác minh.\n` +
            `🔄 <code>/captcha reset</code> : Reset danh sách đã xác minh.\n\n` +
            `Cấu hình hiện tại:\n` +
            `- Thời gian xác minh: <b>${timeText} phút</b></blockquote>`;

        ctx.replyWithHTML(helpText);
    });
};
