const { MessageEmbed } = require("discord.js");
const ytdl = require('ytdl-core')

module.exports = {
  name: "np",
  description: "Show now playing song",
  execute(message) {
    const queue = message.client.queue.get(message.guild.id);
    if (!queue) return message.reply("There is nothing playing.").catch(console.error);
    const song = queue.songs[0];

    let songID = ytdl.getVideoID(`${song.url}`)
    let nowPlaying = new MessageEmbed()
      .setTitle("Now playing")
      .setThumbnail(`http://i3.ytimg.com/vi/${songID}/hqdefault.jpg`)
      .setDescription(`[${song.title}](${song.url})`)
      .setColor("#4dffe7")
      .setTimestamp();

    if (song.duration > 0) nowPlaying.setFooter(new Date(song.duration * 1000).toISOString().substr(11, 8));

    return message.channel.send(nowPlaying);
  }
};
