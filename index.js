const axios = require('axios').default;
const BootBot = require('bootbot');
const config = require('config');

// Setup
  var port = process.env.PORT || config.get('PORT');

  const bot = new BootBot({
    accessToken: process.env.ACCESS_TOKEN || config.get('ACCESS_TOKEN'),
    verifyToken: process.env.VERIFY_TOKEN || config.get('VERIFY_TOKEN'),
    appSecret: process.env.APP_SECRET || config.get('APP_SECRET')
  });

// API
const API_KEY = process.env.API_KEY || config.get('API_KEY');
const API_URL = `https://superheroapi.com/api/${API_KEY}`;
const api = axios.create({
  baseURL: API_URL,
  timeout: 3000,
});

// Constants
const typing = { typing: true };

/*
** App logic
*/
// Log every message
  bot.on('message', (payload, chat) => {
    const text = payload.message.text;
    console.log(`The user said: ${text}`);
  });


// Help menu
  const help = (payload, chat) => {
    chat.say({
      text: 'Just type SUPERHERO to learn about superhero!',
      options: typing,
      quickReplies: ['SUPERHERO']
    })
  };
  bot.hear(['Help', 'Help me'], help);
  bot.on('postback:HELP', help);

// Hey reaction (button + text)
  const hey = (payload, chat) => {
    chat.say('I cannot wait to give you some information about superheroes.', typing)
      .then(() => chat.say({
        text: 'Just type SUPERHERO and let\'s crack on!',
        options: typing,
        quickReplies: ['SUPERHERO']
      })
    );
  }
  bot.hear(['Hey', 'Hello', 'Hi'], hey);
  bot.on('postback:HEY', hey);
  

