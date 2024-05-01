const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const databasePath = path.join(__dirname, "database.db");

const app = express();

app.use(express.json());

let database = null;

// connecting with database and sever initilization...!!!
const connectWithDatabaseAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3121, () =>
      console.log("server running at http://localhost:3121/")
    );
  } catch (error) {
    console.log(`db error: ${error.message}`);
    process.exit(1);
  }
};

connectWithDatabaseAndServer();

//role-based access control...!
function authentication(request, response, next) {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
      jwtToken = authHeader.split(" ")[1];
    }
    if (jwtToken === undefined) {
      response.status(401);
      response.send("invalid jwt token");
    } else {
      jwt.verify(jwtToken, "my_secure_token", async (error, payload) => {
        if (error) {
          response.status(401);
          response.send("invalid jwt token");
        } else {
          next();
        }
      });
    }
  }
 
  // create new user if users table does not contain.....
  app.post("/Users/", async (request, response) => {
    const {id,Username, password } = request.body;
    const hashedPassword = await bcrypt.hash(request.body.password, 10);
    const selectUserQuery = `SELECT * FROM Users WHERE username = '${Username}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      const createUserQuery = `
        INSERT INTO 
          Users (id,username,password_hash) 
        VALUES 
          (
            '${id}', 
            '${Username}',
            '${hashedPassword}', 
          )`;
      const dbResponse = await db.run(createUserQuery);
      const newUserId = dbResponse.lastID;
      response.send(`Created new user with ${newUserId}`);
    } else {
      response.status = 400;
      response.send("User already exists");
    }
  });
 

  //create jwt token for authuntication if given login details are Valid...!
  app.post("/login/", async (request, response) => {
    const { username, password } = request.body;
    const selectUserQuery = `SELECT * FROM Users WHERE username = '${username}';`;
    const databaseUser = await database.get(selectUserQuery);
    if (databaseUser === undefined) {
      response.status(400);
      response.send("Invalid user");
    } else {
      const isPasswordMatched = await bcrypt.compare(
        password,
        databaseUser.password
      );
      if (isPasswordMatched === true) {
        const payload = {
          username: username,
        };
        const jwtToken = jwt.sign(payload, "my_secure_token");
        response.send({ jwtToken });
      } else {
        response.status(400);
        response.send("Invalid password");
      }
    }
  });
  

//to get all tasks from tasks table..!!!
app.get("/tasks", authentication, async (request, response) => {
    const getTasksQuery = `
      SELECT
        *
      FROM
        Tasks;`;
    const Alltasks = await database.all(getTasksQuery);
    response.send(Alltasks);
  });
//Tp get task by the id...!!!  
app.get("/tasks/:id", authentication, async (request, response) => {
    const { id } = request.params;
    const taskByIdQuery = `
      SELECT 
        *
      FROM 
        Tasks
      WHERE 
        id = ${id};`;
    const task = await database.get(taskByIdQuery);
    response.send(task);
  });
//add new task to Tasks Table
  app.post("/tasks", authentication, async (request, response) => {
    const { Title, Description, Status, assigneeId,createdAt, updatedAt } = request.body;
    const postTaskQuery = `
    INSERT INTO
      Tasks (title, description, status, assignee_id,created_at, updated_at)
    VALUES
      (${Title}, '${Description}', ${Status}, ${assigneeId}, ${createdAt}, ${updatedAt});`;
    await database.run(postTaskQuery);
    response.send("Task Successfully Added");
  });

  //Delete the task based on given id..!!!
  app.delete(
    "/tasks/:id",
    authentication,
    async (request, response) => {
      const { id } = request.params;
      const deleteTaskQuery = `
    DELETE FROM
      Tasks
    WHERE
      id = ${id} 
    `;
      await database.run(deleteTaskQuery);
      response.send("Task Removed");
    }
  );
// update the task based on given id..!!!
  app.put(
    "/tasks/:id",
    authentication,
    async (request, response) => {
      const { id } = request.params;
      const {
        Title, Description, Status, assigneeId,createdAt, updatedAt 
      } = request.body;
      const updateTaskQuery = `
    UPDATE
      Tasks
    SET
      title = '${Title}',
      description = ${Description},
      status = ${Status},
        assignee_id= ${assigneeId},
      create_id = ${createdAt}, 
      update_at = ${updatedAt}
    WHERE
      id= ${id};
    `;
      await database.run(updateTaskQuery);
      response.send("Task Details Updated");
    }
  );
  



