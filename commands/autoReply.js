module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('autoreply', async (ctx) => {
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

        const text = ctx.message.text || '';
        const args = text.split(/\s+/);
        const cmd = args[1] ? args[1].toLowerCase() : '';

        let db = loadDB();
        if (!db[chatId]) {
            db[chatId] = {
                active: false,
                text: '🎉 <b>CHÀO MỪNG THÀNH VIÊN MỚI!</b> 🎉\n\n🔥 Chào mừng {name} đã hạ cánh xuống Group.\n🎬 Chúc đại ca có những giây phút giải trí cực mạnh!',
                autoreply: {
                    enabled: false,
                    rules: {}
                }
            };
        }
        if (!db[chatId].autoreply) {
            db[chatId].autoreply = {
                enabled: false,
                rules: {}
            };
        }

        if (cmd === 'on') {
            db[chatId].autoreply.enabled = true;
            saveDB(db);
            return ctx.replyWithHTML('✅ <b>ĐÃ BẬT</b> Auto Reply!');
        }

        if (cmd === 'off') {
            db[chatId].autoreply.enabled = false;
            saveDB(db);
            return ctx.replyWithHTML('🔴 <b>ĐÃ TẮT</b> Auto Reply!');
        }

        if (cmd === 'add') {
            if (args.length < 4) {
                return ctx.replyWithHTML('⚠️ Cách dùng: <code>/autoreply add [từ khóa] [nội dung]</code>');
            }

            const keyword = args[2].toLowerCase();
            const replyContent = text.substring(text.indexOf(args[3])).trim();

            if (!replyContent) {
                return ctx.replyWithHTML('⚠️ Thiếu nội dung reply!');
            }

            db[chatId].autoreply.rules[keyword] = replyContent;
            saveDB(db);
            return ctx.replyWithHTML(`✅ Đã thêm rule Auto Reply:\n🔑 <b>${keyword}</b>\n💬 <b>${replyContent}</b>`);
        }

        if (cmd === 'remove') {
            if (!args[2]) {
                return ctx.replyWithHTML('⚠️ Cách dùng: <code>/autoreply remove [từ khóa]</code>');
            }

            const keyword = args[2].toLowerCase();
            if (!db[chatId].autoreply.rules[keyword]) {
                return ctx.replyWithHTML('⚠️ Không tìm thấy từ khóa này!');
            }

            delete db[chatId].autoreply.rules[keyword];
            saveDB(db);
            return ctx.replyWithHTML(`✅ Đã xóa rule Auto Reply cho từ khóa: <b>${keyword}</b>`);
        }

        const rules = db[chatId].autoreply.rules || {};
        const ruleKeys = Object.keys(rules);

        const helpText = `<blockquote><b>🤖 BẢNG ĐIỀU KHIỂN AUTO REPLY</b>\n` +
            `Trạng thái: <b>${db[chatId].autoreply.enabled ? '🟢 ĐANG BẬT' : '🔴 ĐANG TẮT'}</b>\n〰️〰️〰️〰️〰️〰️\n` +
            `🟢 <code>/autoreply on</code> : Bật Auto Reply.\n` +
            `🔴 <code>/autoreply off</code> : Tắt Auto Reply.\n` +
            `➕ <code>/autoreply add [từ khóa] [nội dung]</code> : Thêm rule.\n` +
            `➖ <code>/autoreply remove [từ khóa]</code> : Xóa rule.\n\n` +
            `Số rule hiện tại: <b>${ruleKeys.length}</b>\n` +
            `Danh sách:\n${ruleKeys.length ? ruleKeys.map(r => `🔹 <code>${r}</code> → ${rules[r]}`).join('\n') : 'Chưa có'}</blockquote>`;

        ctx.replyWithHTML(helpText);
    });
};
