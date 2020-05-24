const gameStates = require('../../constants/gameStates')

const areDifferentAnswers = (answers) =>
  !answers.every(el => el === answers[0])

module.exports = function answerResult (room, users) {
  console.log('answerResult controller enter')
  room.gameState = gameStates.ANSWER_RESULT
  const { currentQuestion } = room

  const currentPlayingTeamId = room.currentPlayingTeam.id
  const questionCreatorTeamId = room.teams.find(({ members }) =>
    members.includes(currentQuestion.creator.id)).id

  const answers = Object.values(currentQuestion.answers)
  currentQuestion.outcome = areDifferentAnswers(answers)
    ? ({
      differentAnswers: true,
      pointsUpdate: {
        [currentPlayingTeamId]: 1
      }
    }
    )
    : ({
      differentAnswers: false,
      pointsUpdate: {
        [currentPlayingTeamId]: -1,
        [questionCreatorTeamId]: 2
      }
    })
  console.log('answerResult controller exit')
  return room
}
