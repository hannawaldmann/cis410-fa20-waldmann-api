const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const db = require('./dbConnectExec.js');
const auth = require(("./middleware/authenticate"))

const { response } = require('express');
const dbConnectExec = require('./dbConnectExec.js');

//azurewebsites.net, colostate.edu
const app = express();
app.use(express.json());
app.use(cors());

app.get('/customer/me', auth, (req,res)=>{
    res.send(req.customer)

    var email = req.body.email;
    var password = req.body.password;

    if(!email || !password){res.status(400).send("bad request")}

    res.send("response")
})

app.post("/customer/login", async (req, res)=>{
    // console.log(req.body)
    
    var email= req.body.email;
    var password = req.body.password;
    
    if(!email || !password){
        return res.status(400).send('bad request')
    }
    
    //1. check that user email exists in db
    var query = `SELECT *
    FROM Customer
    WHERE Email = '${email}'`
    
    // var result = await db.executeQuery(query);
    let result;
    
    try{
        result = await db.executeQuery(query);
    }catch(myError){
        console.log('error in /customer/login:', myError);
        return res.status(500).send()
    }
    
    // console.log(result)
    
    if(!result[0]){return res.status(400).send('invalid user credentials')}
    
    //2. check that their password matches
    
    let user = result[0]
    // console.log(user)
    
    if(!bcrypt.compareSync(password, user.Password)){
        console.log("invalid password")
        return res.status(400).send("Invalid user credentials")
    }
    
    //3. generate a token
    
    let token = jwt.sign({pk: user.CustomerPK}, config.JWT, {expiresIn: '60 minutes'})
    // console.log(token)
    
    //4. save token in db and send token and user info back to user
    let setTokenQuery = `UPDATE Customer
    SET Token = '${token}'
    WHERE CustomerPK = ${user.CustomerPK}`
    
    try{
    await db.executeQuery(setTokenQuery)
    
    res.status(200).send({
        token: token, 
        user: {
            nameFirst: user.NameFirst,
            nameLast: user.NameLast,
            email: user.Email,
            customerPK: user.CustomerPK
        }
    })
    }
    catch(myError){
        console.log("Error setting user token ", myError);
        res.status(500).send()
    }
    
    })
    
    app.post("/customer", async(req,res)=>{
        // res.send("creating user")
        console.log("request body", req.body)
    
        var nameFirst = req.body.nameFirst;
        var nameLast = req.body.nameLast;
        var email = req.body.email;
        var password = req.body.password;
    
        if(!nameFirst || !nameLast || !email || !password){
            return res.status(400).send("bad request")
        }
    
        nameFirst = nameFirst.replace("'", "''")
        nameLast = nameLast.replace("'", "''")
    
        var emailCheckQuery = `SELECT email
        FROM customer
        WHERE email ='${email}'`
    
        var existingUser = await db.executeQuery(emailCheckQuery)
    
        // console.log("existing user", existingUser)
    
        if(existingUser[0]){
            return res.status(409).send("Please enter a different email.")
        }
    
        var hashedPassword = bcrypt.hashSync(password)
        var insertQuery = `INSERT INTO customer(NameFirst, NameLast, email, password)
        VALUES('${nameFirst}', '${nameLast}', '${email}', '${hashedPassword}')`
        db.executeQuery(insertQuery)
        .then(()=>{res.status(201).send()})
        .catch((err)=>{
            console.log("error in POST /customer", err)
            res.status(500).send()
        })
    })

//http://localhost:5000/products
app.get("/products", (req,res)=>{
    //get data from database
    db.executeQuery(`SELECT *
         FROM Product
         LEFT JOIN Order 
         ON Product.ProductSKU = Order.ProductSKU`)
    .then((result)=>{
        res.status(200).send(result)
    })
    .catch((err)=>{
        console.log(err);
        res.status(500).send()
    })
})

app.get("/products/SKU", (req,res)=>{
    var SKU = req.params.SKU
    // console.log("my SKU:" + pk)

    var myQuery = `SELECT *
    FROM Product
    LEFT JOIN Order
    ON Product.ProductSKU = Order.ProductSKU
    WHERE ProductSKU = ${SKU}`

    db.executeQuery(myQuery)
    .then((products)=>{
        // console.log("Products: " + products)
        if(products[0]){
            res.send(products[0])
        }else{
            res.status(404).send('bad request')
        }
    })
    .catch((err)=>{
        console.log("Error in /products/sku",err)
        res.status(500).send()
    })
})

const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{console.log(`app is running on port ${PORT}`)})

