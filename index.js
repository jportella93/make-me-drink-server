const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = process.env.PORT || 3000

let currentUsers = 0
io.on('connection', (socket) => {
  currentUsers++
  console.log('connected!')
  console.log('---->: currentUsers', currentUsers)

  socket.on('connection confirmation', () => {
    console.log('connection confirmation')
    socket.emit('connection confirmation')
  })

  socket.on('disconnect', (msg) => {
    console.log('disconnected!')
    currentUsers--
    console.log('---->: currentUsers', currentUsers)
  })
})

http.listen(port, () => {
  console.log('listening on *:' + port)
})
