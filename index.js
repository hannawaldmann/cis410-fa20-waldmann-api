const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const db = require('./dbConnectExec.js');
const config = require('./config.js')
const auth = require("./middleware/authenticate")

// const { response } = require('express');
// const dbConnectExec = require('./dbConnectExec.js');

//azurewebsites.net, colostate.edu
const app = express();
app.use(express.json());
app.use(cors());

app.get('/customer/me', auth, (req,res)=>{
    res.send(req.customer)
})

//if a user wants to edit their reviews
app.patch("/orderr/:pk", auth, async(req,res)=>{
    let reviewPK = req.params.pk
    //make sure that the user can only edit their own reviews!
})

app.post('/customer/logout', auth, (req,res) => {
    var query = `UPDATE Customer
    SET Token = NULL 
    WHERE CustomerPK = ${req.contact.CustomerPK}`

    db.executeQuery(query)
    .then(()=>{res.status(200).send()})
    .catch((error)=>{console.log("error in POST /customer/logout", error)
    res.status(500).send()
})
})

app.post("/customer/login", async (req, res)=>{
    //  console.log(req.body)
    
    var email= req.body.email;
    var password = req.body.password;
    
    if(!email || !password){
        return res.status(400).send('bad request')
    }
    
    //1. check that user email exists in db
    var query = `SELECT *
    FROM Customer
    WHERE Email = '${email}'`
    
    //var result = await db.executeQuery(query);
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
    console.log(user)
    
    if(!bcrypt.compareSync(password, user.Password)){
        console.log("invalid password");
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
            firstName: user.FirstName,
            lastName: user.LastName,
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
        //res.send("creating user")
        console.log("request body", req.body)
    
        var firstName = req.body.FirstName;
        var lastName = req.body.LastName;
        var email = req.body.email;
        var password = req.body.password;
    
        if(!firstName || !lastName || !email || !password){
            return res.status(400).send("bad request")
        }
    
        firstName = firstName.replace("'", "''")
        lastName = lastName.replace("'", "''")
    
        var emailCheckQuery = `SELECT email
        FROM Customer
        WHERE email ='${email}'`
    
        var existingUser = await db.executeQuery(emailCheckQuery)
    
        console.log("existing user", existingUser)
    
        if(existingUser[0]){
            return res.status(409).send("Please enter a different email.")
        }
    
        var hashedPassword = bcrypt.hashSync(password)
        var insertQuery = `INSERT INTO Customer(FirstName, LastName, email, password)
        VALUES('${firstName}', '${lastName}', '${email}', '${hashedPassword}')`
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
    LEFT JOIN Orderr 
    ON Product.ProductSKU = Orderr.ProductSKU`)
    .then((result)=>{
        res.status(200).send(result)
    })
    .catch((err)=>{
        console.log(err);
        res.status(500).send()
    })
})

app.post("/orderr", auth, async (req,res)=>{

    try{
    var orderPK = req.body.OrderPK;
    var customerFK = req.body.CustomerFK;
    var productSKU = req.body.ProductSKU;
    var quantity = req.body.Quantity;

    if(!orderPK || !productSKU || !quantity){res.status(400).send("bad request")}


    console.log("here is the contact in /orderr", req.customer)
    // res.send("here is your response")

    let insertQuery = `INSERT INTO Orderr(OrderPK, CustomerFK, ProductSKU, Quantity)
    OUTPUT inserted.OrderPK, inserted.CustomerFK, inserted.ProductSKU, inserted.Quantity
    VALUES(${req.Customer.customerPK}, ${productSKU}, ${quantity})`

    let insertedReview = await db.executeQuery(insertQuery)
// console.log(insertedReview)
    res.status(201).send(insertedReview[0])
}

    catch(error){
        console.log("error in POST /review", error)
        res.status(500).send()
    }
})


app.get("/products/:SKU", (req,res)=>{
    var SKU = req.params.SKU
    console.log("my SKU:" + SKU)

    var myQuery = `SELECT *
    FROM Product
    LEFT JOIN Orderr
    ON Product.ProductSKU = Orderr.ProductSKU
    WHERE ProductSKU = ${SKU}`

    console.log(myQuery)

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
app.listen(PORT, ()=>{console.log(`app is running on port ${PORT}`)})
