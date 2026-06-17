module.exports = (bot, { loadDB }) => {
    bot.on('text', async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const db = loadDB();

        if (!db[chatId] || !db[chatId].autoreply || !db[chatId].autoreply.enabled) {
            return;
        }

        const text = (ctx.message.text || '').toLowerCase();
        const rules = db[chatId].autoreply.rules || {};

        for (const keyword in rules) {
            if (text.includes(keyword.toLowerCase())) {
                await ctx.reply(
                    '<b>╔══════════════════════════════╗</b>\n' +
                    '<b>║</b>   💬 AUTO REPLY           <b>║</b>\n' +
                    '<b>╠══════════════════════════════╣</b>\n\n' +
                    `${rules[keyword]}\n\n` +
                    '<b>╚══════════════════════════════╝</b>'
                );
                break;
            }
        }
    });
};
