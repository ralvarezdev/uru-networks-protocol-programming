# uru-networks-protocol-programming

**Note:** Archived and read-only. Kept for reference from the Network Protocols Programming college course.

Projects and practices from the Network Protocols Programming college course. Each numbered folder is an independent client/server exercise exploring a different network protocol or transport.

## Folders

- **`01-weird-protocol`** — custom protocol over TCP, encoding messages as Morse code. Go (module `github.com/ralvarezdev/uru-networks-protocol-programming/01-weird-protocol`, Go 1.23.4), using `github.com/ralvarezdev/go-morse` and `mailersend-go`; server watches a `files` folder.
- **`02-ftp`** — FTP. Node.js (ESM); server uses `ftp-srv`, client uses `basic-ftp`.
- **`03-rs232`** — RS-232 serial communication. Node.js (ESM), both sides use `serialport`.
- **`04-sftp`** — SFTP. Node.js (ESM); client uses `ssh2-sftp-client` (no server package committed).
- **`05-smtp`** — SMTP. Node.js (ESM); server uses `smtp-server` + `mailparser`, client uses `nodemailer`.
- **`06-socketio`** — WebSockets via Socket.IO. Node.js (ESM); server uses `express` + `socket.io`, client uses `socket.io-client`.

## Running

Go exercise:

```bash
cd 01-weird-protocol
go run ./cmd/server
go run ./cmd/client
```

Node.js exercises (server and client in separate terminals):

```bash
cd 0X-<protocol>/server && npm install && npm start
cd 0X-<protocol>/client && npm install && npm start
```

Each Node package reads configuration via `dotenv` — check each folder's `index.js` for the expected environment variables.

## License

GNU General Public License v3.0 (see `LICENSE`).
