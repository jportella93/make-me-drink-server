const app = require('express')()
const inspect = require('util').inspect
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = process.env.PORT || 3000

const users = new Map()
const rooms = new Map()

const getNewUser = (socket, userName) => ({
  id: socket.id,
  name: userName
})

const getNewRoom = (roomName) => ({
  name: roomName,
  users: new Set()
})

function logUsers () {
  console.log('Users\n', inspect(users, false, null, true))
  console.log('Number of users online', users.size)
}

function logRooms () {
  console.log('rooms\n', inspect(rooms, false, null, true))
  console.log('number of rooms', rooms.size)
}

const getRoomState = (roomName) => ({
  users: [...rooms.get(roomName).users].map(id => users.get(id))
})

io.on('connection', (socket) => {
  const { roomName, userName } = socket.handshake.query
  if (!roomName || !userName) return

  const user = getNewUser(socket, userName)
  console.log(`${user.name} connected`)
  users.set(user.id, user)
  logUsers(user)

  if (!rooms.has(roomName)) rooms.set(roomName, getNewRoom(roomName))
  const room = rooms.get(roomName)
  room.users.add(user.id)
  socket.join(room.name)
  console.log(`${user.name} connected to room ${room.name}`)
  logRooms()

  socket.on('connection confirmation', () => {
    console.log('connection confirmation')
    socket.emit('connection confirmation', {
      roomName: room.name,
      userName: user.name
    })

    io.in(room.name).emit('room state', getRoomState(room.name))
  })

  socket.on('disconnecting', (reason) => {
    Object.keys(socket.rooms).forEach(roomName => {
      if (!rooms.has(roomName)) return

      rooms.get(roomName).users.delete(user.id)
      if (rooms.get(roomName).users.size === 0) {
        rooms.delete(roomName)
      }
    })
  })

  socket.on('disconnect', (msg) => {
    console.log(`${user.name} disconnected`)
    users.delete(user.id)
    logUsers()
    logRooms()
  })
})

http.listen(port, () => {
  console.log('listening on *:' + port)
})
