const gameStates = require('../../constants/gameStates')

module.exports = function teamStart (room, users) {
  console.log('teamStart controller enter')
  room.gameState = gameStates.TEAM_START
  if (room.turn === 0) room.round++
  room.turn++
  if (room.turn > room.teams.length) {
    room.turn = 1
    room.round++
  }
  room.currentPlayingTeam = room.teams.find(({ order }) => order === room.turn)
  console.log('teamStart controller exit')
  return room
}
