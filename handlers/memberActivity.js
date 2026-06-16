const { scheduleCaptchaKick, addPendingCaptcha } = require('./captcha');

module.exports = (bot, { loadDB, saveDB }) => {
    bot.on('new_chat_members', async (ctx) => {
        const deleteOk = await ctx.deleteMessage().catch(() => false);
        if (!deleteOk) {
            console.log(`[Welcome] Không thể xóa tin nhắn hệ thống join trong nhóm ${ctx.chat.id}`);
        }

        const chatId = ctx.chat.id.toString();
        const db = loadDB();

        if (!db[chatId]) {
            console.log(`[Welcome] Nhóm ${chatId} chưa có cấu hình trong DB`);
            return;
        }

        if (!db[chatId].active) {
            console.log(`[Welcome] Nhóm ${chatId} đang tắt chế độ welcome`);
            return;
        }

        const members = ctx.message.new_chat_members;
        if (!members || !Array.isArray(members) || members.length === 0) {
            console.log(`[Welcome] Không có danh sách thành viên mới trong update`);
            return;
        }

        const captchaEnabled = db[chatId].captcha && db[chatId].captcha.enabled;

        for (const user of members) {
            if (user.is_bot) {
                console.log(`[Welcome] Bỏ qua bot ${user.id}`);
                continue;
            }

            const userName = user.first_name || "Đại ca";
            const userMention = `<a href="tg://user?id=${user.id}">${userName}</a>`;
            const welcomeMsg = db[chatId].text.replace(/{name}/g, userMention);

            const replyMarkup = {
                inline_keyboard: [
                    [
                        { text: '🎬 Vào Kênh Video', url: 'https://t.me/Thay_Link_Kenh_Vao_Day' },
                        { text: '💬 Nhắn Admin', url: 'https://t.me/Thay_User_Name_Vao_Day' }
                    ]
                ]
            };

            let welcomeMessageId = null;
            let captchaMessageId = null;

            if (captchaEnabled) {
                try {
                    await ctx.telegram.restrictChatMember(chatId, user.id, {
                        can_send_messages: false,
                        can_send_media_messages: false,
                        can_send_polls: false,
                        can_send_other_messages: false,
                        can_add_web_page_previews: false
                    });
                } catch (e) {
                    console.error(`[Welcome] Lỗi restrict ${userName}:`, e.message);
                }

                replyMarkup.inline_keyboard.push([
                    { text: '✅ Xác minh để chat', callback_data: `welcome_captcha:${chatId}:${user.id}` }
                ]);

                scheduleCaptchaKick(bot, chatId, user.id, userName, db[chatId].captcha.kickAfter || 300);
            }

            try {
                const sentMessage = await ctx.replyWithHTML(welcomeMsg, {
                    reply_markup: replyMarkup,
                    disable_web_page_preview: true
                });
                welcomeMessageId = sentMessage.message_id;
                console.log(`[Welcome] Đã gửi lời chào cho ${userName} (${user.id}) messageId: ${welcomeMessageId}`);
            } catch (err) {
                console.error(`[Welcome] Lỗi gửi lời chào cho ${userName}:`, err.message);
            }

            if (captchaEnabled && welcomeMessageId) {
                addPendingCaptcha(chatId, user.id, [welcomeMessageId]);
            }
        }
    });

    bot.on('left_chat_member', async (ctx) => {
        ctx.deleteMessage().catch(() => {});
    });

    // ========= HANDLER MỚI CHO TELEGRAM API 5.0+ =========
    bot.on('chat_member', async (ctx) => {
        const chatMember = ctx.chatMember;

        if (chatMember.new_chat_member.status !== 'member') {
            return;
        }

        const chatId = ctx.chat.id.toString();
        const newUser = chatMember.new_chat_member.user;

        if (newUser.is_bot) {
            console.log(`[Welcome-chat_member] Bot ${newUser.id} được thêm, bỏ qua`);
            return;
        }

        const db = loadDB();

        if (!db[chatId]) {
            console.log(`[Welcome-chat_member] Nhóm ${chatId} chưa có cấu hình`);
            return;
        }

        if (!db[chatId].active) {
            console.log(`[Welcome-chat_member] Nhóm ${chatId} đang tắt welcome`);
            return;
        }

        const userName = newUser.first_name || "Đại ca";
        const userMention = `<a href="tg://user?id=${newUser.id}">${userName}</a>`;
        const welcomeMsg = (db[chatId].text || '🎉 Chào mừng {name}!').replace(/{name}/g, userMention);

        const replyMarkup = {
            inline_keyboard: [
                [
                    { text: '🎬 Vào Kênh Video', url: 'https://t.me/Thay_Link_Kenh_Vao_Day' },
                    { text: '💬 Nhắn Admin', url: 'https://t.me/Thay_User_Name_Vao_Day' }
                ]
            ]
        };

        const captchaEnabled = db[chatId].captcha && db[chatId].captcha.enabled;

        if (captchaEnabled) {
            try {
                await ctx.telegram.restrictChatMember(chatId, newUser.id, {
                    can_send_messages: false,
                    can_send_media_messages: false,
                    can_send_polls: false,
                    can_send_other_messages: false,
                    can_add_web_page_previews: false
                });
            } catch (e) {
                console.error(`[Welcome-chat_member] Lỗi restrict:`, e.message);
            }

            replyMarkup.inline_keyboard.push([
                { text: '✅ Xác minh để chat', callback_data: `welcome_captcha:${chatId}:${newUser.id}` }
            ]);

            scheduleCaptchaKick(bot, chatId, newUser.id, userName, db[chatId].captcha.kickAfter || 300);
        }

        try {
            await ctx.replyWithHTML(welcomeMsg, {
                reply_markup: replyMarkup,
                disable_web_page_preview: true
            });
            console.log(`[Welcome-chat_member] Đã gửi lời chào cho ${userName} (${newUser.id})`);
        } catch (err) {
            console.error(`[Welcome-chat_member] Lỗi gửi lời chào:`, err.message);
        }
    });
};
