const gameStates = require('../../constants/gameStates')

module.exports = function finalResult (room, users) {
  console.log('finalResult controller enter')
  room.gameState = gameStates.FINAL_RESULT
  console.log('finalResult controller exit')
  return room
}
