require('dotenv').config();
const Discord = require('discord.js');

const client = new Discord.Client();

client.login(process.env.SH_TOKEN);


client.on('ready', () => {
  console.log('Bot is ready');
  client.user.setActivity('Type timer!help');
});

const COMMANDS = [
  'timer!start',
  'timer!stop',
  'timer!status',
  'timer!help',
  'timer!clear',
];

class Pomodoro {
  constructor(
    workTime,
    smallBreak,
    bigBreak,
    connection,
    id,
    message,
    textOnly
  ) {
    this.id = id;
    this.workTime = workTime;
    this.smallBreak = smallBreak;
    this.bigBreak = bigBreak;
    this.connection = connection;
    this.message = message;
    this.time = 1;
    this.timerStartedTime = new Date();
    this.dispatcher = null;
    this.timer = null;
    this.timerInterval = null;
    this.alertText = '';
    this.interval = null;

    this.startANewCycle();
  }

  startANewCycle() {
    try {
      if (this.time % 2 != 0 && this.time != 7) {
        this.interval = this.workTime;
        this.alertText = `You worked for ${
          this.workTime / 60000
        }min! Time for a small break of ${this.smallBreak / 60000}min!`;
      } else if (this.time == 7) {
        this.interval = this.workTime;
        this.alertText = `You worked for ${
          this.workTime / 60000
        }min! Time for a big break of ${this.bigBreak / 60000}min!`;
      } else if (this.time % 2 == 0 && this.time != 8) {
        this.interval = this.smallBreak;
        this.alertText = `You finished your ${
          this.smallBreak / 60000
        }min break! Let's get back to work!`;
      } else if (this.time == 8) {
        this.interval = this.bigBreak;
        this.alertText = `You finished your ${
          this.bigBreak / 60000
        }min break! Let's get back to work!`;
      }

      this.timerStartedTime = new Date();

      this.timer = setTimeout(() => {
        this.time++;

        //Send Text Alerts
        if (this.textAlerts) {
          this.message.channel.send(this.alertText);
        }

        //Send DM Alerts
        if (this.peopleToDm.length > 0) {
          this.peopleToDm.forEach((person) => {
            try {
              client.users.get(person).send(this.alertText);
            } catch (err) {
              console.log(err);
            }
          });
        }

        //Start a New Cycle
        this.startANewCycle();
      }, this.interval);

      this.timerInterval = setInterval(() => {

        let pomodoro = container.pomodoros.filter(
          (pomodoro) => pomodoro.id == message.guild.id
        );

        if (pomodoro.length == 0) {
          return;
        }

        let now = new Date();
        let timePassed = now.getTime() - pomodoro[0].timerStartedTime.getTime();
        let timeLeft;

        if (pomodoro[0].time % 2 != 0) {
          timeLeft = parseInt((pomodoro[0].workTime - timePassed) / 60000);
          message.channel.send(
            `${timeLeft + 1}mins left`
          );
        } else if (pomodoro[0].time % 2 == 0 && pomodoro[0].time != 8) {
          timeLeft = parseInt((pomodoro[0].smallBreak - timePassed) / 60000);
          message.channel.send(`${timeLeft + 1}mins left`);
        } else {
          timeLeft = parseInt((pomodoro[0].bigBreak - timePassed) / 60000);
          message.channel.send(`${timeLeft + 1}mins left`);
        }
      }, 300000);

    } catch (err) {
      console.log(err);
    }
  }

  stopTimer() {
    clearTimeout(this.timer);
    clearInterval(this.timerInterval);
  }

}

class Container {
  constructor() {
    this.pomodoros = [];
  }

  addPomodoro(pomodoro) {
    this.pomodoros.push(pomodoro);
  }

  removePomodoro(id) {
    this.pomodoros = this.pomodoros.filter((pomodoro) => pomodoro.id != id);
  }
}

let container = new Container();

function checkParams(arg1, arg2, arg3, message) {
  let checked = true;

  if (arg1) {
    if (parseInt(arg1) < 2 || parseInt(arg1) > 60 || isNaN(parseInt(arg1))) {
      message.channel.send('Insert a valid time between 2 and 120 minutes!');
      checked = false;
    }
  }

  if (arg2) {
    if (parseInt(arg2) < 2 || parseInt(arg2) > 60 || isNaN(parseInt(arg2))) {
      message.channel.send('Insert a valid time between 2 and 120 minutes!');
      checked = false;
    }
  }

  if (arg3) {
    if (parseInt(arg3) < 2 || parseInt(arg3) > 60 || isNaN(parseInt(arg3))) {
      message.channel.send('Insert a valid time between 2 and 60 minutes!');
      checked = false;
    }
  }

  return checked;
}

setInterval(() => {
  container.pomodoros.forEach((pomodoro) => {
    console.log(`${pomodoro.id}: ${pomodoro.time}: ${pomodoro.textOnly}`);
  });
  console.log('--------------------------');
}, 300000);

