# Query and compare Image To Text solutions from cloud providers

This repo is a collection of methods to query AWS Rekognition and Google Cloud Vision to perform text extraction from image. In addition to querying these two providers, we also compare the results and check is there is a match or not.

## Scripts

- `src/query.js` will query the provider giving a folder of images
- `src/extract.js` will extract text from the query, and writes a CSV file
- `src/match.js` checks if there is match between AWS Rekognition and Google Cloud Vision extractions

## Nota

This is still a work in progress. But it already provid enough benefits to be shared publicly. Please note that it will very probably requires you to adapt scripts for your specific use.

Hassen

