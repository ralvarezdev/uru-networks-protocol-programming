package internal

const (
	// MorseHeader is the header for the morse code
	MorseHeader = "morse"

	// MorseToText is the morse body 'to' field for the text
	MorseToText = "text"

	// MorseToMorse is the morse body 'to' field for the morse code
	MorseToMorse = "morse"

	// AddFileHeader is the header for adding a file
	AddFileHeader = "addfile"

	// RemoveFileHeader is the header for removing a file
	RemoveFileHeader = "removefile"

	// MailHeader is the header for the mail
	MailHeader = "mail"
)

// Ports
const (
	TCPPort = 8080
	UDPPort = 8081
)
