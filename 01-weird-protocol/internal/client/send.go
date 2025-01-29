package client

import (
	"fmt"
	"github.com/ralvarezdev/uru-networks-protocol-programming/01-weird-protocol/internal"
	"log"
	"net"
)

const (
	// MailMessageFormat is the mail message format
	MailMessageFormat = `
header: "%s",
body: {
	subject: %s,
	message: "%s",
	to: {
		name: "%s",
		email: "%s"
	}
}`

	// MorseMessageFormat is the morse message format
	MorseMessageFormat = `
header: "%s",
body: {
	message: "%s",
	to: "%s"
}`

	// AddFileMessageFormat is the add file message format
	AddFileMessageFormat = `
header: "%s",
body: {
	filename: "%s",
	content: "%s"
}
`

	// RemoveFileMessageFormat is the remove file message format
	RemoveFileMessageFormat = `
header: "%s",
body: {
	filename: "%s"
}`
)

// SendTCPMessage sends a message to the TCP server
func SendTCPMessage(
	address *net.TCPAddr,
	message string,
) (response string, err error) {
	// Connect to the TCP server
	conn, err := net.DialTCP("tcp", nil, address)
	if err != nil {
		return "", fmt.Errorf("error connecting to TCP server: %v", err.Error())
	}
	defer func(conn *net.TCPConn) {
		err := conn.Close()
		if err != nil {
			log.Println("error closing connection:", err)
		}
	}(conn)

	// Send the message to the server
	_, err = conn.Write([]byte(message))
	if err != nil {
		return "", fmt.Errorf("error sending message: %v", err.Error())
	}

	// Read the response from the server
	buffer := make([]byte, 1024)
	n, err := conn.Read(buffer)
	if err != nil {
		return "", fmt.Errorf("error reading response: %v", err.Error())
	}

	return string(buffer[:n]), nil
}

// SendUDPMessage sends a message to the UDP server
func SendUDPMessage(
	serverAddr *net.UDPAddr,
	message string,
) (response string, err error) {
	// Connect to the UDP server
	conn, err := net.DialUDP("udp", nil, serverAddr)
	if err != nil {
		return "", fmt.Errorf("error connecting to UDP server: %v", err.Error())
	}
	defer func(conn *net.UDPConn) {
		err := conn.Close()
		if err != nil {
			log.Println("error closing connection:", err)
		}
	}(conn)

	// Send the message to the server
	_, err = conn.Write([]byte(message))
	if err != nil {
		return "", fmt.Errorf("error sending message: %v", err.Error())
	}

	// Read the response from the server
	buffer := make([]byte, 1024)
	n, _, err := conn.ReadFromUDP(buffer)
	if err != nil {
		return "", fmt.Errorf("error reading response: %v", err.Error())
	}

	return string(buffer[:n]), nil
}

// SendMessage sends a message to the server
func SendMessage(
	tpcAddress *net.TCPAddr,
	udpAddress *net.UDPAddr,
) func(protocol string, message string) (response string, err error) {
	return func(protocol string, message string) (response string, err error) {
		switch protocol {
		case "TCP":
			return SendTCPMessage(tpcAddress, message)
		case "UDP":
			return SendUDPMessage(udpAddress, message)
		default:
			return "", fmt.Errorf("unsupported protocol: %s", protocol)
		}
	}
}

// SendMailMessage sends a mail message to the server
func SendMailMessage(
	subject, message, toName, toEmail string,
	sendMessage func(protocol string, message string) (
		response string,
		err error,
	),
) (response string, err error) {
	// Send the mail
	response, err = sendMessage(
		"TCP",
		fmt.Sprintf(
			MailMessageFormat,
			internal.MailHeader,
			subject,
			message,
			toName,
			toEmail,
		),
	)
	if err != nil {
		return "", fmt.Errorf("error sending mail: %v", err.Error())
	}
	return response, nil
}

// SendMorseMessage sends a morse message to the server
func SendMorseMessage(
	message string, convertToMorse bool,
	sendMessage func(protocol string, message string) (
		response string,
		err error,
	),
) (response string, err error) {
	// Check if the message should be converted to morse
	var to string
	if convertToMorse {
		to = internal.MorseToMorse
	} else {
		to = internal.MorseToText
	}

	// Send the morse message
	response, err = sendMessage(
		"TCP",
		fmt.Sprintf(MorseMessageFormat, internal.MorseHeader, message, to),
	)
	if err != nil {
		return "", fmt.Errorf("error sending morse message: %v", err.Error())
	}
	return response, nil
}

// SendAddFileMessage sends an add file message to the server
func SendAddFileMessage(
	filename, content string,
	sendMessage func(protocol string, message string) (
		response string,
		err error,
	),
) (response string, err error) {
	// Send the add file message
	response, err = sendMessage(
		"TCP",
		fmt.Sprintf(
			AddFileMessageFormat,
			internal.AddFileHeader,
			filename,
			content,
		),
	)
	if err != nil {
		return "", fmt.Errorf("error sending add file message: %v", err.Error())
	}
	return response, nil
}

// SendRemoveFileMessage sends a remove file message to the server
func SendRemoveFileMessage(
	filename string,
	sendMessage func(protocol string, message string) (
		response string,
		err error,
	),
) (response string, err error) {
	// Send the remove file message
	response, err = sendMessage(
		"TCP",
		fmt.Sprintf(
			RemoveFileMessageFormat,
			internal.RemoveFileHeader,
			filename,
		),
	)
	if err != nil {
		return "", fmt.Errorf(
			"error sending remove file message: %v",
			err.Error(),
		)
	}
	return response, nil
}
