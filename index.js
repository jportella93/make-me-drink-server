const app = require('express')()
const inspect = require('util').inspect
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = process.env.PORT || 3000

let currentUsers = 0
const rooms = new Map()

io.on('connection', (socket) => {
  const roomName = socket.handshake.query.roomName
  if (!roomName) return

  currentUsers++
  console.log('---->: currentUsers', currentUsers)

  socket.join(roomName)
  console.log(`connected to ${roomName}`)
  if (!rooms.has(roomName)) rooms.set(roomName, {})
  const currentRoom = rooms.get(roomName)

  const userId = socket.id
  if (!currentRoom.users) currentRoom.users = new Set()
  currentRoom.users.add(userId)

  console.log('rooms\n', inspect(rooms, false, null, true))
  console.log('number of rooms', rooms.size)

  socket.on('connection confirmation', () => {
    console.log('connection confirmation')
    socket.emit('connection confirmation', { roomName })
  })

  socket.on('disconnecting', (reason) => {
    Object.keys(socket.rooms).forEach(roomName => {
      if (!rooms.has(roomName)) return

      rooms.get(roomName).users.delete(userId)
      if (rooms.get(roomName).users.size === 0) {
        rooms.delete(roomName)
      }
    })
  })

  socket.on('disconnect', (msg) => {
    currentUsers--
    console.log('disconnected!')
    console.log('---->: currentUsers', currentUsers)
    console.log('rooms\n', inspect(rooms, false, null, true))
    console.log('number of rooms', rooms.size)
  })
})

http.listen(port, () => {
  console.log('listening on *:' + port)
})
