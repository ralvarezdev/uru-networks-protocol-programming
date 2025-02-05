import dotenv from 'dotenv';
import FTPClient from 'basic-ftp';
import {fileURLToPath} from "url";
import {dirname} from "path";
import * as path from "node:path";
import * as readline from "node:readline";
import DeepFreeze from "@ralvarezdev/js-deep-freeze";

// Load the environment variables
dotenv.config()

// Get the user username and password
const USERNAME=process.env.FTP_USERNAME
const PASSWORD= process.env.FTP_PASSWORD

// Get the file name and directory
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

// FTP client base directory
const BASE_DIR = path.resolve(__dirname, 'files')

// TLS flags
const TLS=true
const TLS_ALLOW_SELF_SIGNED_CERT = true

// Menu options and messages
const MENU = DeepFreeze({
    MESSAGE: `
--- FTP${TLS ? 'S' : ''} Client Menu ---
1. Upload a file
2. Download a file
3. Get current remote directory
4. Change remote directory
5. Ensure directory
6. Clear working directory
7. Delete directory
8. Delete empty directory
9. Delete file
10. Rename file or directory
11. Get file size
12. Get file modification time
13. List working directory contents
14. Exit
`,
    OPTIONS: {
        UPLOAD_FILE: '1',
        DOWNLOAD_FILE: '2',
        GET_CURRENT_REMOTE_DIRECTORY: '3',
        CHANGE_REMOTE_DIRECTORY: '4',
        ENSURE_DIRECTORY: '5',
        CLEAR_WORKING_DIRECTORY: '6',
        DELETE_DIRECTORY: '7',
        DELETE_EMPTY_DIRECTORY: '8',
        DELETE_FILE: '9',
        RENAME_FILE_OR_DIRECTORY: '10',
        GET_FILE_SIZE: '11',
        GET_FILE_MODIFICATION_TIME: '12',
        LIST_WORKING_DIRECTORY_CONTENTS: '13',
        EXIT: '14'
    }
})

// Create a new readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to the FTP server
async function connect(){
    const client = new FTPClient.Client();
    client.ftp.verbose = true;

    try {
        await client.access({
            host: '0.0.0.0',
            port: TLS?2121:21,
            user: USERNAME,
            password: PASSWORD,
            secure: TLS,
            secureOptions: TLS_ALLOW_SELF_SIGNED_CERT ? { rejectUnauthorized: false } : undefined
        });
        console.log('Connected to FTP server');
    }catch(err){
        console.error(err)
    }
    return client
}

// Close the FTP server connection
async function close(client) {
  client.close();
  console.log('Closed FTP server connection');
}

// Ask for the file local path
async function questionLocalFilePath() {
    return await new Promise((resolve) =>
        rl.question('Enter the local file path: ', resolve)
    );
}

// Ask for the file remote path
async function questionRemoteFilePath() {
    return await new Promise((resolve) =>
        rl.question('Enter the remote file path: ', resolve)
    );
}

// Ask for the remote directory path
async function questionRemoteDirectoryPath() {
    return await new Promise((resolve) =>
        rl.question('Enter the remote directory path: ', resolve)
    );
}

// Ask press enter to continue
async function pressEnterToContinue() {
    return await new Promise((resolve) =>
        rl.question('\nPress Enter to continue...', resolve)
    );
}


// Upload a file to an FTP server
async function upload(client, localFilePath, remoteFilePath) {
    try {
        await client.uploadFrom(path.resolve(BASE_DIR, localFilePath), remoteFilePath);
        console.log(`File uploaded successfully from '${localFilePath}' to '${remoteFilePath}'`);
    } catch (err) {
        console.error(`Failed to upload file from '${localFilePath}' to '${remoteFilePath}': ${err}`);
    }
}

// Download a file from an FTP server
async function download(client, localFilePath, remoteFilePath) {
   try {
        await client.downloadTo(path.resolve(BASE_DIR, localFilePath), remoteFilePath);
        console.log(`File downloaded successfully from '${remoteFilePath}' to '${localFilePath}'`);
   } catch (err) {
        console.error(`Failed to download file from '${remoteFilePath}' to '${localFilePath}': ${err}`);
   }
}

// Get current remote directory
async function getCurrentRemoteDirectory(client){
    try {
        const currentRemoteDirectory = await client.pwd();
        console.log(`Current remote directory: '${currentRemoteDirectory}'`);
    } catch (err) {
        console.error(`Failed to get current remote directory: ${err}`);
    }
}

// Change remote directory
async function changeRemoteDirectory(client, remoteDirectoryPath){
    try{
    await client.cd(remoteDirectoryPath);
    console.log(`Remote directory changed to '${remoteDirectoryPath}'`);
    } catch (err) {
        console.error(`Failed to change remote directory to '${remoteDirectoryPath}': ${err}`);
    }
}

// Ensure that a remote directory exists
async function ensureDirectory(client, remoteDirectoryPath) {
    try {
        await client.ensureDir(remoteDirectoryPath);
        console.log(`Ensured that '${remoteDirectoryPath}' exists`);
    } catch(err) {
        console.error(`Failed to ensure that '${remoteDirectoryPath}' exists: ${err}`)
    }
}

// Clear working directory
async function clearWorkingDirectory(client){
    try {
        await client.clearWorkingDir();
        console.error(`Clear working directory successfully`)
    } catch (err) {
        console.error(`Failed to clear working directory: ${err}`)
    }
}

