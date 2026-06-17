module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('antilink', async (ctx) => {
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

        let db = loadDB();
        if (!db[chatId]) {
            db[chatId] = {
                active: false,
                text: '🎉 <b>CHÀO MỪNG THÀNH VIÊN MỚI!</b> 🎉\n\n🔥 Chào mừng {name} đã hạ cánh xuống Group.\n🎬 Chúc đại ca có những giây phút giải trí cực mạnh!',
                moderation: { warns: {}, muted: {} },
                antilink: {
                    enabled: false,
                    mode: 'delete',
                    muteDuration: 3600,
                    actionForward: true,
                    actionLinks: true
                }
            };
        }
        if (!db[chatId].moderation) {
            db[chatId].moderation = { warns: {}, muted: {} };
        }
        if (!db[chatId].antilink) {
            db[chatId].antilink = {
                enabled: false,
                mode: 'delete',
                muteDuration: 3600,
                actionForward: true,
                actionLinks: true
            };
        }

        const text = ctx.message.text || '';
        const args = text.split(/\s+/);
        const cmd = args[1] ? args[1].toLowerCase() : '';

        if (cmd === 'on') {
            db[chatId].antilink.enabled = true;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ✅ BẬT ANTI-LINK          <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Anti-Link & Anti-Spam đã được kích hoạt! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === 'off') {
            db[chatId].antilink.enabled = false;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🔴 TẮT ANTI-LINK         <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Anti-Link & Anti-Spam đã bị tắt! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === 'mode') {
            const mode = args[2] ? args[2].toLowerCase() : '';
            if (mode === 'delete' || mode === 'warn' || mode === 'mute') {
                db[chatId].antilink.mode = mode;
                saveDB(db);
                return ctx.replyWithHTML(
                    '<b>╔══════════════════════════════╗</b>\n' +
                    '<b>║</b>   ⚙️ ĐỔI CHẾ ĐỘ            <b>║</b>\n' +
                    '<b>╠══════════════════════════════╣</b>\n' +
                    `<b>║</b> Anti-Link mode: <code>${mode.toUpperCase()}</code> <b>║</b>\n` +
                    '<b>╚══════════════════════════════╝</b>'
                );
            }
            return ctx.replyWithHTML('⚠️ <b>Cách dùng:</b> <code>/antilink mode [delete|warn|mute]</code>');
        }

        if (cmd === 'forward') {
            const value = args[2] ? args[2].toLowerCase() : '';
            if (value === 'on' || value === 'true' || value === '1') {
                db[chatId].antilink.actionForward = true;
                saveDB(db);
                return ctx.replyWithHTML(
                    '<b>╔══════════════════════════════╗</b>\n' +
                    '<b>║</b>   ✅ BẬT XỬ LÝ FORWARD      <b>║</b>\n' +
                    '<b>╠══════════════════════════════╣</b>\n' +
                    '<b>║</b> Xử lý tin nhắn chuyển tiếp: <b>ON</b> <b>║</b>\n' +
                    '<b>╚══════════════════════════════╝</b>'
                );
            }
            if (value === 'off' || value === 'false' || value === '0') {
                db[chatId].antilink.actionForward = false;
                saveDB(db);
                return ctx.replyWithHTML(
                    '<b>╔══════════════════════════════╗</b>\n' +
                    '<b>║</b>   🔴 TẮT XỬ LÝ FORWARD     <b>║</b>\n' +
                    '<b>╠══════════════════════════════╣</b>\n' +
                    '<b>║</b> Xử lý tin nhắn chuyển tiếp: <b>OFF</b> <b>║</b>\n' +
                    '<b>╚══════════════════════════════╝</b>'
                );
            }
            return ctx.replyWithHTML('⚠️ <b>Cách dùng:</b> <code>/antilink forward [on|off]</code>');
        }

        if (cmd === 'duration') {
            const minutes = parseInt(args[2], 10);
            if (isNaN(minutes) || minutes < 1) {
                return ctx.replyWithHTML('⚠️ <b>Cách dùng:</b> <code>/antilink duration [phút]</code>');
            }
            db[chatId].antilink.muteDuration = minutes * 60;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ⏱️ ĐẶT THỜI GIAN MUTE     <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                `<b>║</b> Thời gian mute: <code>${minutes} phút</code> <b>║</b>\n` +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        const status = db[chatId].antilink.enabled ? '🟢 BẬT' : '🔴 TẮT';
        const modeText = db[chatId].antilink.mode.toUpperCase();
        const forwardText = db[chatId].antilink.actionForward ? 'BẬT' : 'TẮT';
        const durationText = Math.floor(db[chatId].antilink.muteDuration / 60);

        const helpText =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   🛡️ BẢNG ĐIỀU KHIỂN ANTI-LINK <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `<b>📌 Trạng thái:</b> <code>${status}</code>\n\n` +
            '<b>═══ HƯỚNG DẪN ═══</b>\n' +
            '<code>/antilink on</code> - Bật Anti-Link\n' +
            '<code>/antilink off</code> - Tắt Anti-Link\n' +
            '<code>/antilink mode [delete|warn|mute]</code> - Chế độ phạt\n' +
            '<code>/antilink forward [on|off]</code> - Xử lý chuyển tiếp\n' +
            '<code>/antilink duration [phút]</code> - Thời gian mute\n\n' +
            '<b>═══ CẤU HÌNH HIỆN TẠI ═══</b>\n' +
            `<b>• Chế độ:</b> <code>${modeText}</code>\n` +
            `<b>• Chuyển tiếp:</b> <code>${forwardText}</code>\n` +
            `<b>• Thời gian mute:</b> <code>${durationText} phút</code>\n\n` +
            '<b>╚══════════════════════════════╝</b>';

        ctx.replyWithHTML(helpText);
    });
};
