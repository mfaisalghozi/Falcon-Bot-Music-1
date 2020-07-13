const ytdlDiscord = require("ytdl-core-discord");
const {
  canModifyQueue
} = require("../util/EvobotUtil");
const {
  MessageEmbed,
  Util,
  client
} = require("discord.js");
const ytdl = require('ytdl-core')
const {
  util
} = require("simple-youtube-api");


module.exports = {
  async play(song, message) {
    const {
      PRUNING
    } = require("../config.json");
    const queue = message.client.queue.get(message.guild.id);

    if (!song) {
      queue.channel.leave();
      message.client.queue.delete(message.guild.id);
      return queue.textChannel.send("🚫 Music queue ended.").catch(console.error);
    }

    try {
      var stream = await ytdlDiscord(song.url, {
        highWaterMark: 1 << 25
      });
    } catch (error) {
      if (queue) {
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      }

      if (error.message.includes("copyright")) {
        return message.channel
          .send("⛔ A video could not be played due to copyright protection ⛔")
          .catch(console.error);
      } else {
        console.error(error);
      }
    }

    queue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id));



    const dispatcher = queue.connection
      .play(stream, {
        type: "opus"
      })
      .on("finish", () => {
        if (collector && !collector.ended) collector.stop();

        if (PRUNING && playingMessage && !playingMessage.deleted)
          playingMessage.delete().catch(console.error);

        if (queue.loop) {
          // if loop is on, push the song back at the end of the queue
          // so it can repeat endlessly
          let lastSong = queue.songs.shift();
          queue.songs.push(lastSong);
          module.exports.play(queue.songs[0], message);
        } else {
          // Recursively play the next song
          queue.songs.shift();
          module.exports.play(queue.songs[0], message);
        }
      })
      .on("error", (err) => {
        console.error(err);
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      });
    dispatcher.setVolumeLogarithmic(queue.volume / 100);

    try {
      let songID = ytdl.getVideoID(`${song.url}`)
      let ytEmbed = new MessageEmbed()

      ytEmbed.edit.setTitle('Falcon Music')
        .setDescription(`⏯️: \`\`Play/Pause\`\` | ⏪: \`\`Backward\`\` | ⏭️: \`\`Skip\`\` | 🔀: \`\`Shuffle\`\` | 🔁: \`\`Loop\`\` | ⏹️: \`\`Stop\`\``)
        .setImage(`http://i3.ytimg.com/vi/${songID}/maxresdefault.jpg`)
        .setTimestamp()
        .setColor('#4dffe7')
        .addField("Music", `**[${song.title}](${song.url})**`)
        .addFields({
          name: 'Duration',
          value: `${(new Date(song.duration * 1000).toISOString().substr(11, 8))}`,
          inline: true
        }, {
          name: 'Uploaded by',
          value: `${song.uploader}`,
          inline: true
        }, )


      var playingMessage = await queue.textChannel.send(ytEmbed);
      await playingMessage.react("⏯");
      await playingMessage.react("⏪");
      await playingMessage.react("⏭");
      await playingMessage.react("🔀");
      await playingMessage.react("🔁");
      await playingMessage.react("⏹");
    } catch (error) {
      console.error(error);
    }

    const filter = (reaction, user) => user.id !== message.client.user.id;
    var collector = playingMessage.createReactionCollector(filter, {
      time: song.duration > 0 ? song.duration * 1000 : 600000
    });

    collector.on("collect", (reaction, user) => {
      if (!queue) return;
      const member = message.guild.member(user);

      switch (reaction.emoji.name) {
        case "⏭":
          queue.playing = true;
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.connection.dispatcher.end();
          queue.textChannel.send(`${user} ⏩ skipped the song`).catch(console.error);
          collector.stop();
          break;

        case "⏯":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          if (queue.playing) {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.pause(true);
            queue.textChannel.send(`${user} ⏸ paused the music.`).catch(console.error);
          } else {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.resume();
            queue.textChannel.send(`${user} ▶ resumed the music!`).catch(console.error);
          }
          break;

        case "🔁":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.loop = !queue.loop;
          queue.textChannel.send(`Loop is now ${queue.loop ? "**on**" : "**off**"}`).catch(console.error);
          break;

        case "⏹":
          reaction.users.remove(user).catch(console.error);
          if (!canModifyQueue(member)) return;
          queue.songs = [];
          queue.textChannel.send(`${user} ⏹ stopped the music!`).catch(console.error);
          try {
            queue.connection.dispatcher.end();
          } catch (error) {
            console.error(error);
            queue.connection.disconnect();
          }
          collector.stop();
          break;

        default:
          reaction.users.remove(user).catch(console.error);
          break;
      }
    });

    collector.on("end", () => {
      playingMessage.reactions.removeAll().catch(console.error);
    });
  }
};