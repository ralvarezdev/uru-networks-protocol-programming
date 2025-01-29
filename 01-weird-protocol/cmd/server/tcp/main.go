package tcp

import (
	"fmt"
	goconcurrency "github.com/ralvarezdev/go-concurrency"
	internalhandler "github.com/ralvarezdev/uru-networks-protocol-programming/01-weird-protocol/server/internal/handler"
	"net"
	"os"
)

func main() {
	// Listen on a port
	listener, err := net.Listen("tcp", ":8080")
	if err != nil {
		fmt.Println("Error starting TCP server: ", err)
		os.Exit(1)
	}
	defer listener.Close()
	fmt.Println("Server is listening on port 8080")

	// Create a safe connection number
	connNumber := goconcurrency.NewSafeNumber(0)

	for {
		// Accept a connection
		conn, err := listener.Accept()
		if err != nil {
			fmt.Println("Error accepting connection:", err)
			continue
		}

		// Handle the connection
		go internalhandler.HandleTCPConnection(
			conn,
			connNumber.IncrementAndGetValue(),
		)
	}
}