// Delete directory
async function deleteDirectory(client, remoteDirectoryPath){
    try {
        await client.removeDir(remoteDirectoryPath);
        console.error(`Delete directory successfully '${remoteDirectoryPath}'`)
    } catch (err) {
        console.error(`Failed to delete directory '${remoteDirectoryPath}': ${err}`)
    }
}

// Delete empty directory
async function deleteEmptyDirectory(client, remoteDirectoryPath){
    try {
        await client.removeEmptyDir(remoteDirectoryPath);
        console.error(`Delete empty directory successfully '${remoteDirectoryPath}'`)
    } catch (err) {
        console.error(`Failed to delete empty directory '${remoteDirectoryPath}': ${err}`)
    }
}

// Delete file
async function deleteFile(client, remoteFilePath){
    try {
        await client.remove(remoteFilePath);
        console.error(`Delete file successfully '${remoteFilePath}'`)
    } catch (err) {
        console.error(`Failed to delete file '${remoteFilePath}': ${err}`)
    }
}

// Rename file or directory
async function rename(client, removeFromPath, removeToPath){
    try {
        await client.rename(removeFromPath, removeToPath);
        console.error(`Rename '${removeFromPath}' to '${removeToPath}' successfully`)
    } catch (err) {
        console.error(`Failed to rename '${removeFromPath}' to '${removeToPath}': ${err}`)
    }
}

// Get file size
async function size(client, remoteFilePath){
    try {
        const size = await client.size(remoteFilePath);
        console.error(`Size of file '${remoteFilePath}': ${size}`)
    } catch (err) {
        console.error(`Failed to get size of file '${remoteFilePath}': ${err}`)
    }
}

// Get file modification time
async function lastModification(client, remoteFilePath){
    try {
        const lastMod = await client.lastMod(remoteFilePath);
        console.error(`Last modification time of file '${remoteFilePath}': ${lastMod}`)
    } catch (err) {
        console.error(`Failed to get last modification time of file '${remoteFilePath}': ${err}`)
    }
}

// List working directory contents
async function list(client){
    try {
        const listResult = await client.list();
        console.log('Directory Contents:');
        listResult.forEach(item => console.log(item.name));
    } catch (err) {
        console.error(`Failed to list directory contents: ${err}`)
    }
}

// Print the menu and ask for the option
async function main(){
    // Connect to the FTP server
    const client = await connect();

    // Print the menu
    let localFilePath, remoteFilePath, remoteDirectoryPath, removeFromPath, removeToPath;
    while (true) {
        // Print the menu
        console.log(MENU.MESSAGE);

        // Select the option
        const option = await new Promise((resolve) =>
            rl.question('Enter the option: ', resolve)
        );

        // Perform the selected option
        switch (option) {
            case MENU.OPTIONS.UPLOAD_FILE:
                localFilePath = await questionLocalFilePath();
                remoteFilePath = await questionRemoteFilePath();
                await upload(client, localFilePath, remoteFilePath);
                break;
            case MENU.OPTIONS.DOWNLOAD_FILE:
                localFilePath = await questionLocalFilePath();
                remoteFilePath = await questionRemoteFilePath();
                await download(client, localFilePath, remoteFilePath);
                break;
            case MENU.OPTIONS.GET_CURRENT_REMOTE_DIRECTORY:
                await getCurrentRemoteDirectory(client);
                break;
            case MENU.OPTIONS.CHANGE_REMOTE_DIRECTORY:
                remoteDirectoryPath = await questionRemoteDirectoryPath();
                await changeRemoteDirectory(client, remoteDirectoryPath);
                break;
            case MENU.OPTIONS.ENSURE_DIRECTORY:
                remoteDirectoryPath = await questionRemoteDirectoryPath();
                await ensureDirectory(client, remoteDirectoryPath);
                break;
            case MENU.OPTIONS.CLEAR_WORKING_DIRECTORY:
                await clearWorkingDirectory(client);
                break;
            case MENU.OPTIONS.DELETE_DIRECTORY:
                remoteDirectoryPath = await questionRemoteDirectoryPath();
                await deleteDirectory(client, remoteDirectoryPath);
                break;
            case MENU.OPTIONS.DELETE_EMPTY_DIRECTORY:
                remoteDirectoryPath = await questionRemoteDirectoryPath();
                await deleteEmptyDirectory(client, remoteDirectoryPath);
                break;
            case MENU.OPTIONS.DELETE_FILE:
                remoteFilePath = await questionRemoteFilePath();
                await deleteFile(client, remoteFilePath);
                break;
            case MENU.OPTIONS.RENAME_FILE_OR_DIRECTORY:
                removeFromPath = await questionRemoteFilePath();
                removeToPath = await questionRemoteFilePath();
                await rename(client, removeFromPath, removeToPath);
                break;
            case MENU.OPTIONS.GET_FILE_SIZE:
                remoteFilePath = await questionRemoteFilePath();
                await size(client, remoteFilePath);
                break;
            case MENU.OPTIONS.GET_FILE_MODIFICATION_TIME:
                remoteFilePath = await questionRemoteFilePath();
                await lastModification(client, remoteFilePath);
                break;
            case MENU.OPTIONS.LIST_WORKING_DIRECTORY_CONTENTS:
                await list(client);
                break
            case MENU.OPTIONS.EXIT:
                await close(client);
                rl.close()
                return;
            default:
                console.error('Invalid option');
                break;
        }

        // Press enter to continue
        await pressEnterToContinue();
    }
}

// Run the main function
main().catch(err => {
    console.error(`FTP client failed: ${err}`);
    rl.close();
})