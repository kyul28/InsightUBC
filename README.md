# CPSC 310 Project Repository

InsightUBC is a full-stack web application developed as part of the Introduction to Software Engineering course at UBC. The project enables users to query metadata related to the UBC campus, such as information about past courses, averages, buildings, and rooms. The backend is built using Node.js and TypeScript, while the frontend utilizes React. This repository contains all the code and resources necessary to build and run the application.

For information about the project, autotest, and the checkpoints, see the [specifications page](https://sites.google.com/view/ubc-cpsc310-20w2-intro-to-se/project/specification?authuser=0).

Below is the EBNF grammar used in the development of this project:

QUERY ::='{'BODY ', ' OPTIONS (', ' TRANSFORMATIONS)? '}' 

BODY ::= 'WHERE:{' (FILTER)? '}'
OPTIONS ::= 'OPTIONS:{' COLUMNS (', ' SORT)? '}'
TRANSFORMATIONS ::= 'TRANSFORMATIONS: {' GROUP ', ' APPLY '}' 

FILTER ::= LOGICCOMPARISON | MCOMPARISON | SCOMPARISON | NEGATION
LOGICCOMPARISON ::= LOGIC ':[{' FILTER ('}, {' FILTER )* '}]'  
MCOMPARISON ::= MCOMPARATOR ':{' mkey ':' number '}'  
SCOMPARISON ::= 'IS:{' skey ':' [*]? inputstring [*]? '}'  // Asterisks should act as wildcards. Optional.
NEGATION ::= 'NOT :{' FILTER '}'
LOGIC ::= 'AND' | 'OR'
MCOMPARATOR ::= 'LT' | 'GT' | 'EQ' 

COLUMNS ::= 'COLUMNS:[' ANYKEY (',' ANYKEY)* ']'
SORT ::= 'ORDER: ' ('{ dir:'  DIRECTION ', keys: [ ' ANYKEY (',' ANYKEY)* ']}') | ANYKEY
DIRECTION ::= 'UP' | 'DOWN'  
ANYKEY ::= key | applykey 

GROUP ::= 'GROUP: [' (key ',')* key ']'                                                          
APPLY ::= 'APPLY: [' (APPLYRULE (', ' APPLYRULE )* )? ']'  
APPLYRULE ::= '{' applykey ': {' APPLYTOKEN ':' key '}}'
APPLYTOKEN ::= 'MAX' | 'MIN' | 'AVG' | 'COUNT' | 'SUM' 

key ::= mkey | skey
mkey ::= idstring '_' mfield
skey ::= idstring '_' sfield
mfield ::= 'avg' | 'pass' | 'fail' | 'audit' | 'year' | 'lat' | 'lon' | 'seats' 
sfield ::=  'dept' | 'id' | 'instructor' | 'title' | 'uuid' |    'fullname' | 'shortname' | 'number' | 
           'name' | 'address' | 'type' | 'furniture' | 'href'  
idstring ::= [^_]+ // One or more of any character, except underscore.
inputstring ::= [^*]* // zero or more of any character except asterisk.
applykey ::= [^_]+ // one or more of any character except underscore.

- WHERE defines which sections should be included in the results.
- COLUMNS defines which keys should be included in each result.
- ORDER defines what order the results should be in




## Configuring your environment

To start using this project, you need to get your computer configured so you can build and execute the code.
To do this, follow these steps; the specifics of each step (especially the first two) will vary based on which operating system your computer has:

1. [Install git](https://git-scm.com/downloads) (v2.X). After installing you should be able to execute `git --version` on the command line.

1. [Install Node LTS](https://nodejs.org/en/download/) (v14.15.X), which will also install NPM (you should be able to execute `node --version` and `npm --version` on the command line).

1. [Install Yarn](https://yarnpkg.com/en/docs/install) (v1.22+). You should be able to execute `yarn --version` afterwards.

1. Clone your repository by running `git clone REPO_URL` from the command line. You can get the REPO_URL by clicking on the green button on your project repository page on GitHub. Note that due to new department changes you can no longer access private git resources using https and a username and password. You will need to use either [an access token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) or [SSH](https://help.github.com/en/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account).

## Project commands

Once your environment is configured you need to further prepare the project's tooling and dependencies.
In the project folder:

1. `yarn install` to download the packages specified in your project's *package.json* to the *node_modules* directory.

1. `yarn build` to compile your project. You must run this command after making changes to your TypeScript files.

1. `yarn test` to run the test suite.

1. `yarn pretty` to prettify your project code.

## Running and testing from an IDE

IntelliJ Ultimate should be automatically configured the first time you open the project (IntelliJ Ultimate is a free download through their students program)
