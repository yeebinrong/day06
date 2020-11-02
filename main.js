// load libraries
const express = require('express')
const handlebars = require('express-handlebars')
const mysql = require('mysql2/promise')

// declare variables
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000
const SQL_FIND_BY_NAME = 'SELECT * FROM apps WHERE name LIKE ? LIMIT ? OFFSET ?'

// create instance of express
const app = express()

// configure handlebars
app.engine('hbs',
    handlebars({
        defaultLayout: 'template.hbs'
    })
)
app.set('view engine', 'hbs')

// Create database connection pool
const pool = mysql.createPool({
    host: process.env.SQL_HOST || 'localhost',
    port: parseInt(process.env.SQL_PORT || 3306),
    database: process.env.SQL_DB || 'playstore',
    user: process.env.SQL_USER,
    password: process.env.SQL_PASS,
    connectionLimit: parseInt(process.env.SQL_CONNECTION_LIMIT) || 4,
    timezone: '+08:00'
})

// Function to initalise the application
const startApp = async (app, pool) => {
    try {
        // Get a connection from the connection pool
        const conn = await pool.getConnection()
        console.info('Pinging database...')
        await conn.ping()

        // release connection
        conn.release()

        // listen for port
        app.listen(PORT, () => {
            console.info(`Application is listening on ${PORT} at ${new Date ()}`)
        })
    } catch (e) {
        console.error('Cannot ping database: ', e)
    }
}

// load resources
app.use(express.static(`${__dirname}/static`))

// ## GET routes ##

app.get('/search', 
    async (req, resp) => {
        const q = req.query.q
        const limit = 10
        let page = parseInt(req.query.page) || 2
        let offset = 0
        let conn;
        console.info("the value of submit is: ", req.query.s)
        if (page == 1)
            firstpage = 0
        else
            firstpage = 1

        if (req.query.s == "previous")
        {
            page -= 1   
            offset = (page - 1) * limit
        }
        else if (req.query.s == "next")
        {
            page += 1
            offset = page * limit - 10
        }
        console.info("offest is 1", offset)
        console.info("page is 1: ", page)
        try {
            conn = await pool.getConnection()
            const results = await conn.query(SQL_FIND_BY_NAME, [`%${q}%`, limit, offset])
            const data = results[0]
            console.info("sending page: ", page)
            resp.status(200)
            resp.type('text/html')
            resp.render('home',
                {
                    title : 'Search results',
                    q,
                    searching : 1, // set state TRUE
                    data,
                    page,
                    firstpage
                }
            )
        } 
        catch (e) {
            console.error('Error retrieving database: ', e)
        } 
        finally {
            // release connection
            await conn.release()
        }
    }
)

app.get('/', (req, resp) => {
    resp.status(200)
    resp.type('text/html')
    resp.render('home',
        {
            title : 'Search for an app.',
            searching: 0, // set state FALSE
        }
    )
})

// ## REDIRECT routes ##
app.use((req, resp) => {
    resp.redirect('/')
})

// Initalise application
startApp(app, pool)