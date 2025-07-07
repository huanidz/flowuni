#!bin/bash

docker rm $(docker ps -aq -f status=exited)