const gameStates = require('../../constants/gameStates')

module.exports = function teamStart (room, users) {
  console.log('teamStart controller enter')
  room.gameState = gameStates.TEAM_START
  if (room.turn === room.teams.length) {
    room.turn = 0
    room.roundsPlayed++
  } else room.turn++
  room.currentPlayingTeam = room.teams.find(({ order }) => order === room.turn)
  console.log('teamStart controller exit')
  return room
}
