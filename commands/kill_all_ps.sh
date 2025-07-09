#!bin/bash

docker stop $(docker ps -a --filter "name=piscale-law-qa-refractored" -q)