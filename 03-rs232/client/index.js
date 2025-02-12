import 'dotenv/config';
import {SerialPort} from 'serialport';
import fs from 'fs';
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import * as string_decoder from "node:string_decoder";
import * as path from "node:path";

// Log an error and exit the process
const onError = (error) => {
    console.error(error);
    process.exit(1);
}

// Get the filename and dirname
const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

// Set the base path
const BASE_PATH = path.join(__dirname, 'files')

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

// Get the encoding and extension from the arguments
const DECODING_KEY_INDEX = ARGS.indexOf('--decode');
let DECODE=true
if (DECODING_KEY_INDEX <0 || DECODING_KEY_INDEX+2>=ARGS.length)
    DECODE = false

const ENCODING = ARGS[DECODING_KEY_INDEX+1];
const EXTENSION = ARGS[DECODING_KEY_INDEX+2];

// Get the decoder
let DECODER
if (DECODE)
    DECODER = new string_decoder.StringDecoder(ENCODING);

// Create a new serial port receiver
const receiver = new SerialPort({ path: SERIAL_PORT_PATH, baudRate: SERIAL_PORT_BAUD_RATE });

// Handle the data event
receiver.on('data', (data) => {
    if (data) {
        // Get the output binary file path
        const outputFilenameWithoutExtension = String(Date.now())
        const outputBinaryFilePath = `${BASE_PATH}\\${outputFilenameWithoutExtension}.bin`;

        // Write the binary data to the file
        console.log(`Writing binary data to ${outputBinaryFilePath}`);
        fs.writeFileSync(outputBinaryFilePath, data, (err) => {
            console.error('An error occurred while saving the binary file:', err);
        });

        if (DECODE) {
            // Get the decoded output file path
             const outputDecodedFilePath = `${BASE_PATH}\\${outputFilenameWithoutExtension}.${EXTENSION}`;

             // Decode the data
            const decodedData = DECODER.write(data);

            // Write the decoded data to the file
            console.log(`Writing decoded data to ${outputDecodedFilePath}`);
            fs.writeFileSync(outputDecodedFilePath, decodedData, (err) => {
                console.error('An error occurred while saving the decoded file:', err);
            });
        }
    }
});

receiver.on('open', () => {
    console.log('Serial port opened');
});
