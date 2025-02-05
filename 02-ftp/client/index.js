import FTPClient from 'basic-ftp';
import {fileURLToPath} from "url";
import {dirname} from "path";
import * as path from "node:path";

// Get the file name and directory
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

// Upload a file to an FTP server
async function upload() {
    const client = new FTPClient.Client();
    client.ftp.verbose = true;

    try {
        await client.access({
            host: '0.0.0.0',
            port: 21,
            user: 'user',
            password: 'password',
            secure: false
        });
        console.log('Connected to FTP server');

        await client.uploadFrom(path.resolve(__dirname, "files/upload.txt"), 'upload.txt');
        console.log('File uploaded successfully');
    } catch (err) {
        console.error('Error: ', err);
    }

    client.close();
}

// Upload the file
upload().then(r => console.log('Upload finished')).catch(err => console.error('Error: ', err));

// Download a file from an FTP server
async function download() {
    const client = new FTPClient.Client();
    client.ftp.verbose = true;

    try {
        await client.access({
            host: '0.0.0.0',
            port: 21,
            user: 'user',
            password: 'password',
            secure: false
        });

        console.log('Connected to FTP server');

        await client.downloadTo(path.resolve(__dirname, "files/download.txt"), 'download.txt');
        console.log('File downloaded successfully');
    } catch (err) {
        console.error('Error: ', err);
    }

    client.close();
}

// Download the file
download().then(r => console.log('Download finished')).catch(err => console.error('Error: ', err));