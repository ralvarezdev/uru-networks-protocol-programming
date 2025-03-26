import "dotenv/config";
import { io } from "socket.io-client";
import * as readline from "node:readline";

// Constants
const {URL} = process.env;
let printMessage = false
let ID = null;
const MENU = (id)=>`
--- WEB SOCKET CLIENT ---
${!id ? "Connecting to server..." : `Connected to server with ID: ${id}`}

Options:
1. Broadcast message
2. Echo message
3. Private message
4. Listen for messages
5. Exit

`

// Get the user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Connect to the server
const socket = io(URL);

// Listen for connection success
socket.on("your_id", (id) => {
    ID = id;
});

// Listen for broadcast messages
socket.on("broadcast", (message) => {
    if (printMessage)
        console.log(message);
});

// Listen for echo messages
socket.on("echo", (message) => {
    if (printMessage)
        console.log(message);
});

// Listen for private messages
socket.on("private_message", (message) => {
    if (printMessage)
        console.log(message);
});

// Main function
function main() {
    // Variables
    let option = null;

    while (true){
        // Display menu
        console.log(MENU(ID));

        // Get option
        rl.question("Please select an option: ", (input) => {
            // Format input
            option = input.trim().toLowerCase();

            // Process option
            if (option === "5") {
                break
            } else if (option === "1") {
                // Broadcast message
                rl.question("Enter message: ", (message) => {
                    socket.emit("broadcast", {message});
                });
            } else if (option === "2") {
                // Echo message
                rl.question("Enter message: ", (message) => {
                    socket.emit("echo", {message});
                });
            } else if (option === "3") {
                // Private message
                rl.question("Enter client ID: ", (id) => {
                    rl.question("Enter message: ", (message) => {
                        socket.emit("private_message", {
                            id,
                            message,
                        });
                    });
                });
            } else if (option === "4") {
                // Listen for messages
                printMessage = true;

                // Continue printing until the user presses enter
                if (printMessage) {
                    console.log("Press enter to stop listening for messages");

                    // Stop listening for messages
                    rl.question("", () => {
                        printMessage = false;
                    });
                }
            }
        });
    }
    rl.close();
}