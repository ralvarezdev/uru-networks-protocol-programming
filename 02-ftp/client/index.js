const ftp = require('basic-ftp');

async function upload() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        await client.access({
            host: 'localhost',
            port: 21,
            user: 'user',
            password: 'password',
            secure: false
        });

        console.log('Connected to FTP server');

        await client.uploadFrom('local/file/path.txt', 'remote/file/path.txt');
        console.log('File uploaded successfully');
    } catch (err) {
        console.error('Error: ', err);
    }

    client.close();
}

upload();
