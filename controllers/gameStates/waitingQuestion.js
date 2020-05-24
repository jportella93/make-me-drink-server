const gameStates = require('../../constants/gameStates')

module.exports = function waitingQuestion (room, users) {
  console.log('waitingQuestion controller enter')
  room.gameState = gameStates.WAITING_QUESTION
  console.log('waitingQuestion controller exit')
  return room
}
