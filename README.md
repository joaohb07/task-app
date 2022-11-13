# Stack-app

A Stack App using Node.js with mongodb.

## App API endpoints

### End-point: Create User

#### Method: POST

>
>```
>localhost:3000/users
>```
>
#### Body (**raw**)

```json
{
    "name": "Name",
    "password": "name$$$",
    "email": "name@email.com"
}
```

### End-point: Create Task

#### Method: POST

>
>```
>localhost:3000/tasks
>```
>

#### Body (**raw**)

```json
{
    "description": "Task that will be"
}
```

### End-point: Read Users

#### Method: GET
>
>```
>localhost:3000/users
>```

### End-point: Read User By Id

#### Method: GET

>
>```
>localhost:3000/users/:id
>```

### End-point: Read Tasks

#### Method: GET

>
>```
>localhost:3000/tasks
>```

### End-point: Read Task By Id

#### Method: GET
>
>```
>localhost:3000/tasks/:id
>```

### End-point: Update User

#### Method: PATCH
>
>```
>localhost:3000/users/:id
>```
>
#### Body (**raw**)

```json
{
    "name": "<new name>",
    "email": "<new email>",
    "age": "<new age>"
}
```

### End-point: Update Task

#### Method: PATCH

>
>```
>localhost:3000/tasks/:id
>```
>
#### Body (**raw**)

```json
{
    "description": "<new task description>",
    "completed": false
}
```

### End-point: Delete User

#### Method: DELETE

>
>```
>localhost:3000/users/:id
>```

### End-point: Delete Task

#### Method: DELETE

>
>```
>localhost:3000/tasks/:id
>```
