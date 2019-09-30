<br />
<br />
<br />
<p align="center">
  <a href="https://alpha.zabo.sparcs.org">
    <img src="admin/src/assets/img/Services-Zabo.svg" alt="Logo" height="150">
  </a>
  
  <p align="center">
    <img src="https://img.shields.io/badge/version-1.0-informational.svg" />
    <img src="https://img.shields.io/badge/license-MIT-black.svg" />
  </p>
  
  <p align="center">
    ZABO with modern JS, designed and developed by SPARCS
    <br />
    <a href="https://alpha.zabo.sparcs.org">Go to ZABO</a>
  </p>
</p>

# About

ZABO helps **KAIST students based** individuals or clubs advertising themselves via web based platform not only in an analogue way. While this service is open public, **only KAIST members** are allowed to post images on this website and others must manually get permission from SPARCS KAIST's current project manager.

We're expecting anyone satisfying above conditions posting there recruiting announcements, performance schedules, and any other events in much better condition (posting paper posters at each dorms, cafeterias, E11, ...etc) with ease and joy.

Please contact SPARCS KAIST to get more detailed information.

If you're looking for frontend codes, you can find it in [here](https://github..com/sparcs-kaist/zabo-front-reactjs)

## API Specification

Document for API Speicifcation can be found [here](https://github.com/sparcs-kaist/zabo-server-nodejs/tree/develop/src/routes/README.md)


## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
    - [Running Development Server](#running-development-server)
        - [Using npm](#npm)
        - [Using yarn](#yarn)
    - [Running Production Server](#deploying-on-production-server)
        - [Using npm](#npm)
        - [Using yarn](#yarn)
- [Folder Structure](#folder-structure)
- [Deployment](#deployment)
- [Built With](#built-with)
- [Commit Message Guidelines](#commit-message-guidlines)
    - [Commit Message Format](#commit-message-format)
    - [Revert](#revert)
    - [Type](#type)
    - [Scope](#scope)
    - [Subject](#subject)
    - [Body](#body)
    - [Footer](#footer)
- [Branch Management](#branch-management)
- [Versioning](#versioning)
- [Authors](#authors)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Prerequisites

**You’ll need to have Node 8.10.0 or later on your local development and production machine**. You can use [nvm](https://github.com/creationix/nvm#installation) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows#node-version-manager-nvm-for-windows) to easily switch Node versions between different projects.

```sh
node -v // v10.16.3
```

**Redis**

We expect REDIS server to be running on it's default port(6379).

**MongoDB**

We expect MongoDB server to be running on it's default port(27017).
We expect to use *zabo-{env}* for each environment as database name.

**Environment Secrets**

List of environment variables required are specified in [here](config/.env.example)

You can find proper values for those [here](https://wiki.sparcs.org/w/index.php/Zabo_-_2019) 

In order to get a new SSO client id and secrets, refer [SPARCS SSO Dev Center](https://sparcssso.kaist.ac.kr/dev/main/)

**!important: Please be extra careful not to upload any kind of secrets on github.**

## Getting Started

### Running Development Server

```
You need Mongodb and Redis running on your local machine before running our server.
Please check *prerequisites*(#prerequisites) to find out more

```

#### npm

Run development server

```sh
npm install // Installing dependencied with node js package manager
npm run dev // Run development server with nodemon watching ./src folder
```

#### yarn

Run server

```sh
yarn // Installing dependencied with node js package manager
yarn dev // Run development server with nodemon watching ./src folder
```

### Running Production Server

#### npm

Run server

```sh
npm install // Installing dependencied with node js package manager
npm start // Run production server with NODE_ENV=production
```

#### yarn

Run server

```sh
yarn // Installing dependencied with node js package manager
yarn start // Run production server with NODE_ENV=production
```


## Folder Structure
```
zabo-server
├── README.md
├── LICENSE.md
├── node_modules
├── package.json
├── .gitignore
├── config
│   ├── .env.example
│   ├── .env.development
│   ├── .env.staging
│   ├── .env.production
│   └── env.js
├── src
│   ├── bin
│   ├── db
│   ├── routes
│   ├── utils
│   ├── controllers
│   └── app.js
└── index.js  - Entry point
```

## Deployment

All api endpoints are prefixed with */api*.  
Therefore, you can easily classify API requests out of page loading requests (toward [zabo-front-reactjs](https://github.com/sparcs-kaist/zabo-front-reactjs)).  
Example nginx configuration is located [here](https://github.com/sparcs-kaist/zabo-server-nodejs/blob/develop/nginx.conf)  
  
Currently running on   
  
[SSAL](http://ssal.sparcs.org:10001/) as development server  
[Netlify](https://alpha.zabo.sparcs.org/) for continuos integration test and PWA development  
To be deployed on https://zabo.sparcs.org/ and https://zabo.kaist.ac.kr  


## Built With

* [Express.js](https://expressjs.com/) - Used to build server.
* [SPARCS SSO](https://github.com/sparcs-kaist/sparcssso) - Using SPARCS SSO for sign-on
* [JWT](https://jwt.io) - JWT for authentication
* [AWS S3](https://aws.amazon.com/s3/?nc1=h_ls) - Amazon S3(Simple Storage Service) is an object storage service that offers nice scalability, data availability, security, and performance.
* [MongoDB](https://www.mongodb.com/) - Widely used free to use NoSQL database.
* [Redis](https://redis.io/) - In-memory data structure store.
* [Docker](https://www.docker.com/) - Containerizate software. Docker configuration should be uploaded soon

### S3

All the posters are stored in AWS S3

## Commit Message Guidelines

I referred [Google's Angular JS's contributor's commit message guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-guidelines) to format commit messages. This leads to more **unified** and **readable messages** helping further history lookups and even CI integrations.

By the way, this repository's commit messages format is not exactly same as the one suggested above.

### Commit Message Format 

Each commit message consists of a **header**, a **body** and a **footer**.  The header has a special
format that includes a **type**, a **scope** and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory and the **scope** of the header is optional.

Any line of the commit message cannot be longer 100 characters! This allows the message to be easier
to read on GitHub as well as in various git tools.

Samples: (even more [samples](https://github.com/sparcs-kaist/zabo-server-nodejs/commits/master))

```
docs(README): update README adding instruction on how to start docker on EC2
```
```
build(babel): Add babel preset-env

Add @babel/core, @babel/preset-env and register with @babel/register.
Entry point of the application is set to be bin/www_es6.js
Refer to the package.json file to fidn out more.
```

### Revert
If the commit reverts a previous commit, it should begin with `revert: `, followed by the header of the reverted commit. In the body it should say: `This reverts commit <hash>.`, where the hash is the SHA of the commit being reverted.

### Type
Should be one of the following:

* **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
* **ci**: Changes to our CI configuration files and scripts (example scopes: Circle, BrowserStack, SauceLabs)
* **docs**: Documentation only changes
* **feat**: A new feature
* **fix**: A bug fix
* **perf**: A code change that improves performance
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **test**: Adding missing tests or correcting existing tests
* **misc**: Adding miscellaneous items

### Scope
There's no specific recommendations for naming scope yet.
Feel free to write your own scopes.

### Subject
The subject contains a succinct description of the change:

* use the **imperative, present tense**: "change" not "changed" nor "changes"
* **do capitalize** the first letter
* no dot (.) at the end

### Body
Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes".
If the commit derives changes from previous behavior, the body should include the motivation for the change and contrast this with previous behavior.

### Footer
The footer should contain any information about **Breaking Changes** and is also the place to


## Branch Management

I use [git-flow](https://danielkummer.github.io/git-flow-cheatsheet/index.html) to manage branches. For branch history, see the [branches on this repository](https://github.com/sparcs-kaist/zabo-server-nodejs/branches).


## Contributing

Member of SPARCS-KAIST can freely contribute on this repository.

## Versioning

I use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/sparcs-kaist/zabo-server-nodejs/tags). 

## Authors

* **Cookie** - [Cookie](https://github.com/jungdj)
* **Loopy** - [Smartbirdisharvard](https://github.com/smartbirdisharvard)
* **Alogon** - [Kalogon](https://github.com/Kalogon)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

We're renewing following projects.

[Zabo-WEB](https://github.com/sparcs-kaist/zabo-web) and [Zabo-API](https://github.com/sparcs-kaist/zabo-api)
