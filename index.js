require("dotenv").config();
const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const {prefix} = require("./config.json");
const myIntents = new Discord.Intents();
myIntents.add(Discord.Intents.FLAGS.GUILDS);
const musicBot = new Discord.Client({intents: myIntents});
// const musicBot = new Discord.Client();

const appToken = process.env.APPTOKEN;

var servers = {}

musicBot.on("ready", () => {
    console.log("TunesBot is ready!");
    console.log("Prefix is "+prefix);
})

musicBot.on("message", message => {
    let args = message.content.substring(prefix.length).split(" ");

    switch (args[0]) {
        case 'p':

            const play = (connection, message) => {
                var server = servers[message.guild.id];

                server.dispatcher = connection.playStream(ytdl(server.queue[0], {filter:"audioonly"}));

                server.queue.shift();

                server.dispatcher.on("end", () => {
                    if (server.queue[0]) {
                        play(connection, message);
                    } else {
                        connection.disconnect();
                    }
                });
            }

            if (!args[1]) {
                message.channel.send("You need to provide a link!");
                return;
            }

            if (!message.member.voiceChannel) {
                message.channel.send("You must be in a voice channel to use the bot!");
                return;
            }

            if (!servers[message.guild.id]) {
                servers[message.guild.id] = {
                    queue: []
                }
            }

            let server = servers[message.guild.id];

            server.queue.push(args[1]);

            if (!message.guild.voiceConnection) {
                message.member.voiceChannel.join().then((connection)=>{
                    play(connection, message);
                })
            }
            break;

        case "next":
            let server = servers[message.guild.id];
            if (server.dispatcher) {
                server.dispatcher.end();
                message.channel.send("Skipping to next song");
            }
            break;
        
        case "stop":
            var server = servers[message.guild.id];
            if(message.guild.voiceConnection) {
                for (let i = server.queue.length - 1; i >= 0; i--) {
                    server.queue.splice(i, 1);
                }

                server.dispatcher.end();
                console.log("Stopped the queue");
            }

            if(message.guild.connection) {
                message.guild.voiceConnection.disconnect();
            }
            break;
    }
});

// This wil make the bot go online
musicBot.login(appToken);
