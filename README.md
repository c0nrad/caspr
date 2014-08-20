# Caspr

Content Security Policy Report Aggregator

https://caspr.io

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/c0nrad/caspr)

## Deployment

Either use Heroku, or to install manually, install NodeJS/npm/MongoDB(>2.6).

```bash
git clone https://github.com/c0nrad/caspr.git
cd caspr
npm install
forever bin/www
```

## Usage

```
$> node bin/www --help

Usage: node www [options]

Options:
   -p, --port               Port to run http caspr  [3000]
   --ssl                    Run ssl on port 443  [false]
   --sslKeyFile             SSL key file for ssl  [./bin/certs/key.pem]
   --sslCertFile            SSL certificate file for ssl  [./bin/certs/cert.pem]
   --cappedCollectionSize   Size of report collection in bytes  [0]
```

### SSL

To use caspr with SSL, set sslKeyFIle and sslCertFile to the location of your cert and private key file on disk with `--sslKeyFile` and `--sslCertFIle`.

```bash
forever bin/www --ssl --sslKeyFile /var/certs/key.pem --sslCertFile /var/certs/cert.pem
```

### Capped Collections

MongoDB supports capped collections, meaning you can specifiy a maximum size for the reports collection in your DB.

For my own deployments I usually set it around 1GB, but on Heroku the maximum size of the free version is .5GB.

To use capped collections, either set it manually or pass the size in bytes you'd like the reports collection to be.

```bash
forever bin/www --capped 500000000 // .5GB
```

```javascript
use caspr
db.runCommand({convertToCapped: 'reports', size: 500000000 })
```
http://docs.mongodb.org/manual/reference/command/convertToCapped/

## Raw reports dump

All reports are stored within MongoDB. So a script such as the following can be used to dump all reports into a json file

dump.js
```json
cursor = db.getSiblingDB('caspr').reports.find();
while ( cursor.hasNext() ) {
   printjson( cursor.next() );
}
```

```bash
mongo dump.js > dump.json
```

## Future

- Auto Policy Generator
  - More beginner friendly
- More flexable API for handling reports

## Contact

c0nrad@c0nrad.io
