package server

import (
	"fmt"
	goconcurrency "github.com/ralvarezdev/go-concurrency"
	"github.com/ralvarezdev/uru-networks-protocol-programming/01-weird-protocol/internal"
	internalloader "github.com/ralvarezdev/uru-networks-protocol-programming/01-weird-protocol/internal/loader"
	internalhandler "github.com/ralvarezdev/uru-networks-protocol-programming/01-weird-protocol/internal/server"
	"net"
	"os"
)

// Call the load functions on init
func init() {
	internalloader.Load()
}

func main() {
	// Start the TCP server on a separate goroutine
	go func() {
		// Listen on a port
		address := &net.TCPAddr{
			Port: internal.TCPPort,
			IP:   net.ParseIP("0.0.0.0"),
		}
		listener, err := net.ListenTCP(
			"tcp",
			address,
		)
		if err != nil {
			fmt.Println("Error starting TCP server: ", err)
			os.Exit(1)
		}
		defer func(listener net.Listener) {
			err := listener.Close()
			if err != nil {
				fmt.Println("Error closing listener:", err)
			}
		}(listener)
		fmt.Printf("Server is listening on port %d\n", internal.TCPPort)

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
			go internalhandler.HandleIncomingData(
				internalhandler.HandleTCPConnection(
					conn,
					connNumber.IncrementAndGetValue(),
				),
			)
		}
	}()

	// Start the UDP server on a separate goroutine
	go func() {
		// Listen on a port
		addr := net.UDPAddr{
			Port: internal.UDPPort,
			IP:   net.ParseIP("0.0.0.0"),
		}
		conn, err := net.ListenUDP("udp", &addr)
		if err != nil {
			fmt.Println("Error starting UDP server:", err)
			os.Exit(1)
		}
		defer func(conn *net.UDPConn) {
			err := conn.Close()
			if err != nil {
				fmt.Println("Error closing connection:", err)
			}
		}(conn)
		fmt.Printf("Server is listening on port %d\n", internal.UDPPort)

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
			go internalhandler.HandleIncomingData(
				internalhandler.HandleUDPIncomingData(
					conn,
					connNumber.IncrementAndGetValue(),
					clientAddr,
					&data,
				),
			)
		}
	}()
}
