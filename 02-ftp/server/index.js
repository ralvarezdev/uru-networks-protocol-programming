const FTPSrv = require('ftp-srv');

const ftpServer = new FTPSrv('ftp://0.0.0.0:21');

ftpServer.on('login', ({connection, username, password}, resolve, reject) => {
    if (username === 'user' && password === 'password') {
        return resolve({root: '/path/to/ftp/root'});
    }
    return reject(new Error('Invalid username or password'));
});

ftpServer.listen()
    .then(() => {
        console.log(`FTP server is running at ftp://0.0.0.0:21`);
    });
