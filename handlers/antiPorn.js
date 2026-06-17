const adultKeywords = [
    'sex', 'porn', 'nude', 'naked', 'xxx', 'adult', '18+', 'nsfw',
    'escort', 'massage', 'thuê bao', 'gái gọi', 'mlem', 'vlxx', 'jav', 'phim sex',
    'video sex', 'clip sex', 'ảnh sex', 'chym', 'bím', 'lồn', 'vú', 'vú to', 'phò',
    'đĩ', 'điếm', 'bú', 'bú c', 'húp', 'húp lồn', 'húp c', 'bú c', 'liếm c', 'liếm lồn'
];

function hasAdultContent(message) {
    if (!message) return false;

    const text = (message.text || message.caption || '').toLowerCase();

    const hasKeyword = adultKeywords.some(keyword => text.includes(keyword));

    const hasSticker = Boolean(message.sticker);
    const hasAnimation = Boolean(message.animation);
    const hasVideo = Boolean(message.video);
    const hasPhoto = Boolean(message.photo);

    const hasNsfwSticker = hasSticker && /(nsfw|adult|sex|porn|xxx|18\+)/i.test((message.sticker.set_name || message.sticker.emoji || ''));

    if (hasKeyword || hasNsfwSticker || hasAnimation || hasVideo) {
        return true;
    }

    if (hasPhoto && (message.caption || message.text || '').trim()) {
        const captionText = (message.caption || message.text || '').toLowerCase();
        if (adultKeywords.some(keyword => captionText.includes(keyword))) {
            return true;
        }
    }

    return false;
}

module.exports = (bot, { loadDB, saveDB }) => {
    bot.on('message', async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const db = loadDB();

        if (!db[chatId] || !db[chatId].antiporn || !db[chatId].antiporn.enabled) {
            return;
        }

        const fromId = ctx.from.id;
        const text = (ctx.message.text || ctx.message.caption || '').toLowerCase();
        const keywords = db[chatId].antiporn.keywords || [];
        const detectedKeywords = keywords.filter(keyword => text.includes(keyword.toLowerCase()));
        const detectedDefault = adultKeywords.some(keyword => text.includes(keyword));

        if (!detectedKeywords.length && !detectedDefault && !hasAdultContent(ctx.message)) {
            return;
        }

        try {
            await ctx.deleteMessage();
        } catch (e) {
            console.error('Anti-porn delete error:', e.message);
        }

        if (!db[chatId].moderation.warns[fromId]) {
            db[chatId].moderation.warns[fromId] = [];
        }
        db[chatId].moderation.warns[fromId].push({
            reason: 'Gửi nội dung NSFW',
            by: 'BOT_ANTIPORN',
            at: Date.now()
        });
        saveDB(db);

        const warnCount = db[chatId].moderation.warns[fromId].length;
        if (warnCount >= 3) {
            try {
                await ctx.telegram.restrictChatMember(chatId, fromId, {
                    can_send_messages: false,
                    can_send_media_messages: false,
                    can_send_polls: false,
                    can_send_other_messages: false,
                    can_add_web_page_previews: false
                });
                db[chatId].moderation.muted[fromId] = true;
                saveDB(db);
                const userMention = `<a href="tg://user?id=${fromId}">${ctx.from.first_name || ctx.from.username || 'Người dùng'}</a>`;
                await ctx.replyWithHTML(
                    '<b>╔══════════════════════════════╗</b>\n' +
                    '<b>║</b>   🔇 ĐÃ MUTE VĨNH VIỄN     <b>║</b>\n' +
                    '<b>╠══════════════════════════════╣</b>\n\n' +
                    `${userMention} đã bị mute vì đạt 3 warns (Anti-Porn)!\n\n` +
                    '<b>╚══════════════════════════════╝</b>'
                );
            } catch (e) {
                console.error('Anti-porn mute error:', e.message);
            }
        }

        const userMention = `<a href="tg://user?id=${fromId}">${ctx.from.first_name || ctx.from.username || 'Người dùng'}</a>`;
        const replyText =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   🔞 ANTI-PORNOGRAPHY     <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `<b>👤 Người dùng:</b> ${userMention}\n` +
            '<b>📝 Lý do:</b> Gửi nội dung nhạy cảm\n' +
            `<b>🔢 Warn:</b> <code>${warnCount}/3</code>\n\n` +
            '<b>╚══════════════════════════════╝</b>';

        const keyboard = {
            inline_keyboard: [
                [
                    { text: '✅ Gỡ Warn', callback_data: `unwarn:${chatId}:${fromId}` },
                    { text: '🔇 Mute Vĩnh Viễn', callback_data: `mute:${chatId}:${fromId}` }
                ]
            ]
        };

        try {
            await ctx.replyWithHTML(replyText, { reply_markup: keyboard });
        } catch (e) {
            console.error('Anti-porn reply error:', e.message);
        }
    });
};
