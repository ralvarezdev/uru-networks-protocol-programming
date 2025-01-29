package server

import (
	"context"
	"fmt"
	"github.com/mailersend/mailersend-go"
	gomorse "github.com/ralvarezdev/go-morse"
	"github.com/ralvarezdev/uru-networks-protocol-programming/01-weird-protocol/internal"
	internalloader "github.com/ralvarezdev/uru-networks-protocol-programming/01-weird-protocol/internal/loader"
	"log"
	"net"
	"strings"
)

const (
	// FilesFolder is the folder for the files
	FilesFolder = "files"
)

// NoNestedObjects is validation function that checks if none of the fields is a nested objects
func NoNestedObjects(initialPos int) func(
	isNestedObject bool,
	key string,
	value *string,
	valuePos int,
) error {
	return func(
		isNestedObject bool,
		key string,
		value *string,
		valuePos int,
	) error {
		// Check if it is a nested object
		if isNestedObject {
			return fmt.Errorf(
				"expected a string at position %d", initialPos+valuePos,
			)
		}
		return nil
	}
}

// MissingAtPositionError is the error for a missing string at a position
func MissingAtPositionError(str string, pos int) error {
	return fmt.Errorf("'%s' is missing in the data at position %d", str, pos)
}

// LogAndWrite logs and writes a message
func LogAndWrite(
	connNumber int,
	writeFn func(message string),
	msg string,
) {
	// Log the error
	log.Printf("connection %d: %s", connNumber, msg)

	// Write the error
	writeFn(msg)
}

// LogAndWriteError logs and writes an error
func LogAndWriteError(
	connNumber int,
	writeFn func(message string),
	err error,
) {
	LogAndWrite(connNumber, writeFn, err.Error())
}

// SkipUntilANonSpacingCharacter skips until a non-spacing character is found
func SkipUntilANonSpacingCharacter(data *string, pos int) int {
	// Check if the data is nil
	if data == nil {
		return pos
	}

	// Skip until a non-spacing character is found
	for _, r := range (*data)[pos:] {
		if r != ' ' && r != '\n' && r != '\t' && r != '\r' {
			break
		}
		pos++
	}
	return pos
}

// ReadKeyValue reads a key value pair
func ReadKeyValue(
	data *string,
	pos int,
) (
	isNestedObject bool,
	key string,
	value *string,
	valuePos, finalPos int,
	err error,
) {
	// Check if the data is nil
	if data == nil {
		return false, "", nil, -1, -1, fmt.Errorf("data is nil")
	}

	// Check if the data starts with the given key
	pos = SkipUntilANonSpacingCharacter(data, pos)
	tempPos := pos
	for _, r := range (*data)[pos:] {
		if r == ' ' || r == '\n' || r == '\t' || r == '\r' || r == ':' {
			break
		}
		pos++
	}
	key = (*data)[tempPos:pos]

	// Start iterating over the value content
	pos = SkipUntilANonSpacingCharacter(data, pos)
	if (*data)[pos] != ':' {
		return false, "", nil, pos, -1, MissingAtPositionError(":", pos)
	}
	pos++

	// Check of the value starts with a double quote if it is a string
	var depth int
	var isString bool
	pos = SkipUntilANonSpacingCharacter(data, pos)
	valuePos = pos
	if (*data)[pos] == '"' {
		isString = true
		pos++
	} else if (*data)[pos] == '{' {
		isNestedObject = true
		depth++
		pos++
	}

	// Get the value
	tempPos = pos
	for _, r := range (*data)[pos:] {
		// Check if it is a nested object, a string or other type
		if isNestedObject {
			if r == '{' {
				depth++
			} else if r == '}' {
				depth--

				if depth == 0 {
					break
				}
			}
		} else if isString {
			if r == '"' {
				break
			}
		} else if r == ',' {
			break
		}
		pos++
	}

	// Check if the value ends with a double quote if it is a string, or a closing curly brace if it is a nested object
	if isString {
		if (*data)[pos] != '"' {
			return false, key, nil, pos, valuePos, MissingAtPositionError(
				"\"",
				pos,
			)
		}
		pos++
	} else if isNestedObject {
		if (*data)[pos] != '}' {
			return false, key, nil, pos, valuePos, MissingAtPositionError(
				"}",
				pos,
			)
		}
		pos++
	}

	// Get the value
	valueStr := (*data)[tempPos:pos]
	value = &valueStr

	return isNestedObject, key, value, pos, valuePos, nil
}

