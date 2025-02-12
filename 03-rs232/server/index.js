import 'dotenv/config';
import { SerialPort } from 'serialport';
import fs from 'fs';
import {fileURLToPath} from "url";
import {dirname} from "path";
import * as path from "node:path";

// Get the filename and dirname
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

// Set the base path
const BASE_PATH = path.join(__dirname, 'files');

// Check if the base path exists
if (!fs.existsSync(BASE_PATH))
    fs.mkdirSync(BASE_PATH);

// Log an error and exit the process
const onError = (error) => {
    console.error(error);
    process.exit(1);
}

// Get the serial port path and baud rate
const SERIAL_PORT_PATH = process.env.SERIAL_PORT_PATH;
if (!SERIAL_PORT_PATH)
    onError('Please provide a serial port path using the SERIAL_PORT_PATH environment variable');

let SERIAL_PORT_BAUD_RATE = process.env.SERIAL_PORT_BAUD_RATE;
if (!SERIAL_PORT_BAUD_RATE)
    onError('Please provide a serial port baud rate using the SERIAL_PORT_BAUD_RATE environment variable')

// Parse the baud rate
try {
    SERIAL_PORT_BAUD_RATE = parseInt(SERIAL_PORT_BAUD_RATE);
}
catch (e) {
    console.error('The serial port baud rate must be an integer');
    process.exit(1);
}

// Get the arguments
const ARGS= process.argv.slice(2);

// Get the file path
const FILE_PATH_KEY_INDEX = ARGS.indexOf('--file');
if (FILE_PATH_KEY_INDEX < 0)
    onError('Please provide a file path using the --file flag');
if (ARGS.length<=FILE_PATH_KEY_INDEX)
    onError('Please provide a file path after the --file flag');

const FILE_PATH = ARGS[FILE_PATH_KEY_INDEX+1];

// Check if the file has to be converted to binary
const CONVERT_TO_BINARY = ARGS.includes('--binary');

// Create a new serial port sender
const sender = new SerialPort({ path: SERIAL_PORT_PATH, baudRate: SERIAL_PORT_BAUD_RATE });

// Get the filename and extension
const fullFilePath = path.join(BASE_PATH, FILE_PATH);
const filePathSplit = fullFilePath.split('\\');
const filePathWithoutFilename = filePathSplit.slice(0, -1).join('\\');
const fileName = filePathSplit.slice(-1)[0];
const fileNameWithoutExtension = fileName.split('.').slice(0, -1).join('.');

// Read the file
let fileBuffer = fs.readFileSync(fullFilePath);

// Check if the file has to be converted to binary
if (CONVERT_TO_BINARY) {
    // Convert the file to binary
    const binaryBuffer = Buffer.from(fileBuffer.toString('binary'), 'binary');
    fs.writeFileSync(`${filePathWithoutFilename}\\${fileNameWithoutExtension}.bin`, binaryBuffer);

    // Update the file buffer
    fileBuffer = binaryBuffer;
}

// Send the file
const sendFile = (fileBuffer) => {
    console.log('Sending file...');
    sender.write(fileBuffer, (err) => {
        if (err)
            console.error('An error occurred while sending the file:', err);
    });
}

// Add event listeners
sender.on('open', () => {
    console.log('Serial port opened');

    // Send file
    sendFile(fileBuffer);
});
