#!/bin/bash

export NODE_PATH=`pwd`:`pwd`/node_modules:`pwd`/../lib
node --harmony_proxies $@
