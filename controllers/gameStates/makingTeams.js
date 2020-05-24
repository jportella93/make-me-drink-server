const gameStates = require('../../constants/gameStates')
const { v4: uuidv4 } = require('uuid')

function shuffleArray (a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getMixedPairs (arr1, arr2) {
  const mixedPairs = []
  for (let i = 0; i < Math.max(arr1.length, arr2.length); i++) {
    const value1 = arr1[i]
    const value2 = arr2[i]
    if (value1 && value2) mixedPairs.push([value1, value2])
    else if (value1) mixedPairs[mixedPairs.length - 1].push(value1)
    else if (value2) mixedPairs[mixedPairs.length - 1].push(value2)
  }
  return mixedPairs
}

const getNewTeam = (members, i) => ({
  name: null,
  members,
  leader: members[0],
  id: uuidv4(),
  points: 0,
  order: i + 1
})

module.exports = function makingTeams (room, users) {
  console.log('makingTeams controller enter')
  const shuffledUsers = shuffleArray([...room.users])
  const middle = Math.floor(shuffledUsers.length / 2)
  const teams = getMixedPairs(
    shuffledUsers.slice(0, middle), shuffledUsers.slice(middle))
    .map(getNewTeam)
  room.teams = teams
  room.gameState = gameStates.MAKING_TEAMS
  console.log('makingTeams controller exit')
  return room
}
