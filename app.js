const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
let database = null
const dbPath = path.join(__dirname, 'userData.db')

const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBandServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body

  const selectedUserQuery = `
            SELECT
              *
            FROM
              user
            WHERE
              username='${username}';`
  const dbUser = await database.get(selectedUserQuery)
  if (dbUser === undefined) {
    if (password.length > 5) {
      const hashedPassword = await bcrypt.hash(password, 10)
      const postSqlQuery = `
              INSERT INTO
                  user(username,name,password,gender,location)
              VALUES(
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
              );`
      await database.run(postSqlQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectedUserQuery = `
            SELECT
              *
            FROM
              user
            WHERE
              username='${username}';`
  const dbUser = await database.get(selectedUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectedUserQuery = `
              SELECT
                *
              FROM
                user
              WHERE
                username='${username}';`
  const dbUser = await database.get(selectedUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password)
    if (isPasswordMatched) {
      if (newPassword.length > 5) {
        const hashedPassword= await bcrypt.hash(newPassword,10)
        const updateSqlQuery=`
                  UPDATE
                    user
                  SET
                    password='${hashedPassword}';`
        await database.run(updateSqlQuery)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports=app;