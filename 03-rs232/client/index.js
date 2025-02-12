import 'dotenv/config';
import {SerialPort} from 'serialport';
import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import * as timers from "node:timers";
import * as string_decoder from "node:string_decoder";

// Log an error and exit the process
const onError = (error) => {
    console.error(error);
    process.exit(1);
}

// Get the filename and dirname
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

// Set the base path
const BASE_PATH = `${__dirname}/files`;

// Check if the base path exists
if (!fs.existsSync(BASE_PATH))
    fs.mkdirSync(BASE_PATH);

// Get the serial port path and baud rate
const SERIAL_PORT_PATH = process.env.SERIAL_PORT_PATH
let SERIAL_PORT_BAUD_RATE = process.env.SERIAL_PORT_BAUD_RATE;

// Parse the baud rate
try {
    SERIAL_PORT_BAUD_RATE = parseInt(SERIAL_PORT_BAUD_RATE);
}
catch (e) {
    onError('The serial port baud rate must be an integer');
}

// Get the arguments
const ARGS= process.argv.slice(2);

// Get the encoding from the arguments
const ENCODING_KEY_INDEX = ARGS.indexOf('--encoding');
if (ENCODING_KEY_INDEX <0 || ENCODING_KEY_INDEX+1===ARGS.length)
    onError('The encoding must be specified');
const ENCODING = ARGS[ENCODING_KEY_INDEX+1];

// Get the extension from the arguments
const EXTENSION_KEY_INDEX = ARGS.indexOf('--extension');
if (EXTENSION_KEY_INDEX <0 || EXTENSION_KEY_INDEX+1===ARGS.length)
    onError('The extension must be specified');
const EXTENSION = ARGS[EXTENSION_KEY_INDEX+1];

// Get the decoder
const decoder = new string_decoder.StringDecoder(ENCODING);

// Create a new serial port receiver
const receiver = new SerialPort({ path: SERIAL_PORT_PATH, baudRate: SERIAL_PORT_BAUD_RATE });

// Handle the data event
receiver.on('data', (data) => {
    if (data) {
        // Get the output file path
        const outputFilenameWithoutExtension = String(Date.now())
        const outputBinaryFilePath = `${BASE_PATH}/${outputFilenameWithoutExtension}.bin`;
        const outputDecodedFilePath = `${BASE_PATH}/${outputFilenameWithoutExtension}.${EXTENSION}`;

        // Write the binary data to the file
        fs.writeFileSync(outputBinaryFilePath, data, (err) => {
            if (err)
                console.error('An error occurred while saving the binary file:', err);
             else
                console.log(`Binary data saved to ${outputBinaryFilePath}`);
        });

        // Decode the data
        const decodedData = decoder.write(data);

        // Write the decoded data to the file
        fs.writeFileSync(outputDecodedFilePath, decodedData, (err) => {
            if (err)
                console.error('An error occurred while saving the decoded file:', err);
             else
                console.log(`Decoded data saved to ${outputDecodedFilePath}`);
        });
    }
});

receiver.on('open', () => {
    console.log('Serial port opened');
});