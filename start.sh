#!/bin/sh

cd build;
node ace migration:run --force;
pm2 start ./bin/server.js
