module.exports = (bot, { loadDB }) => {
    bot.on('new_chat_members', async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const db = loadDB();

        if (!db[chatId] || !db[chatId].autokickbots || !db[chatId].autokickbots.enabled) {
            return;
        }

        const newMembers = ctx.message.new_chat_members || [];
        const botMembers = newMembers.filter(member => member.is_bot);
        if (!botMembers.length) {
            return;
        }

        for (const botMember of botMembers) {
            try {
                await ctx.telegram.banChatMember(chatId, botMember.id);
                await ctx.telegram.unbanChatMember(chatId, botMember.id);
                await ctx.replyWithHTML(`🤖 <b>ĐÃ KICK BOT</b>\n\nBot <a href="tg://user?id=${botMember.id}">${botMember.first_name || botMember.username || 'Bot'}</a> đã bị kick khỏi group!`);
            } catch (e) {
                console.error('Auto kick bots error:', e.message);
            }
        }
    });
};
