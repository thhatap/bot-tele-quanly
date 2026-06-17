module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('autoreply', async (ctx) => {
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
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ✅ BẬT AUTO REPLY      <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Auto Reply đã được kích hoạt! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === 'off') {
            db[chatId].autoreply.enabled = false;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🔴 TẮT AUTO REPLY     <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Auto Reply đã bị tắt! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === 'add') {
            if (args.length < 4) {
                return ctx.replyWithHTML('⚠️ <b>Cách dùng:</b> <code>/autoreply add [từ khóa] [nội dung]</code>');
            }

            const keyword = args[2].toLowerCase();
            const replyContent = text.substring(text.indexOf(args[3])).trim();

            if (!replyContent) {
                return ctx.replyWithHTML('⚠️ <b>Thiếu nội dung reply!</b>');
            }

            db[chatId].autoreply.rules[keyword] = replyContent;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ✅ THÊM AUTO REPLY      <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n\n' +
                `<b>🔑 Từ khóa:</b> <code>${keyword}</code>\n` +
                `<b>💬 Reply:</b> <i>${replyContent}</i>\n\n` +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === 'remove') {
            if (!args[2]) {
                return ctx.replyWithHTML('⚠️ <b>Cách dùng:</b> <code>/autoreply remove [từ khóa]</code>');
            }

            const keyword = args[2].toLowerCase();
            if (!db[chatId].autoreply.rules[keyword]) {
                return ctx.replyWithHTML('⚠️ <b>Không tìm thấy từ khóa này!</b>');
            }

            delete db[chatId].autoreply.rules[keyword];
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ❌ XÓA AUTO REPLY      <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                `<b>║</b> Đã xóa: <code>${keyword}</code> <b>║</b>\n` +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        const rules = db[chatId].autoreply.rules || {};
        const ruleKeys = Object.keys(rules);

        const helpText =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   🤖 BẢNG ĐIỀU KHIỂN AUTO REPLY <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `<b>📌 Trạng thái:</b> <code>${db[chatId].autoreply.enabled ? '🟢 BẬT' : '🔴 TẮT'}</code>\n\n` +
            '<b>═══ HƯỚNG DẪN ═══</b>\n' +
            '<code>/autoreply on</code> - Bật Auto Reply\n' +
            '<code>/autoreply off</code> - Tắt Auto Reply\n' +
            '<code>/autoreply add [từ khóa] [nội dung]</code> - Thêm rule\n' +
            '<code>/autoreply remove [từ khóa]</code> - Xóa rule\n\n' +
            `<b>═══ CẤU HÌNH HIỆN TẠI ═══</b>\n` +
            `<b>• Số rule:</b> <code>${ruleKeys.length}</code>\n` +
            `<b>• Danh sách:</b>\n${ruleKeys.length ? ruleKeys.map(r => `  🔹 <code>${r}</code> → ${rules[r]}`).join('\n') : '  Chưa có'}\n\n` +
            '<b>╚══════════════════════════════╝</b>';

        ctx.replyWithHTML(helpText);
    });
};
