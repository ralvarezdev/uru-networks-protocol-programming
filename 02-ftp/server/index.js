import FTPServer from 'ftp-srv';
import {fileURLToPath} from "url";
import {dirname} from "path";
import * as path from "node:path";

// Get the file name and directory
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

// Create a new FTP server
const ftpServer = new FTPServer({
    url: 'ftp://0.0.0.0:21'
});

// Handle the login event
ftpServer.on('login', ({connection, username, password}, resolve, reject) => {
    if (username === 'user' && password === 'password') {
        return resolve({root: path.resolve(__dirname, 'files')});
    }
    return reject(new Error('Invalid username or password'));
});

ftpServer.listen()
    .then(() => {
        console.log(`FTP server is running at ftp://0.0.0.0:21`);
    });
