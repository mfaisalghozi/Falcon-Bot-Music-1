/**
 * Module Imports
 */
const {
  Client,
  Collection,
  MessageEmbed
} = require("discord.js");
const {
  readdirSync
} = require("fs");
const {
  join
} = require("path");
const {
  TOKEN_FALCON,
  TOKEN_TEST,
  PREFIX
} = require("./config.json");

const client = new Client({
  disableMentions: "everyone"
});

client.commands = new Collection();
client.prefix = PREFIX;
client.queue = new Map();
const cooldowns = new Collection();
const ytEmbed = new MessageEmbed()
/**
 * Client Events
 */
client.on("ready", async () => {
  console.log(`${client.user.username} ready!`);
  client.user.setActivity(`${PREFIX}help`);

  var musicChannel = client.channels.cache.get('730616169140322345');
  try {
    ytEmbed.setTitle('Official Falcon Music Bot')
    ytEmbed.setImage(`https://cdn.discordapp.com/attachments/647717447373160450/666519007960236032/245.jpg`)
    ytEmbed.setColor('#4dffe7')

    var playingMessage = await musicChannel.send(ytEmbed);
    await playingMessage.react("⏯");
    await playingMessage.react("⏪");
    await playingMessage.react("⏭");
    await playingMessage.react("🔀");
    await playingMessage.react("🔁");
    await playingMessage.react("⏹");

  } catch (error) {
    console.error(error);
  }
});

client.on("warn", (info) => console.log(info));
client.on("error", console.error);

/**
 * Import all commands
 */
const commandFiles = readdirSync(join(__dirname, "commands")).filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(join(__dirname, "commands", `${file}`));
  client.commands.set(command.name, command);
}

client.on("message", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // if (message.content.startsWith(PREFIX)) {
  //   const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  //   const commandName = args.shift().toLowerCase();
  //   console.log(args)
  //   const command =
  //     client.commands.get(commandName) ||
  //     client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

  //   if (!command) return;

  //   if (!cooldowns.has(command.name)) {
  //     cooldowns.set(command.name, new Collection());
  //   }

  //   const now = Date.now();
  //   const timestamps = cooldowns.get(command.name);
  //   const cooldownAmount = (command.cooldown || 1) * 1000;

  //   if (timestamps.has(message.author.id)) {
  //     const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

  //     if (now < expirationTime) {
  //       const timeLeft = (expirationTime - now) / 1000;
  //       return message.reply(
  //         `please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`
  //       );
  //     }
  //   }

  //   timestamps.set(message.author.id, now);
  //   setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  //   try {
  //     command.execute(message, args);
  //   } catch (error) {
  //     console.error(error);
  //     message.reply("There was an error executing that command.").catch(console.error);
  //   }
  // }

  if (message.channel.id == '730616169140322345') {
    if (message.author.bot) return;
    if (!message.guild) return;

    const args = message.content.trim().split(/ +/);
    const commandName = 'p';

    const command =
      client.commands.get(commandName) ||
      client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (!cooldowns.has(command.name)) {
      cooldowns.set(command.name, new Collection());
    }
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 1) * 1000;

    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(
          `please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`
        );
      }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    try {
      command.execute(message, args);
    } catch (error) {
      console.error(error);
      message.reply("There was an error executing that command.").catch(console.error);
    }
    message.delete();
  }

});

client.login(TOKEN_TEST);