client.on('message', async (message) => {
  if (!message.guild) return;

  const args = message.content.trim().split(' ');

  if (args[0] === COMMANDS[0]) {
    //Check arguments
    if (!checkParams(args[1], args[2], args[3], message)) {
      return;
    }

    //Check if there's already a pomodoro running on the server
    let pomodoro = container.pomodoros.filter(
      (pomodoro) => pomodoro.id == message.guild.id
    );

    if (pomodoro.length > 0) {
      message.reply("There's already a pomodoro running!");
      return;
    }

    //Start the pomodoro
    try {
      if (args[1] && args[2] && args[3]) {
        container.addPomodoro(
          new Pomodoro(
            parseInt(args[1] * 60000),
            parseInt(args[2] * 60000),
            parseInt(args[3] * 60000),
            null,
            message.guild.id,
            message,
            true
          )
        );
      } else {
        container.addPomodoro(
          new Pomodoro(
            1500000,
            300000,
            900000,
            null,
            message.guild.id,
            message,
            true
          )
        );
      }
    } catch (err) {
      console.log(err);
      message.channel.send(
        "Error starting Pomodoro Timer!"
      );
      return;
    }

    message.channel.send("Pomodoro started! Let's get to work!");
  }

  //Stop the pomodoro
  if (args[0] == COMMANDS[1]) {
    let pomodoroStop = container.pomodoros.filter(
      (pomodoro) => pomodoro.id == message.guild.id
    );

    if (pomodoroStop.length == 0) {
      message.reply("There's no pomodoro currently running!");
      return;
    }

    pomodoroStop[0].stopTimer();
    container.removePomodoro(message.guild.id);

    message.channel.send('Nice work! Glad I could help!');

  }

  if (args[0] == COMMANDS[2]) {
    let pomodoro = container.pomodoros.filter(
      (pomodoro) => pomodoro.id == message.guild.id
    );

    if (pomodoro.length == 0) {
      message.reply("There's no pomodoro currently running!");
      return;
    }

    let now = new Date();
    let timePassed = now.getTime() - pomodoro[0].timerStartedTime.getTime();
    let timeLeft;

    if (pomodoro[0].time % 2 != 0) {
      timeLeft = parseInt((pomodoro[0].workTime - timePassed) / 60000);
      message.channel.send(
        `${timeLeft + 1}min left to your break! Keep it up!`
      );
    } else if (pomodoro[0].time % 2 == 0 && pomodoro[0].time != 8) {
      timeLeft = parseInt((pomodoro[0].smallBreak - timePassed) / 60000);
      message.channel.send(`${timeLeft + 1}min left to start working!`);
    } else {
      timeLeft = parseInt((pomodoro[0].bigBreak - timePassed) / 60000);
      message.channel.send(`${timeLeft + 1}min left to start working!`);
    }
  }

  if (args[0] == COMMANDS[3]) {
    const helpCommands = new Discord.RichEmbed()
      .setColor('#f00')
      .setTitle('Pomodore commands')
      .setDescription('Here is the list of commands to use the bot!');
			[
				{
          name: 'Start the Pomodoro with default values (25, 5, 15)',
          value: 'timer!start',
					isInline: true
        },
        {
          name: 'Start the Pomodoro with specific values',
          value: 'timer!start [work time] [small break time] [big break time]',
					isInline: true
        },
        {
						name: 'Stop the Pomodoro',
					 	value: 'timer!stop',
						isInline: true
				},
        {
	          name: 'Check the current status of the Pomodoro',
	          value: 'timer!status',
						isInline: true
        },
        {
					name: 'Get the list of commands',
					value: 'timer!help',
					isInline: true
				},
        {
          name: 'Clear messages related to the Pomodoro Timer',
          value: 'timer!clear',
          isInline: true
        }
	].forEach(({name, value, isInline}) => {
	  helpCommands.addField(name, value, isInline)
	})

    message.author.send(helpCommands);
  }


  if (args[0] == COMMANDS[4]) {
    let messagesProcessed = 0;
    let allDeleted = true;
    message.channel
      .fetchMessages({ limit: 30 })
      .then((messages) => {
        messages.forEach((message) => {
          let messageContent = message.content.trim().split(' ');
          if (
            COMMANDS.includes(messageContent[0]) ||
            message.author.id == client.user.id
          ) {
            message
              .delete()
              .then(() => {
                messagesProcessed++;
                if (messagesProcessed == 29) {
                  if (!allDeleted) {
                    message.channel.send(
                      'There was a problem deleting some of the messages! Please check my permissions!'
                    );
                  }
                }
              })
              .catch(() => {
                messagesProcessed++;
                allDeleted = false;

                if (messagesProcessed == 29) {
                  if (!allDeleted) {
                    message.channel.send(
                      'There was a problem deleting some of the messages! Please check my permissions!'
                    );
                  }
                }
              });
          }
        });
      })
      .catch(() => {
        message.channel.send(
          'There was a problem deleting the messages! Please check my permissions!'
        );
      });
  }
});
