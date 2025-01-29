package main

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
`
)

var (
	// Protocol is the current protocol
	Protocol = "TCP"

	// TCPAddr is the TCP address
	TCPAddr *net.TCPAddr

	// UDPAddr is the UDP address
	UDPAddr *net.UDPAddr
)

// HandleResponse the response from the server
func HandleResponse(response string, err error) {
	if err != nil {
		fmt.Printf("\nFailed to send message: %v\n\n", err.Error())
	} else {
		fmt.Printf("\nMessage sent successfully: %v\n\n", response)
	}
}

// ReadString reads a string from a reader
func ReadString(message string, reader *bufio.Reader) (string, bool) {
	fmt.Printf("%s: ", message)
	value, err := reader.ReadString('\n')
	if err != nil {
		fmt.Printf("Error reading: %v\n", err.Error())
		return "", false
	}
	return value[:len(value)-2], true
}

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
		option, ok := ReadString("\nOption", reader)
		if !ok {
			return
		}
		fmt.Print("\n")

		// Process the selected option
		switch option {
		case "1":
			// Change the protocol
			if Protocol == "TCP" {
				Protocol = "UDP"
			} else {
				Protocol = "TCP"
			}
		case "2":
			// Ask the user for the mail details
			subject, ok := ReadString("Subject", reader)
			if !ok {
				return
			}

			message, ok := ReadString("Message", reader)
			if !ok {
				return
			}

			toName, ok := ReadString("To (Name)", reader)
			if !ok {
				return
			}

			toEmail, ok := ReadString("To (Email)", reader)
			if !ok {
				return
			}

			// Send the mail message
			HandleResponse(
				internalclient.SendMailMessage(
					Protocol,
					subject,
					message,
					toName,
					toEmail,
					sendMessage,
				),
			)
		case "3":
			// Ask the user for the file details
			filename, ok := ReadString("Filename", reader)
			if !ok {
				return
			}

			content, ok := ReadString("Content", reader)
			if !ok {
				return
			}

			// Send the add file message
			HandleResponse(
				internalclient.SendAddFileMessage(
					Protocol,
					filename,
					content,
					sendMessage,
				),
			)
		case "4":
			// Ask the user for the file details
			filename, ok := ReadString("Filename", reader)
			if !ok {
				return
			}

			// Send the remove file message
			HandleResponse(
				internalclient.SendRemoveFileMessage(
					Protocol,
					filename,
					sendMessage,
				),
			)
		case "5":
			// Ask the user for the morse code details
			message, ok := ReadString("message", reader)
			if !ok {
				return
			}

			// Ask whether to convert to morse code or from morse code
			convertToMorseStr, ok := ReadString(
				"Convert to morse code? (y/n)",
				reader,
			)
			if !ok {
				return
			}

			// Convert the string to a boolean
			convertToMorse := string(convertToMorseStr) == "y"

			// Send the morse message
			HandleResponse(
				internalclient.SendMorseMessage(
					Protocol,
					message,
					convertToMorse,
					sendMessage,
				),
			)
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
