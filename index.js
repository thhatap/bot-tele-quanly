const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const welcomeCommand = require('./commands/welcome');
const warnCommand = require('./commands/warn');
const muteCommand = require('./commands/mute');
const antiLinkCommand = require('./commands/antilink');
const autoReplyCommand = require('./commands/autoReply');
const antiPornCommand = require('./commands/antiPorn');
const autoDeleteLinksCommand = require('./commands/autoDeleteLinks');
const autoClearCommand = require('./commands/autoClear');
const autoKickBotsCommand = require('./commands/autoKickBots');
const staffCommand = require('./commands/staff');
const helpCommand = require('./commands/help');
const startCommand = require('./commands/start');
const memberActivityHandler = require('./handlers/memberActivity');
const moderationActionsHandler = require('./handlers/moderationActions');
const antiLinkHandler = require('./handlers/antiLink');
const captchaHandler = require('./handlers/captcha');
const autoReplyHandler = require('./handlers/autoReply');
const antiPornHandler = require('./handlers/antiPorn');
const autoDeleteLinksHandler = require('./handlers/autoDeleteLinks');
const autoClearHandler = require('./handlers/autoClear');
const autoKickBotsHandler = require('./handlers/autoKickBots');
const staffHandler = require('./handlers/staff');

const bot = new Telegraf('8894665369:AAGEyZrRoD5xIcXabhnznmqarv4BpnnVtwU');
const dbPath = './database.json';

function loadDB() {
    if (!fs.existsSync(dbPath)) return {};
    try { return JSON.parse(fs.readFileSync(dbPath, "utf8")); } catch (e) { return {}; }
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

bot.on('new_chat_members', (ctx) => {
    let db = loadDB();
    if (!db.groups) db.groups = [];

    const botInfo = ctx.botInfo;
    const isBotAdded = ctx.message.new_chat_members.some(m => m.id === botInfo.id);

    if (isBotAdded) {
        const chat = ctx.chat;
        const existing = db.groups.find(g => g.id === chat.id);

        if (!existing) {
            db.groups.push({
                id: chat.id,
                title: chat.title,
                username: chat.username || null
            });
            saveDB(db);
            console.log(`✅ Bot đã tham gia nhóm: ${chat.title}`);
        }
    }
});

bot.on('migrate_to_chat', (ctx) => {
    let db = loadDB();
    if (!db.groups) db.groups = [];

    const oldId = ctx.chat.id;
    const newId = ctx.update.message.migrate_to_chat_id;

    const groupIndex = db.groups.findIndex(g => g.id === oldId);
    if (groupIndex !== -1) {
        db.groups[groupIndex].id = newId;
        saveDB(db);
        console.log(`🔄 Nhóm đổi ID: ${oldId} -> ${newId}`);
    }
});

bot.on('left_chat_member', (ctx) => {
    let db = loadDB();
    if (!db.groups) db.groups = [];

    const botInfo = ctx.botInfo;
    const leftUser = ctx.message.left_chat_member;

    if (leftUser.id === botInfo.id) {
        db.groups = db.groups.filter(g => g.id !== ctx.chat.id);
        saveDB(db);
        console.log(`❌ Bot đã rời nhóm: ${ctx.chat.title}`);
    }
});

console.log("🚀 Lên mã! Động cơ Lễ Tân Telegraf đang chạy...");

welcomeCommand(bot, { loadDB, saveDB });
warnCommand(bot, { loadDB, saveDB });
muteCommand(bot, { loadDB, saveDB });
antiLinkCommand(bot, { loadDB, saveDB });
autoReplyCommand(bot, { loadDB, saveDB });
antiPornCommand(bot, { loadDB, saveDB });
autoDeleteLinksCommand(bot, { loadDB, saveDB });
autoClearCommand(bot, { loadDB, saveDB });
autoKickBotsCommand(bot, { loadDB, saveDB });
staffCommand(bot, { loadDB });
helpCommand(bot, { loadDB });
startCommand(bot, { loadDB, saveDB });

memberActivityHandler(bot, { loadDB, saveDB });
moderationActionsHandler(bot, { loadDB, saveDB });
antiLinkHandler(bot, { loadDB, saveDB });
captchaHandler.handler(bot, { loadDB, saveDB });
autoReplyHandler(bot, { loadDB });
antiPornHandler(bot, { loadDB, saveDB });
autoDeleteLinksHandler(bot, { loadDB });
autoClearHandler(bot, { loadDB });
autoKickBotsHandler(bot, { loadDB });
staffHandler(bot, { loadDB });

bot.catch((err, ctx) => {
    console.log(`Lỗi ngầm: ${ctx.updateType}`, err);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
