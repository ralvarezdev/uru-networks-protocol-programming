package loader

import (
	"github.com/mailersend/mailersend-go"
	goloaderenv "github.com/ralvarezdev/go-loader/env"
)

const (
	// EnvMailerSendAPIKey is the key for the API key of the mailer send service in the environment variables
	EnvMailerSendAPIKey = "MAILER_SEND_API_KEY"

	// EnvMailerSendDomain is the key for the domain of the mailer send service in the environment variables
	EnvMailerSendDomain = "MAILER_SEND_DOMAIN"
)

var (
	// Loader is the environment variables loader
	Loader goloaderenv.Loader

	// MailerSendAPIKey is the API key of the mailer send service
	MailerSendAPIKey string

	// MailerSendDomain is the domain of the mailer send service
	MailerSendDomain string

	// MailerSendClient is the client for the mailer send service
	MailerSendClient *mailersend.Mailersend
)

// Load loads the loader
func Load() {
	// Load the environment variables loader
	loader, _ := goloaderenv.NewDefaultLoader(
		nil,
		nil,
	)
	Loader = loader

	// Load the environment variables
	for env, dest := range map[string]*string{
		EnvMailerSendAPIKey: &MailerSendAPIKey,
		EnvMailerSendDomain: &MailerSendDomain,
	} {
		if err := Loader.LoadVariable(
			env,
			dest,
		); err != nil {
			panic(err)
		}
	}

	// Create a new MailerSend client
	MailerSendClient = mailersend.NewMailersend(MailerSendAPIKey)
}
