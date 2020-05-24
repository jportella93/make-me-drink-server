const makingTeamsController = require('./makingTeams')

module.exports = function gameStart (room, users) {
  console.log('gameStart controller enter')
  room.round = 0
  room.turn = 0
  room.teams = []
  room.currentPlayingTeam = null
  room.currentQuestion = null

  console.log('gameStart controller exit')
  return makingTeamsController(room, users)
}
