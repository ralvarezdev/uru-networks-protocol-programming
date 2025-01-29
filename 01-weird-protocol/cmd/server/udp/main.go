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
	addr := net.UDPAddr{
		Port: 8080,
		IP:   net.ParseIP("0.0.0.0"),
	}
	conn, err := net.ListenUDP("udp", &addr)
	if err != nil {
		fmt.Println("Error starting UDP server:", err)
		os.Exit(1)
	}
	defer conn.Close()
	fmt.Println("Server is listening on port 8080")

	// Create a safe connection number
	connNumber := goconcurrency.NewSafeNumber(0)

	buffer := make([]byte, 1024)
	for {
		// Read data from the connection
		n, clientAddr, err := conn.ReadFromUDP(buffer)
		if err != nil {
			fmt.Println("Error reading from connection:", err)
			continue
		}
		data := string(buffer[:n])

		// Handle the incoming data
		go internalhandler.HandleUDPIncomingData(
			conn,
			connNumber.IncrementAndGetValue(),
			clientAddr,
			&data,
		)
	}
}
