import "dotenv/config"
import Client from 'ssh2-sftp-client'
import fs from 'fs'
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import * as path from "node:path";

// Get the filename and dirname
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

// SFTP client
const SFTP_HOST = process.env.SFTP_HOST
const SFTP_PORT = process.env.SFTP_PORT
const SFTP_USERNAME = process.env.SFTP_USERNAME
const SFTP_PASSWORD = process.env.SFTP_PASSWORD
// const SFTP_PRIVATE_KEY_PATH = path.join(__dirname, 'id_rsa')

// SFTP client
class SFTPClient {
    constructor() {
        this.client = new Client();
    }

    // Connect to the SFTP server
    async connect(options) {
        console.log(`Connecting to ${options.host}:${options.port}`);
        try {
            await this.client.connect(options);
        } catch (err) {
            console.log('Failed to connect:', err);
        }
    }

    // Disconnect from the SFTP server
    async disconnect() {
        await this.client.end();
    }

    // List files in a remote directory
    async listFiles(remoteDir, fileGlob) {
        console.log(`Listing ${remoteDir} ...`);
        let fileObjects;
        try {
            fileObjects = await this.client.list(remoteDir, fileGlob);
        } catch (err) {
            console.log('Listing failed:', err);
        }

        const fileNames = [];

        for (const file of fileObjects) {
            if (file.type === 'd')
                console.log(`${new Date(file.modifyTime).toISOString()} PRE ${file.name}`);
                else
                console.log(`${new Date(file.modifyTime).toISOString()} ${file.size} ${file.name}`);

            fileNames.push(file.name);
        }

        return fileNames;
    }

    // Upload a local file to a remote file
    async uploadFile(localFile, remoteFile) {
        console.log(`Uploading ${localFile} to ${remoteFile} ...`);
        try {
            await this.client.put(localFile, remoteFile);
        } catch (err) {
            console.error('Uploading failed:', err);
        }
    }

    // Download a remote file
    async downloadFile(remoteFile, localFile) {
        console.log(`Downloading ${remoteFile} to ${localFile} ...`);
        try {
            await this.client.get(remoteFile, localFile);
        } catch (err) {
            console.error('Downloading failed:', err);
        }
    }

    // Delete a remote file
    async deleteFile(remoteFile) {
        console.log(`Deleting ${remoteFile}`);
        try {
            await this.client.delete(remoteFile);
        } catch (err) {
            console.error('Deleting failed:', err);
        }
    }
}

(async () => {
    // Open the connection
    const client = new SFTPClient();
    await client.connect({
        host: SFTP_HOST,
        password: SFTP_PASSWORD,
        username: SFTP_USERNAME,
        port: SFTP_PORT,
        // privateKey: fs.readFileSync(SFTP_PRIVATE_KEY_PATH)
    });

    // List working directory files
    await client.listFiles(".");

    // Upload local file to remote file
    await client.uploadFile("./files/local.txt", "./remote.txt");

    // Download remote file to local file
    await client.downloadFile("./remote.txt", "./files/download.txt");

    // Delete remote file
     await client.deleteFile("./remote.txt");

    // Close the connection
    await client.disconnect();
})();
