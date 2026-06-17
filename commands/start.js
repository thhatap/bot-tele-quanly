module.exports = (bot, { loadDB, saveDB }) => {
    bot.start(async (ctx) => {
        if (ctx.chat.type !== 'private') return;

        const userId = ctx.from.id;
        const userName = ctx.from.first_name;

        let db = loadDB();
        if (!db.groups) db.groups = [];
        saveDB(db);

        const groups = db.groups || [];

        let keyboard = [];
        if (groups.length > 0) {
            groups.forEach(group => {
                if (group.username) {
                    keyboard.push([{
                        text: `📢 ${group.title}`,
                        url: `https://t.me/${group.username}`
                    }]);
                } else {
                    const chatId = group.id.toString().replace('-100', '');
                    keyboard.push([{
                        text: `📢 ${group.title}`,
                        url: `https://t.me/c/${chatId}`
                    }]);
                }
            });
        } else {
            keyboard.push([{ text: '⚠️ Bot chưa tham gia nhóm nào', callback_data: 'none' }]);
        }

        keyboard.push([
            { text: '🔄 Cập nhật danh sách', callback_data: 'refresh_groups' }
        ]);
        keyboard.push([
            { text: '👤 Liên hệ Admin', url: 'https://t.me/username_cua_ban' }
        ]);

        const welcomeText =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   👋 CHÀO MỪNG             <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `<b>Xin chào, ${userName}!</b>\n\n` +
            '<b>Tôi là Bot Quản Lý Nhóm</b> 🔧\n\n' +
            'Dưới đây là danh sách các nhóm mà tôi đang quản lý:\n\n' +
            `<b>📋 Tổng cộng:</b> <code>${groups.length}</code> nhóm\n\n` +
            'Nhấn vào nút bên dưới để tham gia nhóm!\n\n' +
            '<b>╚══════════════════════════════╝</b>';

        try {
            await ctx.replyWithHTML(welcomeText, {
                reply_markup: {
                    inline_keyboard: keyboard
                }
            });
        } catch (e) {
            await ctx.replyWithHTML(welcomeText);
        }
    });

    bot.action('refresh_groups', async (ctx) => {
        if (ctx.chat.type !== 'private') return;

        const userName = ctx.from.first_name;

        let db = loadDB();
        const groups = db.groups || [];

        let keyboard = [];
        if (groups.length > 0) {
            groups.forEach(group => {
                if (group.username) {
                    keyboard.push([{
                        text: `📢 ${group.title}`,
                        url: `https://t.me/${group.username}`
                    }]);
                } else {
                    const chatId = group.id.toString().replace('-100', '');
                    keyboard.push([{
                        text: `📢 ${group.title}`,
                        url: `https://t.me/c/${chatId}`
                    }]);
                }
            });
        } else {
            keyboard.push([{ text: '⚠️ Bot chưa tham gia nhóm nào', callback_data: 'none' }]);
        }

        keyboard.push([
            { text: '🔄 Cập nhật danh sách', callback_data: 'refresh_groups' }
        ]);
        keyboard.push([
            { text: '👤 Liên hệ Admin', url: 'https://t.me/username_cua_ban' }
        ]);

        const refreshText =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   🔄 ĐÃ CẬP NHẬT         <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `<b>📋 Tổng cộng:</b> <code>${groups.length}</code> nhóm\n\n` +
            '<b>╚══════════════════════════════╝</b>';

        await ctx.editMessageText(refreshText, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: keyboard
            }
        }).catch(() => {});

        await ctx.answerCbQuery().catch(() => {});
    });
};
