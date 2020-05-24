const gameStates = require('../../constants/gameStates')
const finalResultController = require('./finalResult')

module.exports = function teamStart (room, users) {
  console.log('teamStart controller enter')
  room.gameState = gameStates.TEAM_START
  if (room.turn === 0) room.round++
  room.turn++
  if (room.turn > room.teams.length) {
    room.turn = 1
    room.round++
  }
  if (room.round > room.maxRounds) {
    return finalResultController(room, users)
  }
  room.currentPlayingTeam = room.teams.find(({ order }) => order === room.turn)
  console.log('teamStart controller exit')
  return room
}