// ReadKeyValues reads key value pairs
func ReadKeyValues(
	data *string,
	pos int,
	validationFn func(
		isNestedObject bool,
		key string,
		value *string,
		valuePos int,
	) error,
	fieldsToRead ...string,
) (fields *map[string]*string, fieldsValuePos *map[string]int, err error) {
	// Check if the data is nil
	if data == nil {
		return nil, nil, fmt.Errorf("data is nil")
	}

	// Create the fields to read map
	fieldsToReadMap := make(map[string]bool)
	for _, field := range fieldsToRead {
		fieldsToReadMap[field] = true
	}

	// Get the fields
	var lastKey string
	fields = new(map[string]*string)
	fieldsValuePos = new(map[string]int)
	for i := 0; i < 2; i++ {
		// Get the key and value
		isNestedObject, key, value, finalPos, valuePos, err := ReadKeyValue(
			data,
			pos,
		)
		if err != nil {
			return nil, nil, err
		}

		// Call the validation function
		if validationFn != nil {
			err = validationFn(isNestedObject, key, value, valuePos)
			if err != nil {
				return nil, nil, err
			}
		}

		// Add the key and value to the fields
		(*fields)[key] = value
		(*fieldsValuePos)[key] = valuePos
		lastKey = key

		// Update the position
		pos = finalPos

		// Check if the next character is a comma
		pos = SkipUntilANonSpacingCharacter(data, pos)
		if pos >= len(*data) {
			// Check if there are any missing fields
			var missingFields []string
			for field, isMissing := range fieldsToReadMap {
				if isMissing {
					missingFields = append(missingFields, field)
				}
			}
			return nil, nil, fmt.Errorf(
				"missing fields: %s",
				strings.Join(missingFields, ", "),
			)
		}
		if (*data)[pos] != ',' {
			return nil, nil, MissingAtPositionError(",", pos)
		}
		pos++
	}

	// Check if there is any data after the last value
	pos = SkipUntilANonSpacingCharacter(data, pos)
	if pos < len(*data) {
		return nil, nil, fmt.Errorf("unexpected data after the %s", lastKey)
	}
	return fields, fieldsValuePos, nil
}

// HandleIncomingData handles the incoming data
func HandleIncomingData(
	writeFn func(message string),
	connNumber int,
	data *string,
) {
	// Check if the write function is nil
	if writeFn == nil {
		log.Println("write function is nil")
		return
	}

	//	Check if the data is nil
	if data == nil {
		LogAndWrite(connNumber, writeFn, "data is nil")
	}

	// Process the data
	log.Println("Received data: ", data)

	// Get the header and body
	fields, fieldsValuePos, err := ReadKeyValues(
		data,
		0,
		func(
			isNestedObject bool,
			key string,
			value *string,
			valuePos int,
		) error {
			// Check if it is a nested object
			if key == "header" && isNestedObject {
				return fmt.Errorf(
					"expected a string at position %d", valuePos,
				)
			} else if key == "body" && !isNestedObject {
				return fmt.Errorf(
					"expected a nested object at position %d",
					valuePos,
				)
			}
			return nil
		},
		"header",
		"body",
	)
	if err != nil {
		LogAndWriteError(connNumber, writeFn, err)
		return
	}

	// Log the header and body
	header := (*fields)["header"]
	body := (*fields)["body"]
	bodyValuePos := (*fieldsValuePos)["body"]
	log.Println("Header: ", *header)
	log.Println("Body: ", *body)

	// Call the appropriate handler
	switch *header {
	case internal.MorseHeader:
		HandleMorseCode(connNumber, writeFn, body, bodyValuePos)
	case internal.AddFileHeader:
		HandleAddFile(connNumber, writeFn, body, bodyValuePos)
	case internal.RemoveFileHeader:
		HandleRemoveFile(connNumber, writeFn, body, bodyValuePos)
	case internal.MailHeader:
		HandleMail(connNumber, writeFn, body, bodyValuePos)
	default:
		LogAndWrite(
			connNumber,
			writeFn,
			fmt.Sprintf("unknown header: %s", *header),
		)
	}
}

// HandleTCPConnection handles the TCP connection
func HandleTCPConnection(conn net.Conn, connNumber int) (
	func(message string),
	int,
	*string,
) {
	// Defer the connection close
	defer func(conn net.Conn) {
		err := conn.Close()
		if err != nil {
			log.Println("error closing connection:", err)
		}
	}(conn)

	// Create a buffer
	buffer := make([]byte, 1024)

	// Read the data from the connection
	_, err := conn.Read(buffer)
	if err != nil {
		// Log the error
		log.Println("Error reading: ", err)

		// Write that an error occurred
		_, err = conn.Write([]byte("An error occurred"))
		return nil, connNumber, nil
	}

	// Get the data from the buffer and trim the null characters
	trimmedBuffer := strings.Trim(string(buffer), "\x00")

	return func(message string) {
		_, err := conn.Write([]byte(message))
		if err != nil {
			log.Println("error writing: ", err)
		}
	}, connNumber, &trimmedBuffer
}

