import "dotenv/config";
import {createServer} from "http";
import {Server} from "socket.io";

// Constants
const {PORT} = process.env;

// Set up HTTP server
const server = createServer();
const io = new Server(server);

// When a client connects
io.on("connection", (socket) => {
    // Sends the client its ID
    socket.emit("your_id", socket.id);

    // Broadcast a message to all connected clients
    socket.on("broadcast", ({message}) => {
        io.emit("broadcast", `Broadcast: ${message}`);
    });

    // Echo a message back to the sender
    socket.on("echo", ({message}) => {
        socket.emit("echo", `Echo: ${message}`);
    });

    // Send a message to a specific client
    socket.on("private_message", ({ id, message }) => {
        io.to(id).emit("private_message", `Message for you: ${message}`);
    });

    // Handle client disconnection
    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Socket server is running on port ${PORT}`);
});