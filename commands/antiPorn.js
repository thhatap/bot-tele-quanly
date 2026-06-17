module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('antiporn', async (ctx) => {
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
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ✅ BẬT ANTI-PORN         <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Anti-Pornography đã được kích hoạt! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === 'off') {
            db[chatId].antiporn.enabled = false;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🔴 TẮT ANTI-PORN        <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Anti-Pornography đã bị tắt! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === 'add') {
            const keyword = args[2];
            if (!keyword) {
                return ctx.replyWithHTML('⚠️ <b>Cách dùng:</b> <code>/antiporn add [từ khóa]</code>');
            }
            if (!db[chatId].antiporn.keywords.includes(keyword)) {
                db[chatId].antiporn.keywords.push(keyword);
            }
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ✅ THÊM TỪ KHÓA         <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                `<b>║</b> Đã thêm: <code>${keyword}</code> <b>║</b>\n` +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === 'remove') {
            const keyword = args[2];
            if (!keyword) {
                return ctx.replyWithHTML('⚠️ <b>Cách dùng:</b> <code>/antiporn remove [từ khóa]</code>');
            }
            db[chatId].antiporn.keywords = db[chatId].antiporn.keywords.filter(k => k !== keyword);
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ❌ XÓA TỪ KHÓA          <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                `<b>║</b> Đã xóa: <code>${keyword}</code> <b>║</b>\n` +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        const keywords = db[chatId].antiporn.keywords || [];
        const helpText =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   🔞 BẢNG ANTI-PORNOGRAPHY  <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `<b>📌 Trạng thái:</b> <code>${db[chatId].antiporn.enabled ? '🟢 BẬT' : '🔴 TẮT'}</code>\n\n` +
            '<b>═══ HƯỚNG DẪN ═══</b>\n' +
            '<code>/antiporn on</code> - Bật Anti-Porn\n' +
            '<code>/antiporn off</code> - Tắt Anti-Porn\n' +
            '<code>/antiporn add [từ khóa]</code> - Thêm từ khóa\n' +
            '<code>/antiporn remove [từ khóa]</code> - Xóa từ khóa\n\n' +
            `<b>═══ CẤU HÌNH HIỆN TẠI ═══</b>\n` +
            `<b>• Số từ khóa:</b> <code>${keywords.length}</code>\n` +
            `<b>• Danh sách:</b> ${keywords.length ? keywords.map(k => `<code>${k}</code>`).join(', ') : 'Chưa có'}\n\n` +
            '<b>╚══════════════════════════════╝</b>';

        ctx.replyWithHTML(helpText);
    });
};
