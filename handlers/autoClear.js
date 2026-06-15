module.exports = (bot, { loadDB }) => {
    bot.on('message', async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const db = loadDB();

        if (!db[chatId] || !db[chatId].autoclear || !db[chatId].autoclear.enabled) {
            return;
        }

        if (!db[chatId].autoclear._interval) {
            db[chatId].autoclear._interval = setInterval(async () => {
                try {
                    let deleted = 0;
                    let cursor = null;

                    while (true) {
                        const history = await ctx.telegram.getChatHistory(chatId, { limit: 100, offset: cursor });
                        const messages = history[0] || [];
                        if (!messages.length) break;

                        const idsToDelete = messages.map(m => m.message_id);
                        if (idsToDelete.length > 0) {
                            await ctx.telegram.deleteMessages(chatId, idsToDelete);
                            deleted += idsToDelete.length;
                        }
                        cursor = messages[messages.length - 1].message_id - 1;
                        if (messages.length < 100) break;
                    }
                } catch (e) {
                    console.error('Auto clear error:', e.message);
                }
            }, db[chatId].autoclear.interval || 3600000);

            saveDB(db);
        }
    });
};
