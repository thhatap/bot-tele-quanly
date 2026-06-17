const { scheduleCaptchaKick, addPendingCaptcha } = require('./captcha');

module.exports = (bot, { loadDB, saveDB }) => {
    // ========= HANDLER CHÍNH CHO WELCOME (Telegram API 5.0+) =========
    bot.on('chat_member', async (ctx) => {
        const chatMember = ctx.chatMember;
        const newStatus = chatMember.new_chat_member.status;
        const oldStatus = chatMember.old_chat_member.status;

        console.log(`[Welcome-chat_member] Update received: ${oldStatus} -> ${newStatus}`);

        // Chỉ xử lý khi user CHÍNH THỨC trở thành member (không phải rejoin hay thay đổi khác)
        const validStatuses = ['member', 'joined'];
        if (!validStatuses.includes(newStatus)) {
            console.log(`[Welcome-chat_member] Bỏ qua, status mới: ${newStatus}`);
            return;
        }

        // Bỏ qua nếu user đã là member trước đó (rejoin)
        if (validStatuses.includes(oldStatus)) {
            console.log(`[Welcome-chat_member] Bỏ qua, user đã là member từ trước`);
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
        const welcomeText = db[chatId].text.replace(/{name}/g, userMention);

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
                console.log(`[Welcome-chat_member] Đã restrict ${userName}`);
            } catch (e) {
                console.error(`[Welcome-chat_member] Lỗi restrict:`, e.message);
            }

            replyMarkup.inline_keyboard.push([
                { text: '✅ Xác minh để chat', callback_data: `welcome_captcha:${chatId}:${newUser.id}` }
            ]);

            scheduleCaptchaKick(bot, chatId, newUser.id, userName, db[chatId].captcha.kickAfter || 300);
        }

        // Format embed mới
        const embedMsg =
            '<b>╔══════════════════════════════╗</b>\n' +
            '<b>║</b>   🎉 CHÀO MỪNG           <b>║</b>\n' +
            '<b>╠══════════════════════════════╣</b>\n\n' +
            `${userMention} đã tham gia nhóm!\n\n` +
            `<i>${welcomeText}</i>\n\n` +
            '<b>╚══════════════════════════════╝</b>';

        try {
            await ctx.replyWithHTML(embedMsg, {
                reply_markup: replyMarkup,
                disable_web_page_preview: true
            });
            console.log(`[Welcome-chat_member] Đã gửi lời chào cho ${userName} (${newUser.id})`);
        } catch (err) {
            console.error(`[Welcome-chat_member] Lỗi gửi lời chào:`, err.message);
        }
    });

    // ========= XỬ LÝ KHI USER RỜI NHÓM =========
    bot.on('left_chat_member', async (ctx) => {
        const leftUser = ctx.message.left_chat_member;
        if (leftUser.is_bot) return;

        console.log(`[LeftMember] User ${leftUser.first_name || leftUser.id} đã rời nhóm ${ctx.chat.id}`);
        ctx.deleteMessage().catch(() => {});
    });

    // ========= HANDLER CŨ (GIỮ LẠI ĐỂ DỰ PHÒNG) =========
    bot.on('new_chat_members', async (ctx) => {
        console.log(`[Welcome-new_chat_members] Event nhận được (backup handler)`);

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
            const welcomeText = db[chatId].text.replace(/{name}/g, userMention);

            const replyMarkup = {
                inline_keyboard: [
                    [
                        { text: '🎬 Vào Kênh Video', url: 'https://t.me/Thay_Link_Kenh_Vao_Day' },
                        { text: '💬 Nhắn Admin', url: 'https://t.me/Thay_User_Name_Vao_Day' }
                    ]
                ]
            };

            let welcomeMessageId = null;

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

            // Format embed mới
            const embedMsg =
                '<b>╔══════════════════════════════╗</b>\n' +
                '<b>║</b>   🎉 CHÀO MỪNG           <b>║</b>\n' +
                '<b>╠══════════════════════════════╣</b>\n\n' +
                `${userMention} đã tham gia nhóm!\n\n` +
                `<i>${welcomeText}</i>\n\n` +
                '<b>╚══════════════════════════════╝</b>';

            try {
                const sentMessage = await ctx.replyWithHTML(embedMsg, {
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
};
