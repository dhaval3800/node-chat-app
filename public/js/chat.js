const socket = io()

// Elements
const $messageForm = document.querySelector('#msg-0')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const VisibleHeight = $messages.offsetHeight

    // Height of the messages container
    const containerHeight = $messages.scrollHeight

    // How far have i scrolled
    const scrollOffset = $messages.scrollTop + VisibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight // if we want screen to always scroll when new message typed then 
    }                                                 // we just required this one line 
}

socket.on('message',(msg)=>{
    console.log(msg)
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage', (msg)=>{
    console.log(msg)
    const html = Mustache.render(locationTemplate,{
        username: msg.username,
        location: msg.url,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();

    // disable button
    $messageFormButton.setAttribute('disabled','disabled') 

    const message = e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{

        // enable button
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error){
            return console.log(error)
        }
        console.log('Message delivered ')
    })
})

$sendLocationButton.addEventListener('click',(e)=>{
    // disable button
    $sendLocationButton.setAttribute('disabled','disabled') 

    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        },()=>{
            console.log('Location shared!')
            $sendLocationButton.removeAttribute('disabled') 
        })
    })
})

socket.emit('join', { username, room }, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})