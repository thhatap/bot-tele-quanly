module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('welcome', async (ctx) => {
        if (ctx.chat.type === 'private') {
            return ctx.reply("⚠️ Vui lòng thêm bot vào Group và gõ lệnh tại đó!");
        }

        const chatId = ctx.chat.id.toString();
        const userId = ctx.from.id;

        try {
            const admins = await ctx.getChatAdministrators();
            const isAdmin = admins.some(admin => admin.user.id === userId);
            const isAnonymous = ctx.message.sender_chat && ctx.message.sender_chat.id === ctx.chat.id;

            if (!isAdmin && !isAnonymous) {
                return ctx.replyWithHTML('⛔ Yêu cầu là <b>ADMIN</b> để sử dụng lệnh này!', { reply_to_message_id: ctx.message.message_id }).catch(() => {});
            }
        } catch (e) {
            return ctx.replyWithHTML('⛔ Yêu cầu là <b>ADMIN</b> để sử dụng lệnh này!', { reply_to_message_id: ctx.message.message_id }).catch(() => {});
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
            return ctx.replyWithHTML("✅ <b>ĐÃ BẬT</b> tự động Chào mừng!");
        }

        if (cmd === "off") {
            db[chatId].active = false;
            saveDB(db);
            return ctx.replyWithHTML("🔴 <b>ĐÃ TẮT</b> tự động Chào mừng!");
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
                return ctx.replyWithHTML("✅ Đã bật <b>Captcha kèm Welcome</b>!");
            }

            if (sub === "off") {
                db[chatId].captcha.enabled = false;
                saveDB(db);
                return ctx.replyWithHTML("🔴 Đã tắt <b>Captcha kèm Welcome</b>!");
            }

            return ctx.replyWithHTML("⚠️ Dùng: <code>/welcome captcha on</code> hoặc <code>/welcome captcha off</code>");
        }

        if (cmd === "set") {
            const newText = text.substring(text.indexOf("set") + 3).trim();
            if (!newText) {
                return ctx.replyWithHTML("⚠️ Thiếu nội dung! Ví dụ: <code>/welcome set Chào {name} nhé!</code>");
            }

            db[chatId].text = newText;
            saveDB(db);
            return ctx.replyWithHTML("✅ <b>ĐÃ ĐỔI CÂU CHÀO THÀNH CÔNG!</b>");
        }

        const statusStr = db[chatId].active ? "🟢 ĐANG BẬT" : "🔴 ĐANG TẮT";
        const captchaStatus = db[chatId].captcha && db[chatId].captcha.enabled ? "🟢 BẬT" : "🔴 TẮT";

        const helpText = `<blockquote><b>⚙️ BẢNG ĐIỀU KHIỂN LỄ TÂN</b>\n` +
            `Trạng thái nhóm: <b>${statusStr}</b>\n` +
            `Captcha kèm theo: <b>${captchaStatus}</b>\n〰️〰️〰️〰️〰️〰️\n` +
            `🟢 <code>/welcome on</code> : Bật máy.\n` +
            `🔴 <code>/welcome off</code> : Tắt máy.\n` +
            `🔐 <code>/welcome captcha on|off</code> : Bật/tắt captcha.\n` +
            `📝 <code>/welcome set [Nội dung]</code> : Đổi câu chào.\n\n` +
            `<i>Câu chào hiện tại:</i>\n${db[chatId].text}</blockquote>`;

        ctx.replyWithHTML(helpText);
    });
};
