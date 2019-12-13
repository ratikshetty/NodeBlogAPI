const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');

app.use(express.json());

// Users Api

const sqlite3 = require('sqlite3').verbose();

const dbUser = new sqlite3.Database('./db/userDB.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the User database.');
})


app.get('/user', (req, res) => {

    let username = req.headers.username
    let password = req.headers.password
    let dbPassword
    
    let sql = `select * from user 
                where name=? and isDeleted=0`;

    dbUser.all(sql, [username], (err, rows) =>{
        if(err){
            res.send(err)
        }
        else{
            user = rows[0]
            if(user.password === password){
                jwt.sign({user}, 'ratikssh', (err, token) =>{
                    if(err){
                        return res.send(err)
                    }
                    else{
                        return res.status(200).json({token})
                    }
                })
            }
            else{
                return res.status(401).send('Invalid credentials')
            }

        }
    })

    
})

app.post('/users', (req, res) => {

    if (!req.body.username) return res.status(400).send('username field missing');
    if (!req.body.password) return res.status(400).send('password field missing');
    if (!req.body.email) return res.status(400).send('email field missing');

    sql = `insert into user (emailid, name, password, createdDate, modifiedDate) 
    values (?,?,?,?,?)`

    let curDate = new Date()

    dbUser.run(sql, [req.body.email,req.body.username, req.body.password, curDate.toString(), curDate.toString()], (err)=>{
        if(err){
             return res.send(err)
        }
        else{
            return res.status(201)
        }
    })

    
})

app.put('/users/:id', (req, res) => {

    let user = users.find(ele => {
        return ele.id === parseInt(req.params.id)
    })

    if (!user) return res.status(400).send('No such user Id available!!');

    if (!req.body.name) return res.status(400).send('name field missing');

    user.name = req.body.name

    return res.status(200).send(user)

})

app.delete('/users/:id', (req, res) => {

    let user = users.find((ele) => {
        return ele.id === parseInt(req.params.id)
    })

    if (!user) return res.status(400).send('No such user Id available!!');

    let index = users.indexOf(user)

    console.log(index)

    users.splice(index, 1)

    return res.status(200).send(user)
})

// Article API's

const dbArticle = new sqlite3.Database('./db/articleDB.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the Article database.');
})


app.get('/articles', (req, res) => {

    let sql = `SELECT * FROM article where isDeleted = 0 ORDER BY articleId DESC`


    dbArticle.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.send(rows)
    });


});

let author = 'test_ ratik'

app.post('/articles', verify, (req, res) => {

    jwt.verify(req.token, 'ratikssh', (err, authData)=>{

        if(err){
            return res.sendStatus(403)
        }
        else{

            if(!req.body.content){
                return res.status(400).send('Article content is missing')
            }
        
            if(!req.body.title){
                return res.status(400).send('Article Title is missing')
            }
        
            let curDate = new Date()
        
            let sql = `insert into article (content, title, author, url, createdDate, modifiedDate) values (?,?,?,?,?,?)`
        
            dbArticle.run(sql, [req.body.content, req.body.title, author, 'test/url', curDate.toString(), curDate.toString()], (err) => {
                if(err){
                    console.log(err);
                    return res.status(400).send(err)
                }
            })
        
            return res.status(201).send('created')

        }
    })

    

})

function verify(req, res, next){

    let auth = req.headers.authorization

    if(!auth){
        return res.sendStatus(401)
    }
    auth = auth.split(' ')
    let token = auth[1]
    console.log(token)

    req.token = token
    next()
}

app.put('/articles', (req, res) => {

    if(!req.body.content){
        return res.status(400).send('Article content is missing')
    }

    if(!req.body.title){
        return res.status(400).send('Article Title is missing')
    }

    let curDate = new Date()

    let sql = `UPDATE article
    set content = ?,
    modifiedDate = ?,
    author = ?
    where title = ?  COLLATE NOCASE`

    dbArticle.run(sql, [req.body.content, curDate.toString(), author, req.body.title], err => {
        if(err){
            return res.status(400).send(err)
        }


    })

    return res.status(200).send('record updated')
})

