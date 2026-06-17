module.exports = (bot, { loadDB, saveDB }) => {
    bot.command('autokickbots', async (ctx) => {
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
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   ✅ BẬT AUTO KICK BOTS    <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Tự động kick bot khi vào nhóm! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        if (cmd === 'off') {
            db[chatId].autokickbots.enabled = false;
            saveDB(db);
            return ctx.replyWithHTML(
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🔴 TẮT AUTO KICK BOTS   <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n' +
                '<b>║</b> Auto kick bot đã bị tắt! <b>║</b>\n' +
                '<b>╚══════════════════════════════╝</b>'
            );
        }

        const status = db[chatId].autokickbots.enabled ? '🟢 BẬT' : '🔴 TẮT';

        const helpText =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   🤖 AUTO KICK BOTS        <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `<b>📌 Trạng thái:</b> <code>${status}</code>\n\n` +
            '<b>═══ HƯỚNG DẪN ═══</b>\n' +
            '<code>/autokickbots on</code> - Bật Auto Kick Bots\n' +
            '<code>/autokickbots off</code> - Tắt Auto Kick Bots\n\n' +
            '<b>Tác dụng:</b> Kick toàn bộ bot khi có bot mới vào group.\n\n' +
            '<b>╚══════════════════════════════╝</b>';

        ctx.replyWithHTML(helpText);
    });
};
