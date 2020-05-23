const app = require('express')()
const inspect = require('util').inspect
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = process.env.PORT || 3000
const gameStates = require('./constants/gameStates')

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
  gameState: gameStates.WAITING_ROOM
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

  const { gameState, users: roomUsers } = rooms.get(roomName)
  return {
    gameState,
    users: [...roomUsers].map(id => users.get(id)),
    timestamp: Date.now()
  }
}

function emitError (socket, error) {
  console.error(error)
  socket.emit && socket.emit('error', error)
}

const getUnexistingRoomError = (roomName) =>
  `Room ${roomName} doesn't exist`

const getMissingParamError = (name) =>
  `Param ${name} is required`

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
        roomName: room.name
      })

      io.in(room.name).emit('room state', getRoomState(socket, room.name))
    })

    socket.on('game state change', (newState) => {
      const room = rooms.get(roomName)
      if (!room) {
        emitError(socket, getUnexistingRoomError(roomName))
        return
      }
      room.gameState = newState
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