// Superhero search
  const superheroStart = (convo) => {
    convo.ask({ text: `Tell me the name of the superhero you want to find`, quickReplies: ['Batman', 'Ironman', 'Deadpool'] }, (payload, convo, data) => {
      const superheroName = payload.message.text;
      convo.set('superheroName', superheroName);

      // CALL API https://superheroapi.com/api/access-token/search/${superheroName}
      api.get('/search/' + superheroName)
        .then(function (response) {
          let superhero = response.data.results[0];
          convo.set('superhero', superhero);
          isCorrect(convo);
        })
        .catch(function (error) {
          convo.say(`I cannot find any superhero with this name, try again.`, typing)
            .then(() => superheroStart(convo))
        });
    });
  };
  bot.hear(['superhero'], (payload, chat) => {
    chat.conversation(convo => superheroStart(convo));
  });
  
  // Is superhero api found correct?
  const isCorrect = (convo) => {
    convo.ask((convo) => {
      const buttons = [
        { type: 'postback', title: 'Yes', payload: 'ANSWER_YES' },
        { type: 'postback', title: 'No', payload: 'ANSWER_NO' },
      ];
      convo.sendButtonTemplate(`Is ${convo.get('superhero').name} the superhero you wanted to find?`, buttons);
    }, (payload, convo, data) => {
      // When user writes a reply that I don't know
      convo.say(`I guess the superhero is not correct.`).then(() => superheroStart(convo));
    }, 
    [
      {
        event: 'postback:ANSWER_YES',
        callback: (payload, convo) => {
          convo.say(`Great! Let's teach you something about this superhero`).then(() => superheroMore(convo));
        }
      },
      {
        event: 'postback:ANSWER_NO',
        callback: (payload, convo) => {
          convo.say(`I am sorry. You can try again.`).then(() => superheroStart(convo));
        }
      },
      {
        pattern: ['yes', /yea(h)?/i, 'yup'],
        callback: () => {
          convo.say(`Great! Let's teach you something about this superhero`).then(() => superheroMore(convo));
        }
      }
    ]);
  };

    // Information about superhero selector
    const superheroMore = (convo) => {
      convo.ask((convo) => {
        const buttons = [
          { type: 'postback', title: 'Powerstats', payload: 'ANSWER_POWERSTATS' },
          { type: 'postback', title: 'Biography', payload: 'ANSWER_BIOGRAPHY' },
          //{ type: 'postback', title: 'Appearance', payload: 'ANSWER_APPEARANCE' },
          { type: 'postback', title: 'Image', payload: 'ANSWER_IMAGE' },
        ];
        convo.sendButtonTemplate(`What would you like to know about ${convo.get('superhero').name}? Say STOP to cancel.`, buttons);
      }, (payload, convo, data) => {
        // When user writes a reply that I don't know
        convo.say(`I don't understand. Try again.`).then(() => superheroMore(convo));
      }, 
      [
        {
          event: 'postback:ANSWER_POWERSTATS',
          callback: (payload, convo) => {
            let superhero = convo.get('superhero');
            convo.say(`Here are ${superhero.name} powerstats:`).then(() => superheroStats(convo, superhero.powerstats));
          }
        },
        {
          event: 'postback:ANSWER_BIOGRAPHY',
          callback: (payload, convo) => {
            let superhero = convo.get('superhero');
            convo.say(`Here is ${superhero.name} biography:`).then(() => superheroStats(convo, superhero.biography));
          }
        },
        {
          event: 'postback:ANSWER_IMAGE',
          callback: (payload, convo) => {
            convo.say(`Here is how ${convo.get('superhero').name} looks like:`).then(() => superheroImage(convo));
          }
        },
        {
          pattern: ['stop'],
          callback: () => {
            convo.say(`Ok! You've had enough. If you want you can look at another superheroes.`).then(() => superheroStart(convo));
          }
        },
        {
          pattern: ['powerstats'],
          callback: (payload, convo) => {
            let superhero = convo.get('superhero');
            convo.say(`Here are ${superhero.name} powerstats:`).then(() => superheroStats(convo, superhero.powerstats));
          }
        },
        {
          pattern: ['biography'],
          callback: (payload, convo) => {
            let superhero = convo.get('superhero');
            convo.say(`Here is ${superhero.name} bibliography:`).then(() => superheroStats(convo, superhero.bibliography));
          }
        },
        {
          pattern: ['appearance'],
          callback: (payload, convo) => {
            let superhero = convo.get('superhero');
            convo.say(`Here is ${superhero.name}s appearance:`).then(() => superheroStats(convo, superhero.appearance));
          }
        },
        {
          pattern: ['work'],
          callback: (payload, convo) => {
            let superhero = convo.get('superhero');
            convo.say(`Here is ${superhero.name}s work:`).then(() => superheroStats(convo, superhero.work));
          }
        },
        {
          pattern: ['connections'],
          callback: (payload, convo) => {
            let superhero = convo.get('superhero');
            convo.say(`Here are ${superhero.name}s connections:`).then(() => superheroStats(convo, superhero.connections));
          }
        },
        {
          pattern: ['image'],
          callback: (payload, convo) => {
            convo.say(`Here is how ${convo.get('superhero').name} looks like:`).then(() => superheroImage(convo));
          }
        },
      ]);
    };

      // Print all the different stats
      const superheroStats = (convo, stats) => {
        statsArray = [];
        for (const [key, value] of Object.entries(stats)) {
          let statsValue = value;
          if (Array.isArray(value)) {
            statsValue = value.join(", ");
          }
          statsArray.push(`${key}: ${statsValue}`);
        }

        convo.say(statsArray, typing)
          .then(() => superheroMore(convo));
      }

      // Print image
      const superheroImage = (convo) => {
        let imageUrl = convo.get('superhero').image.url;

        convo.say({
          attachment: 'image',
          url: imageUrl,
          options: typing,
        })
        .then(() => superheroMore(convo));
      }






// On first load
  bot.setGetStartedButton((payload, chat) => {
    chat.say({
      text: 'Hey, I am UCL Chatbot.',
      options: typing,
      quickReplies: ['Hey', 'Hello', 'Help me']
    })
  });

// Start bot
  bot.start(port);