import "dotenv/config";
import {createServer} from "http";
import {Server} from "socket.io";
import * as readline from "node:readline";

// Constants
const availableIDs = [];
let unreadMessages = []
let readMessages = []
let isListeningToMessages = false
const {PORT} = process.env;
const MENU = `
--- WEB SOCKET SERVER ---

Options:
1. Broadcast message
2. Echo message
3. Private message
4. List socket IDs
5. Listen to messages
6. Print unread messages
7. Print read messages
8. Exit
`

// Get the user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function input(message) {
    return await new Promise((resolve) => {
        rl.question(message, resolve);
    })
}

// Create message
function createMessage(id, event, message) {
    if (message) return {id, time: new Date(), event, message}
    return {id, time: new Date(), event}
}

// Print message
function printMessage({id, time, event, message = null}) {
    if (message) {
        console.log(`
{
    id: '${id}',
    event: '${event}',
    time: ${time},
    message: '${message}'
}`)
        return
    }

    console.log(`
{
    id: '${id}',
    event: '${event}',
    time: ${time}
}`)
}

// Message handler
function handleMessage(id, event, message) {
    const messageObj = createMessage(id, event, message)
    if (isListeningToMessages) {
        readMessages.push(messageObj)
        printMessage(messageObj)
    } else {
        unreadMessages.push(messageObj)
    }
}

// Set up HTTP server
const server = createServer();
const io = new Server(server);

// When a client connects
io.on("connection", (socket) => {
    // Sends the client its ID
    socket.emit("your_id", socket.id);
    availableIDs.push(socket.id);

    // Broadcast a message to all connected clients
    socket.on("broadcast", ({message}) => {
        handleMessage(socket.id, "broadcast", message)
        io.emit("broadcast", message);
    });

    // Echo a message back to the sender
    socket.on("echo", ({message}) => {
        handleMessage(socket.id, "echo", message)
        socket.emit("echo", message);
    });

    // Send a message to a specific client
    socket.on("private_message", ({id, message}) => {
        handleMessage(socket.id, "private_message", message)
        io.to(id).emit("private_message", message);
    });

    // Handle client disconnection
    socket.on("disconnect", () => {
        handleMessage(socket.id, "disconnect")
        availableIDs.splice(availableIDs.indexOf(socket.id))
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Socket server is running on port ${PORT}`);
});

// Main function
async function main() {
    // Variables
    let exit = false;
    let option = null;

    while (!exit) {
        // Display menu
        console.log(MENU);

        // Get option
        option = await input("Please select an option: ");
        option = option.trim().toLowerCase();

        // Process option
        if (option === "8") {
            // Exit
            exit = true;
        } else if (option === "1") {
            // Broadcast message
            const message = await input("Enter message: ");
            server.emit("broadcast", {message});
        } else if (option === "2") {
            // Echo message
            const message = await input("Enter message: ");
            server.emit("echo", {message});
        } else if (option === "3") {
            // Private message
            const id = await input("Enter client ID: ");
            const message = await input("Enter message: ");
            server.emit("private_message", {id, message,});
        } else if (option === "4") {
            // Print all available IDs
            console.log("Available IDs: ", availableIDs.join(", "));
        } else if (option === "5") {
            // Listen for messages
            isListeningToMessages = true;

            // Continue printing until the user presses enter
            console.log("Press 'enter' to stop listening for messages");

            // Stop listening for messages
            await input("");
            isListeningToMessages = false;
        } else if (option === "6") {
            // Print unread messages
            console.log("Unread messages: ");
            unreadMessages.forEach(printMessage);

            // Clear unread messages4
            readMessages.push(...unreadMessages)
            unreadMessages = [];
        } else if (option === "7") {
            // Print read messages
            console.log("Read messages: ");
            readMessages.forEach(printMessage);
        }
    }

    // Close the readline interface
    rl.close();

    // Close the socket
    server.close();
}

// Start the main function
main().then(r => console.log("Goodbye!"));