module.exports = (bot, { loadDB, saveDB }) => {
    bot.action(/^(unwarn|mute|unmute):(\-?\d+):(\d+)$/, async (ctx) => {
        const action = ctx.match[1];
        const chatId = ctx.match[2].toString();
        const targetUserId = parseInt(ctx.match[3], 10);
        const fromId = ctx.from.id;

        try {
            const admins = await ctx.getChatAdministrators(chatId);
            const isAdmin = admins.some(admin => admin.user.id === fromId);
            if (!isAdmin) {
                return ctx.answerCbQuery('⛔ Bạn không có quyền thực hiện thao tác này!', { show_alert: true });
            }
        } catch (e) {
            return ctx.answerCbQuery('⚠️ Không thể kiểm tra quyền Admin!', { show_alert: true });
        }

        let db = loadDB();
        if (!db[chatId]) {
            db[chatId] = {
                active: false,
                text: '🎉 <b>CHÀO MỪNG THÀNH VIÊN MỚI!</b> 🎉\n\n🔥 Chào mừng {name} đã hạ cánh xuống Group.\n🎬 Chúc đại ca có những giây phút giải trí cực mạnh!',
                moderation: { warns: {}, muted: {} }
            };
        }
        if (!db[chatId].moderation) {
            db[chatId].moderation = { warns: {}, muted: {} };
        }
        if (!db[chatId].moderation.warns) {
            db[chatId].moderation.warns = {};
        }
        if (!db[chatId].moderation.muted) {
            db[chatId].moderation.muted = {};
        }

        if (action === 'unwarn') {
            if (!db[chatId].moderation.warns[targetUserId] || db[chatId].moderation.warns[targetUserId].length === 0) {
                return ctx.answerCbQuery('ℹ️ Người dùng này hiện không có warn nào!', { show_alert: true });
            }

            db[chatId].moderation.warns[targetUserId].pop();
            if (db[chatId].moderation.warns[targetUserId].length === 0) {
                delete db[chatId].moderation.warns[targetUserId];
            }
            saveDB(db);
            return ctx.answerCbQuery('✅ Đã gỡ 1 warn cuối cùng!', { show_alert: true });
        }

        if (action === 'mute') {
            try {
                await ctx.telegram.restrictChatMember(chatId, targetUserId, {
                    can_send_messages: false,
                    can_send_media_messages: false,
                    can_send_polls: false,
                    can_send_other_messages: false,
                    can_add_web_page_previews: false
                });
                db[chatId].moderation.muted[targetUserId] = true;
                saveDB(db);
                return ctx.answerCbQuery('🔇 Đã mute người dùng!', { show_alert: true });
            } catch (e) {
                console.error('Mute callback error:', e.message);
                return ctx.answerCbQuery('❌ Không thể mute người dùng này!', { show_alert: true });
            }
        }

        if (action === 'unmute') {
            try {
                await ctx.telegram.restrictChatMember(chatId, targetUserId, {
                    can_send_messages: true,
                    can_send_media_messages: true,
                    can_send_polls: true,
                    can_send_other_messages: true,
                    can_add_web_page_previews: true
                });
                if (db[chatId].moderation.muted[targetUserId]) {
                    delete db[chatId].moderation.muted[targetUserId];
                }
                saveDB(db);
                return ctx.answerCbQuery('🔊 Đã gỡ mute người dùng!', { show_alert: true });
            } catch (e) {
                console.error('Unmute callback error:', e.message);
                return ctx.answerCbQuery('❌ Không thể gỡ mute người dùng này!', { show_alert: true });
            }
        }
    });
};
