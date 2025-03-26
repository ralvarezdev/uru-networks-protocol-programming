import { io } from "socket.io-client";

// Connect to the server
const socket = io("http://localhost:3000");

// Listen for connection success
socket.on("your_id", (id) => {
    console.log(`Your client ID is: ${id}`); // Displays the client's ID
});

// Listen for broadcast messages
socket.on("broadcast", (message) => {
    console.log(message);
});

// Listen for echo messages
socket.on("echo", (message) => {
    console.log(message);
});

// Listen for private messages
socket.on("private_message", (message) => {
    console.log(message);
});

// Emit broadcast message
setTimeout(() => {
    socket.emit("broadcast", "Hello, this is a broadcast message!");
}, 1000);

// Emit echo message
setTimeout(() => {
    socket.emit("echo", "Hello, please echo this message!");
}, 2000);

// Emit private message (Replace 'SPECIFIC_CLIENT_ID' with actual socket ID)
setTimeout(() => {
    socket.emit("private_message", {
        id: "SPECIFIC_CLIENT_ID",
        message: "This is a private message.",
    });
}, 3000);