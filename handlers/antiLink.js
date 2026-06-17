const linkRegex = /(https?:\/\/|t\.me\/|telegram\.me\/|telegram\.dog\/|@[A-Za-z0-9_]{5,32})/;

function containsLink(message) {
    if (!message) return false;

    if (message.text && linkRegex.test(message.text)) return true;
    if (message.caption && linkRegex.test(message.caption)) return true;

    if (message.entities && message.entities.some(entity => entity.type === 'url' || entity.type === 'mention')) return true;
    if (message.caption_entities && message.caption_entities.some(entity => entity.type === 'url' || entity.type === 'mention')) return true;

    return false;
}

async function handleAutoModeration(bot, ctx, db, chatId, targetUserId, targetUserName) {
    const antilink = db[chatId].antilink;
    if (!antilink || !antilink.enabled) return;

    let autoMuted = false;
    let deleteSuccess = true;

    try {
        await ctx.deleteMessage();
    } catch (e) {
        deleteSuccess = false;
    }

    if (antilink.mode === 'mute' || antilink.mode === 'warn') {
        try {
            const muteUntil = Math.floor(Date.now() / 1000) + antilink.muteDuration;
            await ctx.telegram.restrictChatMember(chatId, targetUserId, {
                until_date: muteUntil,
                can_send_messages: false,
                can_send_media_messages: false,
                can_send_polls: false,
                can_send_other_messages: false,
                can_add_web_page_previews: false
            });
            autoMuted = true;
        } catch (e) {
            console.error('Anti-link mute error:', e.message);
        }
    }

    if (antilink.mode === 'warn') {
        if (!db[chatId].moderation.warns[targetUserId]) {
            db[chatId].moderation.warns[targetUserId] = [];
        }
        db[chatId].moderation.warns[targetUserId].push({
            reason: 'Gửi link bị cấm',
            by: 'BOT_ANTILINK',
            at: Date.now()
        });
        saveDB(db);

        const warnCount = db[chatId].moderation.warns[targetUserId].length;
        if (warnCount >= 3) {
            try {
                const muteUntil = Math.floor(Date.now() / 1000) + antilink.muteDuration;
                await ctx.telegram.restrictChatMember(chatId, targetUserId, {
                    until_date: muteUntil,
                    can_send_messages: false,
                    can_send_media_messages: false,
                    can_send_polls: false,
                    can_send_other_messages: false,
                    can_add_web_page_previews: false
                });
                autoMuted = true;
                db[chatId].moderation.muted[targetUserId] = true;
                saveDB(db);
            } catch (e) {
                console.error('Auto mute from warns error:', e.message);
            }
        }
    }

    const userMention = `<a href="tg://user?id=${targetUserId}">${targetUserName}</a>`;
    let replyText = '';

    if (antilink.mode === 'delete') {
        replyText =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   🗑️ XÓA TIN NHẮN         <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `${userMention} không được phép gửi link!\n\n` +
            '<b>╚══════════════════════════════╝</b>';
    } else if (antilink.mode === 'warn') {
        replyText =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   ⚠️ ANTI-LINK WARN       <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `<b>👤 Người dùng:</b> ${userMention}\n` +
            '<b>📝 Lý do:</b> Gửi link bị cấm\n' +
            `<b>🔢 Warn:</b> <code>${db[chatId].moderation.warns[targetUserId].length}/3</code>\n\n` +
            (autoMuted ? '<b>🔇 Đã MUTE TỰ ĐỘNG vì đạt 3 warns!</b>\n\n' : '') +
            '<b>╚══════════════════════════════╝</b>';
    } else if (antilink.mode === 'mute') {
        replyText =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   🔇 ĐÃ MUTE TỰ ĐỘNG     <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `${userMention} vì gửi link bị cấm!\n` +
            `<b>⏱️ Thời gian:</b> <code>${antilink.muteDuration / 60} phút</code>\n\n` +
            '<b>╚══════════════════════════════╝</b>';
    }

    const keyboard = {
        inline_keyboard: [
            [
                { text: '✅ Gỡ Warn', callback_data: `unwarn:${chatId}:${targetUserId}` },
                { text: '🔇 Mute Vĩnh Viễn', callback_data: `mute:${chatId}:${targetUserId}` }
            ]
        ]
    };

    try {
        await ctx.replyWithHTML(replyText, { reply_markup: keyboard });
    } catch (e) {
        console.error('Anti-link reply error:', e.message);
    }
}

module.exports = (bot, { loadDB, saveDB }) => {
    bot.on('message', async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const db = loadDB();

        if (!db[chatId] || !db[chatId].antilink || !db[chatId].antilink.enabled) {
            return;
        }

        const fromId = ctx.from.id;
        const targetUserName = ctx.from.first_name || ctx.from.username || 'Người dùng';

        try {
            const admins = await ctx.getChatAdministrators();
            const isAdmin = admins.some(admin => admin.user.id === fromId);
            if (isAdmin) {
                return;
            }
        } catch (e) {
            console.error('Anti-link admin check error:', e.message);
        }

        const hasLink = containsLink(ctx.message);
        const isForwarded = ctx.message.forward_from || ctx.message.forward_from_chat || ctx.message.forward_signature;

        const shouldAct = (hasLink && db[chatId].antilink.actionLinks) || (isForwarded && db[chatId].antilink.actionForward);

        if (!shouldAct) {
            return;
        }

        await handleAutoModeration(bot, ctx, db, chatId, fromId, targetUserName);
    });
};
