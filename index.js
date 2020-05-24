const app = require('express')()
const inspect = require('util').inspect
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = process.env.PORT || 3000
const gameStates = require('./constants/gameStates')
const makingTeamsController = require('./controllers/gameStates/makingTeams')
const waitingQuestionController = require('./controllers/gameStates/waitingQuestion')
const teamStartController = require('./controllers/gameStates/teamStart')
const waitingAnswerController = require('./controllers/gameStates/waitingAnswer')
const answerResultController = require('./controllers/gameStates/answerResult')

const MAX_ROUNDS = 5

const users = new Map()
const rooms = new Map()

const getNewUser = (socket, userName, type) => ({
  id: socket.id,
  name: userName,
  type
})

const getNewRoom = (roomName) => ({
  name: roomName,
  users: new Set(),
  gameState: gameStates.WAITING_ROOM,
  turn: 0,
  round: 0,
  maxRounds: MAX_ROUNDS,
  currentPlayingTeam: null
})

function logUsers () {
  console.log('Users\n', inspect(users, false, null, true))
  console.log('Number of users online', users.size)
}

function logRooms () {
  console.log('rooms\n', inspect(rooms, false, null, true))
  console.log('number of rooms', rooms.size)
}

function logRoomState (room) {
  console.log('room state change')
  console.log('rooms\n',
    inspect(getRoomState(null, room.name), false, null, true))
}

const getRoomState = (socket, roomName) => {
  const room = rooms.get(roomName)
  if (!room) {
    emitError(socket, getUnexistingRoomError(roomName))
    return {}
  }

  const { gameState, users: roomUsers, teams } = rooms.get(roomName)
  return {
    gameState,
    teams,
    room,
    users: [...roomUsers].map(id => users.get(id)),
    timestamp: Date.now()
  }
}

function emitError (socket, error) {
  console.error(error)
  socket.emit && socket.emit('error', error)
}

const getUnexistingEntityError = (name, value) =>
`${name} ${value} doesn't exist`

const getUnexistingRoomError = (roomName) =>
  getUnexistingEntityError('room', roomName)

const getMissingParamError = (name) =>
  `Param ${name} is required`

const getInvalidParamError = (name, value) =>
  `Param ${name} with value ${value} is invalid`

io.on('connection', (socket) => {
  try {
    const { roomName, userName } = socket.handshake.query
    if (!roomName) {
      emitError(socket, getMissingParamError('roomName'))
      return
    }
    if (!userName) {
      emitError(socket, getMissingParamError('userName'))
      return
    }

    let isNewRoom = false
    if (!rooms.has(roomName)) {
      rooms.set(roomName, getNewRoom(roomName))
      isNewRoom = true
    }
    const room = rooms.get(roomName)

    const user = getNewUser(socket, userName, isNewRoom ? 'admin' : 'regular')
    console.log(`${user.name} connected`)
    users.set(user.id, user)
    logUsers()

    room.users.add(user.id)
    socket.join(room.name)
    console.log(`${user.name} connected to room ${room.name}`)
    logRooms()

    socket.on('connection confirmation', () => {
      console.log('connection confirmation')
      socket.emit('connection confirmation', {
        userName: user.name,
        userId: user.id,
        userType: user.type,
        room
      })

      io.in(room.name).emit('room state', getRoomState(socket, room.name))
    })

    socket.on('game state change', (newState) => {
      console.log(`Request to change game state to ${newState}`)
      const room = rooms.get(roomName)
      if (!room) {
        emitError(socket, getUnexistingRoomError(roomName))
        return
      }
      if (newState === gameStates.MAKING_TEAMS) {
        const updatedRoom = makingTeamsController(room, users)
        rooms.set(room.name, updatedRoom)
      } else if (newState === gameStates.WAITING_QUESTION) {
        const updatedRoom = waitingQuestionController(room, users)
        rooms.set(room.name, updatedRoom)
      } else if (newState === gameStates.ANSWER_RESULT) {
        const updatedRoom = answerResultController(room, users)
        rooms.set(room.name, updatedRoom)
      } else {
        emitError(socket, getInvalidParamError('game state', newState))
        return
      }
      io.in(room.name).emit('room state', getRoomState(socket, room.name))
      logRoomState(room)
    })

    socket.on('set team name', ({ teamId, teamName, roomName }) => {
      console.log(`Request to change game team name to ${teamName}`)
      const room = rooms.get(roomName)
      if (!room) {
        emitError(socket, getUnexistingRoomError(roomName))
        return
      }
      const team = room.teams.find(({ id }) => id === teamId)
      if (!team) {
        emitError(socket, getUnexistingEntityError('team', teamId))
        return
      }
      team.name = teamName
      if (room.teams.every(team => team.name)) {
        console.log(`All teams in room ${roomName} are named`)
        const updatedRoom = teamStartController(room, users)
        rooms.set(room.name, updatedRoom)
      }
      io.in(room.name).emit('room state', getRoomState(socket, room.name))
      logRoomState(room)
    })

    socket.on('question', ({ question, teamId, roomName, userId }) => {
      console.log(`New question from ${teamId} in ${roomName}: ${question}`)
      const room = rooms.get(roomName)
      if (!room) {
        emitError(socket, getUnexistingRoomError(roomName))
        return
      }
      const team = room.teams.find(({ id }) => id === teamId)
      if (!team) {
        emitError(socket, getUnexistingEntityError('team', teamId))
        return
      }
      const user = users.get(userId)
      if (!user) {
        emitError(socket, getUnexistingEntityError('user', userId))
        return
      }
      const updatedRoom = waitingAnswerController(room, question, user)
      rooms.set(room.name, updatedRoom)
      io.in(room.name).emit('room state', getRoomState(socket, room.name))
      logRoomState(room)
    })

    socket.on('answer', ({ questionId, userId, value, roomName }) => {
      console.log(
        `New answer to ${questionId} from ${userId} in ${roomName}: ${value}`)
      const room = rooms.get(roomName)
      if (!room) {
        emitError(socket, getUnexistingRoomError(roomName))
        return
      }
      const user = users.get(userId)
      if (!user) {
        emitError(socket, getUnexistingEntityError('user', userId))
        return
      }
      const question = room.currentQuestion
      if (!question || question.id !== questionId) {
        emitError(socket, getUnexistingEntityError('question', questionId))
        return
      }
      question.answers[userId] = value
      io.in(room.name).emit('room state', getRoomState(socket, room.name))
      logRoomState(room)
    })

    socket.on('disconnecting', (reason) => {
      Object.keys(socket.rooms).forEach(roomName => {
        const room = rooms.get(roomName)
        if (!room) return

        io.in(roomName).emit('room state', getRoomState(socket, roomName))
        room.users.delete(user.id)
        if (room.users.size === 0) {
          rooms.delete(room.name)
        }
      })
    })

    socket.on('disconnect', (msg) => {
      console.log(`${user.name} disconnected`)
      users.delete(user.id)
      logUsers()
      logRooms()
    })
  } catch (error) {
    emitError(socket, error)
  }
})

http.listen(port, () => {
  console.log('listening on *:' + port)
})
