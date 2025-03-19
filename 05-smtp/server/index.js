import {SMTPServer} from "smtp-server";
import {simpleParser as parser} from "mailparser"
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Get the current file URL
const __filename = fileURLToPath(import.meta.url);

// Get the directory name of the current module
const __dirname = path.dirname(__filename);

// Load TLS certificates
const key = fs.readFileSync(path.join(__dirname, 'server.key'));
const cert = fs.readFileSync(path.join(__dirname, 'server.cer'));

// Mail server
const server = new SMTPServer({
  key: key,
  cert: cert,
  options: {
    logger: true,
  },
  secure: true,
  onAuth(auth, session, callback) {
    if (auth.username === 'user' && auth.password === 'password') {
      callback(null, { user: 'authorizedUser' });
    } else {
      callback(new Error('Invalid username or password'));
    }
  },
  onData(stream, session, callback) {
    // Parse the email from the stream to get the email object
    parser(stream, {}, (err, parsed) => {
      if (err)
        console.log("Error:" , err)

      console.log(parsed)
      stream.on("end", callback)
    })
  },
});

server.listen(465, () => {
  console.log('SMTP server is running on port 465');
})