// HandleUDPIncomingData handles the UDP incoming data
func HandleUDPIncomingData(
	conn *net.UDPConn,
	connNumber int,
	clientAddr *net.UDPAddr,
	data *string,
) (
	func(message string),
	int,
	*string,
) {
	return func(message string) {
		_, err := conn.WriteToUDP([]byte(message), clientAddr)
		if err != nil {
			log.Println("error writing: ", err)
		}
	}, connNumber, data
}

// HandleMorseCode handles the morse code
func HandleMorseCode(
	connNumber int,
	writeFn func(message string),
	body *string,
	bodyValuePos int,
) {
	// Get the fields
	fields, _, err := ReadKeyValues(
		body,
		0,
		NoNestedObjects(bodyValuePos),
		"message",
		"to",
	)
	if err != nil {
		LogAndWriteError(connNumber, writeFn, err)
		return
	}
	message := (*fields)["message"]
	to := *(*fields)["to"]

	// Check the 'to' value
	toValues := []string{internal.MorseToMorse, internal.MorseToText}
	found := false
	for _, toValue := range toValues {
		if to == toValue {
			found = true
			break
		}
	}

	// Check if it was found
	if !found {
		LogAndWrite(
			connNumber,
			writeFn,
			fmt.Sprintf(
				"invalid 'to' field value %s, expected: %s",
				to,
				strings.Join(toValues, ", "),
			),
		)
	}
}

// HandleAddFile handles the add file
func HandleAddFile(
	connNumber int,
	writeFn func(message string),
	body *string,
	bodyValuePos int,
) {
	// Get the fields
	fields, _, err := ReadKeyValues(
		body,
		0,
		NoNestedObjects(bodyValuePos),
		"filename",
		"content",
	)
	if err != nil {
		LogAndWriteError(connNumber, writeFn, err)
		return
	}
	filename := *(*fields)["filename"]
	content := (*fields)["content"]
}

// HandleRemoveFile handles the remove file
func HandleRemoveFile(
	connNumber int,
	writeFn func(message string),
	body *string,
	bodyValuePos int,
) {
	// Get the fields
	fields, _, err := ReadKeyValues(
		body,
		0,
		NoNestedObjects(bodyValuePos),
		"filename",
	)
	if err != nil {
		LogAndWriteError(connNumber, writeFn, err)
		return
	}
	filename := *(*fields)["filename"]
}

// HandleMail handles the mail
func HandleMail(
	connNumber int,
	writeFn func(message string),
	body *string,
	bodyValuePos int,
) {
	// Get the fields
	fields, fieldsValuePos, err := ReadKeyValues(
		body,
		0,
		func(
			isNestedObject bool,
			key string,
			value *string,
			valuePos int,
		) error {
			// Check if it is a nested object
			if key != "to" {
				if isNestedObject {
					return fmt.Errorf(
						"expected a string at position %d",
						bodyValuePos+valuePos,
					)
				}
			} else if !isNestedObject {
				return fmt.Errorf(
					"expected a nested object at position %d",
					bodyValuePos+valuePos,
				)
			}
			return nil
		},
		"subject",
		"message",
		"to",
	)
	if err != nil {
		LogAndWriteError(connNumber, writeFn, err)
		return
	}
	subject := *(*fields)["subject"]
	message := (*fields)["message"]
	to := (*fields)["to"]

	// Get the 'to' fields
	toFields, _, err := ReadKeyValues(
		to,
		0,
		NoNestedObjects((*fieldsValuePos)["to"]+bodyValuePos),
		"name",
		"email",
	)
	if err != nil {
		LogAndWriteError(connNumber, writeFn, err)
		return
	}
	toName := *(*toFields)["name"]
	toEmail := *(*toFields)["email"]

	// Send the email on a separate goroutine
	go func() {
		// Set the origin and recipients
		from := mailersend.From{
			Name:  internalloader.MailerSendName,
			Email: internalloader.MailerSendEmail,
		}
		recipients := []mailersend.Recipient{
			{
				Name:  toName,
				Email: toEmail,
			},
		}

		// Send the email
		mailMessage := internalloader.MailerSendClient.Email.NewMessage()
		mailMessage.SetFrom(from)
		mailMessage.SetRecipients(recipients)
		mailMessage.SetSubject(subject)
		mailMessage.SetText(*message)

		res, err := internalloader.MailerSendClient.Email.Send(
			context.Background(),
			mailMessage,
		)
		if err != nil {
			// handle error
			fmt.Println("Error sending email:", err)
		} else {
			fmt.Println("Email sent successfully:", res)
		}
	}()

}
