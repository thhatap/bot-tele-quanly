module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('antilink', async (ctx) => {
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

        let db = loadDB();
        if (!db[chatId]) {
            db[chatId] = {
                active: false,
                text: '🎉 <b>CHÀO MỪNG THÀNH VIÊN MỚI!</b> 🎉\n\n🔥 Chào mừng {name} đã hạ cánh xuống Group.\n🎬 Chúc đại ca có những giây phút giải trí cực mạnh!',
                moderation: { warns: {}, muted: {} },
                antilink: {
                    enabled: false,
                    mode: 'delete', // delete, warn, mute
                    muteDuration: 3600, // 1 hour in seconds
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
            return ctx.replyWithHTML('✅ <b>ĐÃ BẬT</b> Anti-Link & Anti-Spam!');
        }

        if (cmd === 'off') {
            db[chatId].antilink.enabled = false;
            saveDB(db);
            return ctx.replyWithHTML('🔴 <b>ĐÃ TẮT</b> Anti-Link & Anti-Spam!');
        }

        if (cmd === 'mode') {
            const mode = args[2] ? args[2].toLowerCase() : '';
            if (mode === 'delete' || mode === 'warn' || mode === 'mute') {
                db[chatId].antilink.mode = mode;
                saveDB(db);
                return ctx.replyWithHTML(`✅ Đã đổi chế độ Anti-Link thành: <b>${mode.toUpperCase()}</b>`);
            }
            return ctx.replyWithHTML('⚠️ Cách dùng: <code>/antilink mode [delete|warn|mute]</code>');
        }

        if (cmd === 'forward') {
            const value = args[2] ? args[2].toLowerCase() : '';
            if (value === 'on' || value === 'true' || value === '1') {
                db[chatId].antilink.actionForward = true;
                saveDB(db);
                return ctx.replyWithHTML('✅ Đã <b>BẬT</b> xử lý tin nhắn chuyển tiếp!');
            }
            if (value === 'off' || value === 'false' || value === '0') {
                db[chatId].antilink.actionForward = false;
                saveDB(db);
                return ctx.replyWithHTML('🔴 Đã <b>TẮT</b> xử lý tin nhắn chuyển tiếp!');
            }
            return ctx.replyWithHTML('⚠️ Cách dùng: <code>/antilink forward [on|off]</code>');
        }

        if (cmd === 'duration') {
            const minutes = parseInt(args[2], 10);
            if (isNaN(minutes) || minutes < 1) {
                return ctx.replyWithHTML('⚠️ Cách dùng: <code>/antilink duration [phút]</code>');
            }
            db[chatId].antilink.muteDuration = minutes * 60;
            saveDB(db);
            return ctx.replyWithHTML(`✅ Đã đặt thời gian mute là <b>${minutes} phút</b> khi phát hiện link!`);
        }

        const status = db[chatId].antilink.enabled ? '🟢 ĐANG BẬT' : '🔴 ĐANG TẮT';
        const modeText = db[chatId].antilink.mode.toUpperCase();
        const forwardText = db[chatId].antilink.actionForward ? 'BẬT' : 'TẮT';
        const durationText = Math.floor(db[chatId].antilink.muteDuration / 60);

        const helpText = `<blockquote><b>🛡️ BẢNG ĐIỀU KHIỂN ANTI-LINK</b>\n` +
            `Trạng thái: <b>${status}</b>\n〰️〰️〰️〰️〰️〰️\n` +
            `🟢 <code>/antilink on</code> : Bật Anti-Link.\n` +
            `🔴 <code>/antilink off</code> : Tắt Anti-Link.\n` +
            `⚙️ <code>/antilink mode [delete|warn|mute]</code> : Chế độ phạt.\n` +
            `🔄 <code>/antilink forward [on|off]</code> : Xử lý chuyển tiếp.\n` +
            `⏱️ <code>/antilink duration [phút]</code> : Thời gian mute.\n\n` +
            `Cấu hình hiện tại:\n` +
            `- Chế độ: <b>${modeText}</b>\n` +
            `- Chuyển tiếp: <b>${forwardText}</b>\n` +
            `- Thời gian mute: <b>${durationText} phút</b></blockquote>`;

        ctx.replyWithHTML(helpText);
    });
};
