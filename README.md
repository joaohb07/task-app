<p align="center">
    <img src="./public/img/icon.png" height="75">
    <h1 align="center" style="font-family: monospace, monospace;"><b>Task App</b></h1>
</p>

<p align="center">
  <a href="https://github.com/joaohb07/task-app/actions/workflows/heroku-deploy.yml">
    <img alt="Actions Workflow" src="https://github.com/joaohb07/task-app/actions/workflows/heroku-deploy.yml/badge.svg"/>
  </a>
  <a>
    <img alt="Heroku" src="https://pyheroku-badge.herokuapp.com/?app=botelho-web-task-app&style=plastic" />
  </a>

</p>

> A Task manager App using Node.js with mongoDB for database.

---

## Live Preview

Check this [app](https://botelho-web-task-app.herokuapp.com/) live preview on heroku.

## Technologies

Technologies I used to develop this App.

|Technologies|Purpose|
|---|---|
|[***Node.js***](https://nodejs.org/)|App BackEnd.|
|[***MongoDB***](https://www.mongodb.com/)|Local DataBase set.|
|[***MongoDB Atlas***](https://www.mongodb.com/atlas/database)|Multicloud DataBase remote set, to link with Heroku deployment.|
|[***Heroku***](heroku.com)|Deploy App.|
|[***Express***](https://expressjs.com/)|Create Web Server.|
|[***Mongoose***](https://mongoosejs.com/)|Execute DB Operations.|
|[***sendgrid/mail for SendGrid API***](https://sendgrid.com/solutions/email-api/)|For sending emails to user (only sends when creating an user or deleting an user).|
|[***BCryptJS***](https://www.npmjs.com/package/bcryptjs)|For hashing and authenticating user password.|
|[***JSONWebToken***](https://www.npmjs.com/package/jsonwebtoken)|For generating user session authentication token.|
|[***Validator***](https://www.npmjs.com/package/validator)|For validating user emails.|
|[***Multer***](https://www.npmjs.com/package/multer)|Upload files via API Endpoints. In this case, user avatar icon image.|
|[***Sharp***](https://www.npmjs.com/package/sharp)|Convert large images to smaller formats.|
|[***Env-cmd***](https://www.npmjs.com/package/env-cmd)|Deal with environment variables.|
|[***Nodemon***](https://www.npmjs.com/package/nodemon)|Restart local server, for local development only.|
|[***hbs***](https://www.npmjs.com/package/hbs)|To use with Express to generate dinamic HTML views. Shorthand for handlebars.js.|

## Local Development

> BackEnd only

### Installation

This app is built in [***Node.js***](https://nodejs.org/en/) and uses [***MongoDB***](https://www.mongodb.com/try/download/community) for local development, make sure you have both installed and set before you begin this process. I suggest you also download [***MongoDB Compass***](https://www.mongodb.com/try/download/shell) to get a UI view from your local database.

To install dependencies to run this code locally, follow these steps:

1. Clone `backend` branch from this repo:

    ```bash
    git clone <repo-url>
    cd task-app
    ```

2. Create an environment file `env.env` in `task-app` root folder, with the following variables:

    ```bash
    PORT=3000
    SEND_EMAIL_API_KEY=""
    JWT_SECRET=''
    MONGODB_URL_DB="mongodb://127.0.0.1:27017/task-manager-api"
    ```

    - `Port` is `3000` by default;
    - Get [***SendGridAPI key***](https://sendgrid.com/solutions/email-api/);
    - Set up your own `JWT_SECRET`, it will be used for hashing and comparing hashed passwords. E.g.: `'batman'`;
    - Mongo db url is `mongodb://localhost:27017/task-manager-api`, `27017` is MongoDB standard port for local DB set, followed by `/task-manager-api` which is the DB name, you can alter if you want to.

3. Use npm package to install dependencies:

    ```bash
    npm install # or, npm i
    ```

### Usage

To run the app locally, follow these steps:

1. After you define your Mongo DB path and Mongo DB databases folder, run this command to start your DB:

    ```bash
    sudo /path/to/mongodb/folder/bin/mongod --dbpath=/path/to/mongodb/database/folder
    ```

2. Run one of the following commands to execute the code:

    - Standard run:

        ```bash
        npm run start
        ```

    - Run with `nodemon` **(recommended)**:

        ```bash
        npm run dev
        ```

3. Check the following section to know how to make and test requests to App Endpoints.

## App API endpoints

To test this app Rest API in local development environment, you can download [***postman***](https://www.postman.com/) and import the collection from `postman-collection.json` file of `backend` branch.

You need also to create a [***postman environment***](https://learning.postman.com/docs/sending-requests/managing-environments/#creating-environments) with the following variables:

- ***`url`:*** `localhost:3000`, port set in `.env` file.
- ***`auth`:*** leave empty, this will be filled when you login or create a user.

### End-point: Create User

This request aims to Create an user, it does the following:

> - receives name, email, password and age;
> - creates an user in DB;
> - generates an authentication token (JSONWebToken).

#### Create User Method: POST
>
>`{{url}}/users`
>

#### Create User Body (**raw**)

```json
{
    "name": "<your-name>",
    "password": "<your-password>",
    "email": "<your-email>",
    "age": "<your-age>"
}
```

#### 🔑 Create User Authentication: noauth

|Param|value|Type|
|---|---|---|

### End-point: Login User

This request aims to Login an user, it does the following:

> - authenticates by email and password;
> - generates an authentication token (JSONWebToken).
>
#### Login Method: POST
>
>`{{url}}/users/login`
>
#### Login Body (**raw**)

```json
{
    "email": "<your-email>",
    "password": "<your-password>"
}
```

#### 🔑 Login Authentication: noauth

|Param|value|Type|
|---|---|---|

### End-point: Logout User

This request aims to Logout the current authenticated user, it does the following:

> - authenticates by user by id, coming from the current authentication token;
> - deletes the current authentication token (JSONWebToken).

#### Logout Method: POST

>
>`{{url}}/users/logout`
>

### End-point: Logout All User

This request aims to Logout the current user from all sessions, it does the following:

> - authenticates by user id, coming from the current authentication token;
> - deletes all authentication tokens from this user (JSONWebToken).
>
#### Logout All Method: POST

>
>`{{url}}/users/logoutAll`
>

### End-point: Create Task

This request aims to Create an task, it does the following:

> - authenticates the current user;
> - receives description and completed(saves `false` by default if not set) values;
> - creates and save task in DB, with the user ID.
>
#### Create Task Method: POST

>
>`{{url}}/tasks`
>

#### Create Task Body (**raw**)

```json
{
    "description": "<task-description>",
    "completed": "false"
}
```

#### Create Task Headers

|Content-Type|Value|
|---|---|
|Authorization|Bearer |

### End-point: Read User Profile

This request aims to fetch the current authenticated user data, it returns the following:

>authenticated user data (except sensitive information, such as: avatar, password and auth token(s)).

#### Read User Method: GET
>
>`{{url}}/users/me`
>

#### Read User Headers

|Content-Type|Value|
|---|---|
|Authorization|Bearer |

### End-point: Read User By Id

This request aims to fetch user data by user id, it returns the following;

>user data  by id (except sensitive information, such as: avatar, password and auth token(s)).

#### Read User Id Method: GET
>
>`{{url}}/users/:id`
>

### End-point: Read Tasks

This request aims to fetch all tasks from the current authenticated user. It can also be filtered by `completed` value.

#### Read Tasks Method: GET
>
>`{{url}}/tasks`
>
#### Read Tasks Query Params

|Param|value|
|---|---|
|limit|3|
|skip|0|
|completed|false:asc|

### End-point: Read Task By Id

This request aims to fetch user tasks by task id.

#### Read Task Id Method: GET
>
>`{{url}}/tasks/:id`
>

### End-point: Update User

This request aims to Update the current authenticated user, it does the following:

> - receives name, email, password and age (all optional);
> - updates the current authenticated user in DB.
>
#### Update User Method: PATCH
>
>`{{url}}/users/me`
>
#### Update User Body (**raw**)

```json
{
    "name": "<update-user-name>",
    "email":"<update-user-name>" ,
    "password": "<update-user-password>",
    "age": "<update-user-age>"
}
```

### End-point: Update Task

This request aims to Update the current authenticated user task by id, it does the following:

> - receives description and completed (all optional), also task id;
> - updates the task of the current authenticated user in DB.
>
#### Update Task Method: PATCH
>
>`{{url}}/tasks/:id`
>
#### Update Task Body (**raw**)

```json
{
    "description": "<new task description>",
    "completed": "false"
}
```

### End-point: Delete User

This request aims to delete the current authenticated user, it returns the following:

>authenticated user deleted data (except for sensitive information, such as: avatar, password and auth token(s)).

#### Delete User Method: DELETE
>
>`{{url}}/users/me`
>

### End-point: Delete Task

This request aims to delete a task by task id, it returns the following:

>deleted task data.

#### Delete Task Method: DELETE
>
>`{{url}}/tasks/:id`
>

### End-point: Upload User Avatar

This request aims to upload current authenticated user avatar image icon, it only accepts `.jpeg`, `.jpg` and `.png` file extensions, also file size limit is up to 1 MB. It saves the file binary data into DB.

#### Upload Avatar Method: POST
>
>{{url}}/users/me/avatar
>
#### Upload Avatar Body Form Data

|Param|value|Type|
|---|---|---|
|avatar|`<uploaded-file>`|file|

### End-point: Delete User Avatar

This request aims to delete current authenticated user avatar icon image.

#### Delete Avatar Method: DELETE
>
>`{{url}}/users/me/avatar`
>

### End-point: Get User Avatar

This request aims to fetch current authenticated user avatar image icon.

#### Get Avatar Method: GET
>
>`{{url}}/users/me/avatar`
>

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.
