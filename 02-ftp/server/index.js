import 'dotenv/config';
import FTPServer from 'ftp-srv';
import {fileURLToPath} from "url";
import {dirname} from "path";
import * as path from "node:path";
import csv from "csv-parser";
import fs from "fs";
import {IS_DEBUG, loadNode} from "@ralvarezdev/js-mode";

// Load the environment variables
loadNode()

// Get the file name and directory
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

// TLS files path and flag
const KEY_PATH = "./private.key"
const CERT_PATH = "./cert.crt"
const TLS=true

// Users CSV path
const USERS_PATH = "./users.csv"

// FTP server base directory
const BASE_DIR = path.resolve(__dirname, 'files')

// Load the users
async function loadUser(path) {
    // Create the user map
    const users = new Map()

    return new Promise((resolve, reject) => {
            fs.createReadStream(path)
                .pipe(csv())
                .on('data', (row) => {
                    // Set the user
                    users.set(row.user, row.password)
                })
                .on('end', () => {
                    console.log(`CSV file successfully processed: ${path}`);

                    // Print the users
                    if (IS_DEBUG)
                        console.log(users)

                    resolve(users)
                });
        }
    )
}

// Create a new FTP server
function createFTPServer(users, tls) {
    // Create a new FTP server
    const url = tls ? 'ftp://0.0.0.0:2121' : 'ftp://0.0.0.0:21'
    const ftpServer = new FTPServer({
        url,
        tls: tls ? {
            key: fs.readFileSync(KEY_PATH),
            cert: fs.readFileSync(CERT_PATH),
        }: undefined
    });

    // Handle the login event
    ftpServer.on('login', ({
                               connection,
                               username,
                               password
                           }, resolve, reject) => {
        if (users.has(username) && users.get(username) === password) {
            return resolve({root: BASE_DIR});
        }
        return reject(new Error('Invalid username or password'));
    });

    // Listen for client connections
    ftpServer.listen()
        .then(() => {
            console.log(`FTP server is running at ${url}`);
        });

    // Return the FTP server
    return ftpServer;
}

// Load the users
loadUser(USERS_PATH).then(
    users =>createFTPServer(users,TLS)
).catch(
    e=>console.error(e)
)
