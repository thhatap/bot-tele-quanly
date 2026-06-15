module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('antiporn', async (ctx) => {
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
                antiporn: {
                    enabled: false,
                    keywords: []
                }
            };
        }
        if (!db[chatId].moderation) {
            db[chatId].moderation = { warns: {}, muted: {} };
        }
        if (!db[chatId].antiporn) {
            db[chatId].antiporn = {
                enabled: false,
                keywords: []
            };
        }

        if (cmd === 'on') {
            db[chatId].antiporn.enabled = true;
            saveDB(db);
            return ctx.replyWithHTML('✅ <b>ĐÃ BẬT</b> Anti-Pornography!');
        }

        if (cmd === 'off') {
            db[chatId].antiporn.enabled = false;
            saveDB(db);
            return ctx.replyWithHTML('🔴 <b>ĐÃ TẮT</b> Anti-Pornography!');
        }

        if (cmd === 'add') {
            const keyword = args[2];
            if (!keyword) {
                return ctx.replyWithHTML('⚠️ Cách dùng: <code>/antiporn add [từ khóa]</code>');
            }
            if (!db[chatId].antiporn.keywords.includes(keyword)) {
                db[chatId].antiporn.keywords.push(keyword);
            }
            saveDB(db);
            return ctx.replyWithHTML(`✅ Đã thêm từ khóa: <b>${keyword}</b>`);
        }

        if (cmd === 'remove') {
            const keyword = args[2];
            if (!keyword) {
                return ctx.replyWithHTML('⚠️ Cách dùng: <code>/antiporn remove [từ khóa]</code>');
            }
            db[chatId].antiporn.keywords = db[chatId].antiporn.keywords.filter(k => k !== keyword);
            saveDB(db);
            return ctx.replyWithHTML(`✅ Đã xóa từ khóa: <b>${keyword}</b>`);
        }

        const keywords = db[chatId].antiporn.keywords || [];
        const helpText = `<blockquote><b>🔞 BẢNG ĐIỀU KHIỂN ANTI-PORNOGRAPHY</b>\n` +
            `Trạng thái: <b>${db[chatId].antiporn.enabled ? '🟢 ĐANG BẬT' : '🔴 ĐANG TẮT'}</b>\n〰️〰️〰️〰️〰️〰️\n` +
            `🟢 <code>/antiporn on</code> : Bật Anti-Porn.\n` +
            `🔴 <code>/antiporn off</code> : Tắt Anti-Porn.\n` +
            `➕ <code>/antiporn add [từ khóa]</code> : Thêm từ khóa.\n` +
            `➖ <code>/antiporn remove [từ khóa]</code> : Xóa từ khóa.\n\n` +
            `Số từ khóa hiện tại: <b>${keywords.length}</b>\n` +
            `Danh sách: ${keywords.length ? keywords.map(k => `<code>${k}</code>`).join(', ') : 'Chưa có'}</blockquote>`;

        ctx.replyWithHTML(helpText);
    });
};
