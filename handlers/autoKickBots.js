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
                const botMention = `<a href="tg://user?id=${botMember.id}">${botMember.first_name || botMember.username || 'Bot'}</a>`;
                await ctx.replyWithHTML(
                    '<b>╔══════════════════════════════╗</b>\n' +
                    '<b>║</b>   🤖 KICK BOT              <b>║</b>\n' +
                    '<b>╠══════════════════════════════╣</b>\n\n' +
                    `${botMention} đã bị kick khỏi group!\n\n` +
                    '<b>╚══════════════════════════════╝</b>'
                );
            } catch (e) {
                console.error('Auto kick bots error:', e.message);
            }
        }
    });
};
