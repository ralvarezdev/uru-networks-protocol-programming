import "dotenv/config";
import {createServer} from "http";
import {Server} from "socket.io";
import * as readline from "node:readline";

// Constants
const sockets = new Map();
let unreadMessages = []
let readMessages = []
let isListeningToMessages = false
const {PORT} = process.env;
const MENU = `
--- WEB SOCKET SERVER ---
Server is running on port ${PORT}

Options:
1. Broadcast message
2. Private message
3. List socket IDs
4. Listen to messages
5. Print unread messages
6. Print read messages
7. Exit
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
function createMessage({id=null, event, message=null}) {
    let baseObj = {time: new Date(), event}

    if (message)
        baseObj= {...baseObj, message}
    if (id)
        baseObj = {...baseObj, id}

    return baseObj
}

// Print message
function printMessage({id=null, time, event, message=null}) {
    let baseObj = {time, event}

    if (id)
        baseObj = {...baseObj, id}
    if (message)
        baseObj = {...baseObj, message}

    console.log(JSON.stringify(baseObj, null, 4))
}

// Message handler
function handleMessage({id=null, event, message=null}) {
    const messageObj = createMessage({id, event, message})
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
    unreadMessages.push(createMessage({id:socket.id, event:"connect"}))
    socket.emit("your_id", socket.id);
    sockets.set(socket.id, socket);

    // Broadcast a message to all connected clients
    socket.on("broadcast", ({message}) => {
        handleMessage({event:"broadcast", message})
        io.emit("broadcast", {message});
    });

    // Echo a message back to the sender
    socket.on("echo", ({message}) => {
        handleMessage({event:"echo", message})
        socket.emit("echo", {message});
    });

    // Send a message to a specific client
    socket.on("private_message", ({id:toID, message}) => {
        const fromID=socket.id
        handleMessage({id:fromID, event:"private_message", message})
        io.to(toID).emit("private_message", {id:fromID, message});
    });

    // Handle client disconnection
    socket.on("disconnect", () => {
        handleMessage({id:socket.id, event:"disconnect"})
        sockets.delete(socket.id);
    });
});

// Start the server
const serverListen = new Promise((resolve, reject) => {
server.listen(PORT, () => {
    resolve();
});
})

// Main function
async function main() {
    // Wait for the server to start
    await serverListen;

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
        if (option === "7") {
            // Exit
            exit = true;
        } else if (option === "1") {
            // Broadcast message
            const message = await input("Enter message: ");
            io.emit("broadcast", {message});
        } else if (option === "2") {
            // Private message
            const id = await input("Enter client ID: ");
            const message = await input("Enter message: ");

            // Check if the ID is valid
            if (!sockets.has(id)) {
                console.log("Invalid ID");
            } else {
                sockets.get(id).emit("private_message", {id: "SERVER", message});
            }
        } else if (option === "3") {
            // Print all available IDs
            console.log("Available IDs:")
            sockets.forEach((_, id) => console.log(id))
        } else if (option === "4") {
            // Listen for messages
            isListeningToMessages = true;

            // Continue printing until the user presses enter
            console.log("Press 'ENTER' to stop listening for messages");

            // Stop listening for messages
            await input("");
            isListeningToMessages = false;
        } else if (option === "5") {
            if (unreadMessages.length === 0) {
                console.log("No unread messages");
                continue;
            }

            // Print unread messages
            console.log("Unread messages: ");
            unreadMessages.forEach(printMessage);

            // Clear unread messages4
            readMessages.push(...unreadMessages)
            unreadMessages = [];
        } else if (option === "6") {
            if (readMessages.length === 0) {
                console.log("No read messages");
                continue;
            }

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