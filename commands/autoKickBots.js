module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('autokickbots', async (ctx) => {
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
                autokickbots: {
                    enabled: false
                }
            };
        }
        if (!db[chatId].moderation) {
            db[chatId].moderation = { warns: {}, muted: {} };
        }
        if (!db[chatId].autokickbots) {
            db[chatId].autokickbots = {
                enabled: false
            };
        }

        if (cmd === 'on') {
            db[chatId].autokickbots.enabled = true;
            saveDB(db);
            return ctx.replyWithHTML('✅ <b>ĐÃ BẬT</b> Auto Kick Bots!');
        }

        if (cmd === 'off') {
            db[chatId].autokickbots.enabled = false;
            saveDB(db);
            return ctx.replyWithHTML('🔴 <b>ĐÃ TẮT</b> Auto Kick Bots!');
        }

        const status = db[chatId].autokickbots.enabled ? '🟢 ĐANG BẬT' : '🔴 ĐANG TẮT';

        const helpText = `<blockquote><b>🤖 BẢNG ĐIỀU KHIỂN AUTO KICK BOTS</b>\n` +
            `Trạng thái: <b>${status}</b>\n〰️〰️〰️〰️〰️〰️\n` +
            `🟢 <code>/autokickbots on</code> : Bật Auto Kick Bots.\n` +
            `🔴 <code>/autokickbots off</code> : Tắt Auto Kick Bots.\n\n` +
            `Tác dụng: Kick toàn bộ bot khi có bot mới vào group.</blockquote>`;

        ctx.replyWithHTML(helpText);
    });
};
