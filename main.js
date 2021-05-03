const constants = require('./constants')
const schedule = require('node-schedule')
const Discord = require('discord.js')
const client = new Discord.Client()

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

let members = new Set()
const projectEnd = new Date('May 23, 2021 23:59:59') // project end date - Sunday, May 23rd
let channel = undefined

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
  console.log("Current time in heroku dyno: ", new Date().getDay())
  channel = client.channels.cache.get(process.env.BOT_RESIDING_CHANNEL_ID)
  job(channel)
})

client.on('message', msg => {
  const message = msg.content.toLowerCase()
  if (message.includes('yesterday') && message.includes('today')) {
    if (members.has(msg.author.id)) {
      msg
        .react(constants.emojis.SUCCESS)
        .then(() => {
          members.delete(msg.author.id)
          if (members.size === 0) {
            channel.send('Thanks everyone for today\'s daily standup!')
          } else {
            channel.send(`${members.size} / ${Object.values(constants.members).length} left.`)
          }
        })
        .catch(e => console.error(e))
    }
  }
})

const job = channel =>
  schedule.scheduleJob('57 16 * * *', () => { // heroku dyno is 7 hrs ahead of local time => repeats at 9:57AM everyday
    resetMembers()

    let current = new Date()
    current.setHours(current.getHours() - constants.TIME_DIFF) // time diff between heroky dyno and local time

    if (current.getDay() !== 0 && current.getTime() < projectEnd.getTime()) {
      // if today's not Sunday,
      channel.send(
        `==================================================\n=== ${current} ===\nM O R N I N G  G U Y S @everyone`
      )
    }
  })

function resetMembers () {
  for (let member of Object.values(constants.members)) {
    members.add(member)
  }
}

client.login(process.env.BOT_TOKEN)