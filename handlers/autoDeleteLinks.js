function containsLink(message) {
    if (!message) return false;

    const linkRegex = /(https?:\/\/|t\.me\/|telegram\.me\/|telegram\.dog\/|@[A-Za-z0-9_]{5,32})/;

    if (message.text && linkRegex.test(message.text)) return true;
    if (message.caption && linkRegex.test(message.caption)) return true;

    if (message.entities && message.entities.some(entity => entity.type === 'url' || entity.type === 'mention')) return true;
    if (message.caption_entities && message.caption_entities.some(entity => entity.type === 'url' || entity.type === 'mention')) return true;

    return false;
}

module.exports = (bot, { loadDB }) => {
    bot.on('message', async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const db = loadDB();

        if (!db[chatId] || !db[chatId].autodeletelinks || !db[chatId].autodeletelinks.enabled) {
            return;
        }

        const fromId = ctx.from.id;

        try {
            const admins = await ctx.getChatAdministrators();
            const isAdmin = admins.some(admin => admin.user.id === fromId);
            if (isAdmin) {
                return;
            }
        } catch (e) {
            console.error('Auto delete links admin check error:', e.message);
        }

        if (containsLink(ctx.message)) {
            try {
                await ctx.deleteMessage();
            } catch (e) {
                console.error('Auto delete links delete error:', e.message);
            }
        }
    });
};
