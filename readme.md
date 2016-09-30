# Project Setup
## Prerequisites
```
### Create project folder
mkdir -p [pathToProjectFolder]
cd [pathToProjectFolder]
### Install NodeJS Modules
npm install geotabuladb express socket.io
```
You can use the npm '-g' option if you want to install NodeJS modules globally so it is set up for all projects.
```
npm install -g geotabuladb express socket.io
```
Then, you can link specific modules to your project or define the NODE_PATH environment variable:
```
# To link specific modules:
npm link geotabuladb express socket.io

# To set the NODE_PATH environment variable for the current user:
export NODE_PATH='/usr/local/lib/node_modules'

# To permanently set the NODE_PATH environment variable:
echo "export NODE_PATH='/usr/local/lib/node_modules'" >> ~/.bashrc
```

# Project Screenshot
![screenshot](data/example.png)


