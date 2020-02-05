I know there are credentials in this repo. They will all be hidden as soon as this has a public port.

# Install Steps

Make sure you have Docker, docker-compose, and yarn installed. Links/instructions coming soon.

**Note:** If you are on Linux environnement, copy ```scripts/docker_host.sh``` to ```/etc/profile.d/``` and log out from your current session.

## Install command line tools and dependencies necessary for development
    make install

## Start docker containers in one terminal where you can see the logs
    make cleardb
    make docker

## Setup everything; be mindful of startup times
    make setup_migrations
    make setup_minio

# Dev env

I open 4 tabs and run the following commands

    make docker
    make server DEV=1 // DEV IS IMPORTANT,SEE NOTES
    make client
    make migrate

**Notes:**

the following command will run the server in production mode 

    make server

# Browser

* Databrary: http://localhost:8000/login
* Hasura: http://localhost:8002 if you wan to run hasura in migaration mode http://localhost:9695
* Minio: http://localhost:9000
