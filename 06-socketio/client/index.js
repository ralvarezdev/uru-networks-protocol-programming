import "dotenv/config";
import {io} from "socket.io-client";
import * as readline from "node:readline";

// Constants
const {URL} = process.env;
let unreadMessages = []
let readMessages = []
let isListeningToMessages = false
let ID = null;
const MENU = (id) => `
--- WEB SOCKET CLIENT ---
${!id ? "Connecting to server..." : `Connected to server with ID: ${id}`}

Options:
1. Broadcast message
2. Echo message
3. Private message
4. Listen for messages
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
function createMessage(event, message) {
    return {time: new Date(), event, message}
}

// Print message
function printMessage({time, event, message}) {
    console.log(`{
    event: '${event}',
    time: ${time},
    message: '${message}'
}`)
}

// Message handler
function handleMessage(event, message) {
    const messageObj = createMessage(event, message)
    if (isListeningToMessages) {
        readMessages.push(messageObj)
        printMessage(messageObj)
    } else {
        unreadMessages.push(messageObj)
    }
}

// Connect to the server
const socket = io(URL);

// Listen for connection success
const connect = new Promise((resolve) => {
    socket.on("your_id", (id) => {
        ID = id;
        resolve()
    });
})

// Listen for broadcast messages
socket.on("broadcast", (message) => {
    handleMessage('broadcast', message)
});

// Listen for echo messages
socket.on("echo", (message) => {
    handleMessage('echo', message)
});

// Listen for private messages
socket.on("private_message", (message) => {
    handleMessage('private_message', message)
});

// Main function
async function main() {
    // Wait for connection
    await connect;

    // Variables
    let exit = false;
    let option = null;

    while (!exit) {
        // Display menu
        console.log(MENU(ID));

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
            socket.emit("broadcast", {message});
        } else if (option === "2") {
            // Echo message
            const message = await input("Enter message: ");
            socket.emit("echo", {message});
        } else if (option === "3") {
            // Private message
            const id = await input("Enter client ID: ");
            const message = await input("Enter message: ");
            socket.emit("private_message", {id, message});
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
                console.log("No unread messages")
                continue
            }

            // Print unread messages
            console.log("Unread messages:")
            unreadMessages.forEach(printMessage)

            // Clear unread messages
            readMessages.push(...unreadMessages)
            unreadMessages = []
        } else if (option === "6") {
            if (readMessages.length === 0) {
                console.log("No read messages")
                continue
            }

            // Print read messages
            console.log("Read messages:")
            readMessages.forEach(printMessage)
        }
    }

    // Close the readline interface
    rl.close();

    // Close the socket
    socket.close();
}

// Start the main function
main().then(r => console.log("Goodbye!"));