app.delete('/articles', (req, res) => {

    if(!req.body.title){
        return res.status(400).send('Article Title is missing')
    }

    let sql = `update article 
                set isDeleted = 1
                where title = ? COLLATE NOCASE`

    dbArticle.run(sql, [req.body.title], err => {
        if(err){
            return res.status(400).send(err)
        }
    })

    return res.status(200).send('deleted')
})

// Comments API's

const dbComment = new sqlite3.Database('./db/commentsDB.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the Comments database.');
})

app.get('/comments/:title', (req, res) => {

    if(!req.params.title){
        res.status(400).send('Title missing!!!')
    }

    let sql = `SELECT comment, author, commentId FROM comments 
                where isDeleted = 0 
                and ArticleTitle = ? COLLATE NOCASE`

                dbComment.all(sql, [req.params.title.replace('%20', ' ')], (err, rows) => {
                    if (err) {
                        throw err;
                    }
                    res.send(rows)
                });
})

app.post('/comments', (req, res) => {

    if(!req.body.title){
        res.status(400).send('Title missing!!!')
    }

    if(!req.body.comment){
        res.status(400).send('Comment missing!!!')
    }

    let sql = `select articleId from article
                 where isDeleted = 0 and title = ? COLLATE NOCASE
    `


    dbArticle.all(sql, [req.body.title.replace('%20', ' ')], (err, rows) => {
        if (err) {
            throw err;
        }
        
        if(!rows){
            res.status(400).send('No such article found')
        }

    });

    let curDate = new Date()

    sql = `insert into comments (articleTitle, comment, author, createdDate)
        values (?, ?,  ?, ?)`

    dbComment.run(sql, [req.body.title, req.body.comment, author, curDate.toString()], err => {

        if(err){
            res.status(400).send(err)
        }

    })

    res.status(201).send('comment added!!!')

    

})

app.delete('/comments', (req, res) => {

    if(!req.body.id){
        res.status(400).send('Id is missing from request!!!')
    }

    let sql  = `update comments
    set isDeleted = 1
    where isDeleted = 0 and commentId = ? `

    dbComment.run(sql, [req.body.id], err => {
        if(err){
            return res.status(400).send(err)
        }
    })

    return res.status(200).send(`Comment Deleted!!!`)
})


// Tags API's

const dbTag = new sqlite3.Database('./db/tagsDB.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the Tags database.');
})

app.post('/tags', (req, res) => {

    if(!req.body.tag){
        return res.status(400).send('Tags missing!!!')
    }

    if(!req.body.article_title){
        return res.status(400).send('Article Title missing!!!')
    }

    let sql = `select articleId from article
                 where isDeleted = 0 and title = ? COLLATE NOCASE
    `


    dbArticle.all(sql, [req.body.article_title], (err, rows) => {
        if (err) {
            console.log(err)
        }
        
        if(!rows){
            res.status(400).send('No such article found')
        }

    });

    let curDate = new Date()

    sql = `insert into tags (articleTitle, tag, author, createdDate) 
            values (?, ?, ?, ?)`

    if(req.body.tag.includes(',')){
        let tags = req.body.tag.split(',');
    
        
        for(let ele of tags){

            dbTag.run(sql, [req.body.article_title, ele, author, curDate.toString()], (err) => {

                if(err){
                    
                    console.log(err)
        
                }
                
            
            })
        }
        return res.send('')
    }
    else{
        dbTag.run(sql, [req.body.article_title, req.body.tag, author, curDate.toString()], err => {

            if(err){
                return res.status(400).send(err)
            }
            return res.status(201).send('Tag created')
        })
        
    }

    

})

app.get('/tags/:title', (req, res) => {

    let sql = `select tag from tags where isDeleted = 0 and articleTitle = ?`

    dbTag.all(sql, [req.params.title.replace('%20', ' ')], (err, rows) => {

        if(err){
            res.status(400).send(err)
        }

        return res.status(200).send(rows)
    })
})


app.listen(3000);