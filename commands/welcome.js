module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('welcome', async (ctx) => {
        if (ctx.chat.type === 'private') {
            return ctx.replyWithHTML('⚠️ <b>Vui lòng thêm bot vào Group và gõ lệnh tại đó!</b>');
        }

        const chatId = ctx.chat.id.toString();
        const userId = ctx.from.id;

        try {
            const admins = await ctx.getChatAdministrators();
            const isAdmin = admins.some(admin => admin.user.id === userId);
            const isAnonymous = ctx.message.sender_chat && ctx.message.sender_chat.id === ctx.chat.id;

            if (!isAdmin && !isAnonymous) {
                return ctx.replyWithHTML('⛔ <b>Yêu cầu là ADMIN để sử dụng lệnh này!</b>', { reply_to_message_id: ctx.message.message_id }).catch(() => {});
            }
        } catch (e) {
            return ctx.replyWithHTML('⛔ <b>Yêu cầu là ADMIN để sử dụng lệnh này!</b>', { reply_to_message_id: ctx.message.message_id }).catch(() => {});
        }

        ctx.deleteMessage().catch(() => {});

        const text = ctx.message.text;
        const args = text.split(/\s+/);
        const cmd = args[1] ? args[1].toLowerCase() : "";
        const sub = args[2] ? args[2].toLowerCase() : "";

        let db = loadDB();
        if (!db[chatId]) {
            db[chatId] = {
                active: false,
                text: "🎉 <b>CHÀO MỪNG THÀNH VIÊN MỚI!</b> 🎉\n\n🔥 Chào mừng {name} đã hạ cánh xuống Group.\n🎬 Chúc đại ca có những giây phút giải trí cực mạnh!",
                captcha: {
                    enabled: false,
                    kickAfter: 300,
                    verified: {}
                }
            };
        }

        if (cmd === "on") {
            db[chatId].active = true;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ✅ ĐÃ BẬT WELCOME          <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Tự động chào mừng đã được kích hoạt! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === "off") {
            db[chatId].active = false;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🔴 ĐÃ TẮT WELCOME         <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Tự động chào mừng đã bị tắt! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === "captcha") {
            if (!db[chatId].captcha) {
                db[chatId].captcha = {
                    enabled: false,
                    kickAfter: 300,
                    verified: {}
                };
            }

            if (sub === "on") {
                db[chatId].captcha.enabled = true;
                saveDB(db);
                return ctx.replyWithHTML(
                    '<b>╔══════════════════════════════╗</b>\n' +
                    '<b>║</b>   ✅ BẬT CAPTCHA            <b>║</b>\n' +
                    '<b>╠══════════════════════════════╣</b>\n' +
                    '<b>║</b> Captcha kèm Welcome đã được bật! <b>║</b>\n' +
                    '<b>╚══════════════════════════════╝</b>'
                );
            }

            if (sub === "off") {
                db[chatId].captcha.enabled = false;
                saveDB(db);
                return ctx.replyWithHTML(
                    '<b>╔══════════════════════════════╗</b>\n' +
                    '<b>║</b>   🔴 TẮT CAPTCHA            <b>║</b>\n' +
                    '<b>╠══════════════════════════════╣</b>\n' +
                    '<b>║</b> Captcha kèm Welcome đã bị tắt! <b>║</b>\n' +
                    '<b>╚══════════════════════════════╝</b>'
                );
            }

            return ctx.replyWithHTML('⚠️ <b>Cách dùng:</b>\n<code>/welcome captcha on</code> hoặc <code>/welcome captcha off</code>');
        }

        if (cmd === "set") {
            const newText = text.substring(text.indexOf("set") + 3).trim();
            if (!newText) {
                return ctx.replyWithHTML('⚠️ <b>Thiếu nội dung!</b>\nVí dụ: <code>/welcome set Chào {name} nhé!</code>');
            }

            db[chatId].text = newText;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ✅ ĐÃ ĐỔI CÂU CHÀO        <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                `<b>║</b> Câu chào mới: <i>${newText}</i> <b>║</b>\n` +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        const statusStr = db[chatId].active ? "🟢 ĐANG BẬT" : "🔴 ĐANG TẮT";
        const captchaStatus = db[chatId].captcha && db[chatId].captcha.enabled ? "🟢 BẬT" : "🔴 TẮT";

        const helpText =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   ⚙️ BẢNG ĐIỀU KHIỂN LỄ TÂN  <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `<b>📌 Trạng thái:</b> <code>${statusStr}</code>\n` +
            `<b>🔐 Captcha:</b> <code>${captchaStatus}</code>\n` +
            '<b>═══ HƯỚNG DẪN ═══</b>\n' +
            '<code>/welcome on</code> - Bật máy\n' +
            '<code>/welcome off</code> - Tắt máy\n' +
            '<code>/welcome captcha on|off</code> - Bật/tắt captcha\n' +
            '<code>/welcome set [Nội dung]</code> - Đổi câu chào\n\n' +
            '<b>═══ CÂU CHÀO HIỆN TẠI ═══</b>\n' +
            `<i>${db[chatId].text}</i>\n\n` +
            '<b>╚══════════════════════════════╝</b>';

        ctx.replyWithHTML(helpText);
    });
};
