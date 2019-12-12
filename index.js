const express = require('express');
const app = express();

app.use(express.json());

let users = [
    {
        id: 1,
        name: 'Ratik'
    }
]

let id = 2

app.get('/users', (req, res) => {
    return res.send(users)
})

app.post('/users', (req, res) => {

    if (!req.body.name) return res.status(400).send('name field missing');

    const user = {
        id: id,
        name: req.body.name
    }
    id++

    users.push(user)

    return res.status(201).send(user)
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

const sqlite3 = require('sqlite3').verbose();

const dbArticle = new sqlite3.Database('./db/articleDB.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the Article database.');
})


app.get('/articles', (req, res) => {

    let article = []

    let sql = `SELECT * FROM article where isDeleted = 0 ORDER BY articleId DESC`


    dbArticle.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.send(rows)
    });


});

let author = 'test_ ratik'

app.post('/articles', (req, res) => {

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

})

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