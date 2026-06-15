module.exports = (bot, { loadDB }) => {
    bot.command('help', async (ctx) => {
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

        await ctx.replyWithHTML(
            '📋 <b>DANH SÁCH LỆNH ADMIN</b>\n' +
            '━━━━━━━━━━━━━━━━━━━━\n\n' +
            '👋 <b>CHÀO MỪNG</b>\n' +
            '• /welcome on/off - Bật/tắt chào mừng\n' +
            '• /welcome captcha on/off - Bật/tắt captcha\n' +
            '• /welcome set [text] - Đổi lời chào\n\n' +
            '⚠️ <b>MODERATION</b>\n' +
            '• /warn [reply/ID] [lý do] - Cảnh cáo thành viên\n' +
            '• /mute [reply/ID] - Mute vĩnh viễn\n' +
            '• /unmute [reply/ID] - Gỡ mute\n' +
            '• /warns [ID] - Xem lịch sử warn\n' +
            '• /muted - Danh sách bị mute\n\n' +
            '🛡️ <b>ANTI-SPAM</b>\n' +
            '• /antilink on/off - Bật/tắt anti-link\n' +
            '• /antilink mode [delete/warn/mute] - Chế độ xử lý\n' +
            '• /antilink forward on/off - Xử lý tin nhắn chuyển tiếp\n' +
            '• /antilink duration [phút] - Thời gian mute\n\n' +
            '🔞 <b>ANTI-PORN</b>\n' +
            '• /antiporn on/off - Bật/tắt\n' +
            '• /antiporn add [từ] - Thêm từ cấm\n' +
            '• /antiporn remove [từ] - Xóa từ cấm\n\n' +
            '🔗 <b>LINKS</b>\n' +
            '• /autodeletelinks on/off - Xóa mọi link\n\n' +
            '🧹 <b>CLEANUP</b>\n' +
            '• /autoclear on/off - Tự động dọn tin nhắn\n' +
            '• /autoclear interval [giây] - Đặt khoảng thời gian\n\n' +
            '🤖 <b>BOTS</b>\n' +
            '• /autokickbots on/off - Tự động kick bot\n\n' +
            '👥 <b>STAFF</b>\n' +
            '• /staff list - Danh sách staff\n' +
            '• /staff add [ID] - Thêm staff\n' +
            '• /staff remove [ID] - Xóa staff\n' +
            '• /staff export - Xuất danh sách staff\n\n' +
            '🔧 <b>KHÁC</b>\n' +
            '• /autoreply - Quản lý auto reply\n' +
            '• /help - Xem danh sách lệnh\n\n' +
            '━━━━━━━━━━━━━━━━━━━━\n' +
            '📌 Reply tin nhắn để tác động lên user đó',
            { reply_to_message_id: ctx.message.message_id }
        );
    });
};
