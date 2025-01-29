package client

import (
	"bufio"
	"fmt"
	"github.com/ralvarezdev/uru-networks-protocol-programming/01-weird-protocol/internal"
	internalclient "github.com/ralvarezdev/uru-networks-protocol-programming/01-weird-protocol/internal/client"
	"net"
	"os"
	"strconv"
)

const (
	// MenuMessage is the message for the menu
	MenuMessage = `--- Welcome to the Client Application ---
Current protocol: %s

Please select an option:
	1. Change the protocol
	2. Send a mail
	3. Add a file
	4. Remove a file
	5. Send a morse code
	6. Exit

Option: `
)

var (
	// Protocol is the current protocol
	Protocol = "TCP"

	// TCPAddr is the TCP address
	TCPAddr *net.TCPAddr

	// UDPAddr is the UDP address
	UDPAddr *net.UDPAddr
)

func main() {
	// Resolve the TCP address
	tcpAddr, err := net.ResolveTCPAddr(
		"tcp",
		"localhost:"+strconv.Itoa(internal.TCPPort),
	)
	if err != nil {
		fmt.Println("Error resolving TCP address:", err)
		os.Exit(1)
	}
	TCPAddr = tcpAddr

	// Resolve the UDP address
	udpAddr, err := net.ResolveUDPAddr(
		"udp",
		"localhost:"+strconv.Itoa(internal.UDPPort),
	)
	if err != nil {
		fmt.Println("Error resolving UDP address:", err)
		os.Exit(1)
	}
	UDPAddr = udpAddr

	// Build the send message function
	sendMessage := internalclient.SendMessage(TCPAddr, UDPAddr)

	// Create a new reader
	reader := bufio.NewReader(os.Stdin)

	// Print the menu options and prompt the user to select an option
	for {
		// Print the menu options
		fmt.Printf(MenuMessage, Protocol)

		// Read the user input
		option, _, _ := reader.ReadLine()

		// Process the selected option
		switch string(option) {
		case "1":
			// Change the protocol
			if Protocol == "TCP" {
				Protocol = "UDP"
			} else {
				Protocol = "TCP"
			}
		case "2":
			// Ask the user for the mail details
			fmt.Print("Subject: ")
			subject, _, _ := reader.ReadLine()

			fmt.Print("Message: ")
			message, _, _ := reader.ReadLine()

			fmt.Print("To: ")
			to, _, _ := reader.ReadLine()

			// Send the mail message
			response, err := internalclient.SendMailMessage(
				string(subject),
				string(message),
				string(to),
				sendMessage,
			)
			if err != nil {
				fmt.Println("Failed to send message:", err)
			} else {
				fmt.Println("Message sent successfully:", response)
			}
		case "3":
			// Ask the user for the file details
			fmt.Print("Filename: ")
			filename, _, _ := reader.ReadLine()

			fmt.Print("Content: ")
			content, _, _ := reader.ReadLine()

			// Send the add file message
			response, err := internalclient.SendAddFileMessage(
				string(filename),
				string(content),
				sendMessage,
			)
			if err != nil {
				fmt.Println("Failed to send message:", err)
			} else {
				fmt.Println("Message sent successfully:", response)
			}
		case "4":
			// Ask the user for the file details
			fmt.Print("Filename: ")
			filename, _, _ := reader.ReadLine()

			// Send the remove file message
			response, err := internalclient.SendRemoveFileMessage(
				string(filename),
				sendMessage,
			)
			if err != nil {
				fmt.Println("Failed to send message:", err)
			} else {
				fmt.Println("Message sent successfully:", response)
			}
		case "5":
			// Ask the user for the morse code details
			fmt.Print("Message: ")
			message, _, _ := reader.ReadLine()

			// Ask whether to convert to morse code or from morse code
			fmt.Print("Convert to morse code? (y/n): ")
			convertToMorseStr, _, _ := reader.ReadLine()

			// Convert the string to a boolean
			convertToMorse := string(convertToMorseStr) == "y"

			// Send the morse message
			response, err := internalclient.SendMorseMessage(
				string(message),
				convertToMorse,
				sendMessage,
			)
			if err != nil {
				fmt.Println("Failed to send message:", err)
			} else {
				fmt.Println("Message sent successfully:", response)
			}
		case "6":
			// Exit the application
			fmt.Println("Exiting the application...")
			os.Exit(0)

		default:
			// Invalid option
			fmt.Println("Invalid option. Please try again.")
		}
	}
}
