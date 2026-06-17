module.exports = (bot, { loadDB }) => {
    bot.command('help', async (ctx) => {
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

        await ctx.replyWithHTML(
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   📋 DANH SÁCH LỆNH ADMIN   <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            '<b>👋 CHÀO MỪNG</b>\n' +
            '• <code>/welcome on/off</code> - Bật/tắt chào mừng\n' +
            '• <code>/welcome captcha on/off</code> - Bật/tắt captcha\n' +
            '• <code>/welcome set [text]</code> - Đổi lời chào\n\n' +
            '<b>⚠️ MODERATION</b>\n' +
            '• <code>/warn [reply/ID] [lý do]</code> - Cảnh cáo thành viên\n' +
            '• <code>/mute [reply/ID]</code> - Mute vĩnh viễn\n' +
            '• <code>/unmute [reply/ID]</code> - Gỡ mute\n' +
            '• <code>/warns [ID]</code> - Xem lịch sử warn\n' +
            '• <code>/muted</code> - Danh sách bị mute\n\n' +
            '<b>🛡️ ANTI-SPAM</b>\n' +
            '• <code>/antilink on/off</code> - Bật/tắt anti-link\n' +
            '• <code>/antilink mode [delete/warn/mute]</code> - Chế độ xử lý\n' +
            '• <code>/antilink forward on/off</code> - Xử lý tin nhắn chuyển tiếp\n' +
            '• <code>/antilink duration [phút]</code> - Thời gian mute\n\n' +
            '<b>🔞 ANTI-PORN</b>\n' +
            '• <code>/antiporn on/off</code> - Bật/tắt\n' +
            '• <code>/antiporn add [từ]</code> - Thêm từ cấm\n' +
            '• <code>/antiporn remove [từ]</code> - Xóa từ cấm\n\n' +
            '<b>🔗 LINKS</b>\n' +
            '• <code>/autodeletelinks on/off</code> - Xóa mọi link\n\n' +
            '<b>🧹 CLEANUP</b>\n' +
            '• <code>/autoclear on/off</code> - Tự động dọn tin nhắn\n' +
            '• <code>/autoclear interval [giây]</code> - Đặt khoảng thời gian\n\n' +
            '<b>🤖 BOTS</b>\n' +
            '• <code>/autokickbots on/off</code> - Tự động kick bot\n\n' +
            '<b>👥 STAFF</b>\n' +
            '• <code>/staff list</code> - Danh sách staff\n' +
            '• <code>/staff add [ID]</code> - Thêm staff\n' +
            '• <code>/staff remove [ID]</code> - Xóa staff\n\n' +
            '<b>🔧 KHÁC</b>\n' +
            '• <code>/autoreply</code> - Quản lý auto reply\n' +
            '• <code>/help</code> - Xem danh sách lệnh\n\n' +
            '<b>╠══════════════════════════════╣</b>\n' +
            '<b>║</b> 📌 Reply tin nhắn để tác động lên user đó <b>║</b>\n' +
            '<b>╚══════════════════════════════╝</b>',
            { reply_to_message_id: ctx.message.message_id }
        );
    });
};
