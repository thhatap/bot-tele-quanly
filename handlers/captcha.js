const pendingKicks = new Map();
const pendingCaptcha = new Map();

function scheduleCaptchaKick(bot, chatId, userId, userName, delaySeconds) {
    const kickKey = `${chatId}:${userId}`;

    if (pendingKicks.has(kickKey)) {
        clearTimeout(pendingKicks.get(kickKey));
    }

    const timeout = setTimeout(async () => {
        try {
            await bot.telegram.banChatMember(chatId, userId);
            await bot.telegram.sendMessage(chatId,
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🔨 ĐÃ XÓA THÀNH VIÊN   <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n\n' +
                `${userName} không xác minh Captcha trong thời gian quy định!\n\n` +
                '<b>╚══════════════════════════════╝</b>',
                { parse_mode: 'HTML' }
            );
        } catch (e) {
            console.error('Captcha kick error:', e.message);
        }
        pendingKicks.delete(kickKey);
        pendingCaptcha.delete(kickKey);
    }, delaySeconds * 1000);

    pendingKicks.set(kickKey, timeout);
}

function cancelCaptchaKick(chatId, userId) {
    const kickKey = `${chatId}:${userId}`;
    if (pendingKicks.has(kickKey)) {
        clearTimeout(pendingKicks.get(kickKey));
        pendingKicks.delete(kickKey);
    }
}

function addPendingCaptcha(chatId, userId, messageIds = []) {
    pendingCaptcha.set(`${chatId}:${userId}`, {
        messageIds: Array.isArray(messageIds) ? messageIds : [messageIds]
    });
}

function getPendingCaptcha(chatId, userId) {
    return pendingCaptcha.get(`${chatId}:${userId}`);
}

function removePendingCaptcha(chatId, userId) {
    pendingCaptcha.delete(`${chatId}:${userId}`);
}

async function deleteCaptchaMessages(bot, chatId, userId) {
    const data = getPendingCaptcha(chatId, userId);
    if (!data || !data.messageIds.length) return;

    for (const messageId of data.messageIds) {
        try {
            await bot.telegram.deleteMessage(chatId, messageId);
        } catch (e) {
            // ignore if already deleted or not found
        }
    }
    removePendingCaptcha(chatId, userId);
}

module.exports = {
    scheduleCaptchaKick,
    cancelCaptchaKick,
    addPendingCaptcha,
    deleteCaptchaMessages,
    handler: (bot, { loadDB, saveDB }) => {
        bot.action(/^welcome_captcha:(\-?\d+):(\d+)$/, async (ctx) => {
            const chatId = ctx.match[1].toString();
            const targetUserId = parseInt(ctx.match[2], 10);
            const fromId = ctx.from.id;

            if (fromId !== targetUserId) {
                return ctx.answerCbQuery('⛔ Nút này không dành cho mày!', { show_alert: true });
            }

            let db = loadDB();
            if (!db[chatId]) {
                db[chatId] = {
                    active: false,
                    text: '🎉 <b>CHÀO MỪNG THÀNH VIÊN MỚI!</b> 🎉\n\n🔥 Chào mừng {name} đã hạ cánh xuống Group.\n🎬 Chúc đại ca có những giây phút giải trí cực mạnh!',
                    captcha: {
                        enabled: false,
                        kickAfter: 300,
                        verified: {}
                    }
                };
            }
            if (!db[chatId].captcha) {
                db[chatId].captcha = {
                    enabled: false,
                    kickAfter: 300,
                    verified: {}
                };
            }
            if (!db[chatId].captcha.verified) {
                db[chatId].captcha.verified = {};
            }

            try {
                await ctx.telegram.restrictChatMember(chatId, targetUserId, {
                    can_send_messages: true,
                    can_send_media_messages: true,
                    can_send_polls: true,
                    can_send_other_messages: true,
                    can_add_web_page_previews: true
                });
            } catch (e) {
                console.error('Captcha unrestrict error:', e.message);
                return ctx.answerCbQuery('❌ Không thể mở quyền chat!', { show_alert: true });
            }

            db[chatId].captcha.verified[targetUserId] = Date.now();
            saveDB(db);

            cancelCaptchaKick(chatId, targetUserId);
            await deleteCaptchaMessages(bot, chatId, targetUserId);

            await ctx.answerCbQuery('✅ Xác minh thành công!', { show_alert: true });
        });

        bot.on('message', async (ctx) => {
            const chatId = ctx.chat.id.toString();
            const db = loadDB();

            if (!db[chatId] || !db[chatId].captcha || !db[chatId].captcha.enabled) {
                return;
            }

            const userId = ctx.from.id;
            const verifiedAt = db[chatId].captcha.verified && db[chatId].captcha.verified[userId];

            if (!verifiedAt) {
                try {
                    await ctx.deleteMessage();
                } catch (e) {
                    console.error('Captcha delete message error:', e.message);
                }
            }
        });
    }
};
