const gameStates = require('../../constants/gameStates')
const { v4: uuidv4 } = require('uuid')

const getNewQuestion = (content, creator) => ({
  content,
  creator,
  id: uuidv4(),
  answers: {}
})

module.exports = function waitingAnswer (room, content, creator) {
  console.log('waitingAnswer controller enter')
  room.gameState = gameStates.WAITING_ANSWER
  room.currentQuestion = getNewQuestion(content, creator)
  console.log('waitingAnswer controller exit')
  return room
}
