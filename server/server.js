// import express from 'express'
// import mysql from 'mysql'
// import cors from 'cors'
// import session from 'express-session';
// import cookieParser from 'cookie-parser';
// import bodyParser from 'body-parser';

const express = require('express')
const mysql = require('mysql')
require("dotenv").config()
const Stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const bodyParser = require("body-parser")
const cors = require("cors")
const session = require('express-session')
const cookieParser = require('cookie-parser')
const jwt = require("jsonwebtoken")
const { resolve } = require("path");



const app = express();

app.use(express.static(process.env.STATIC_DIR));

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000'], // allow request from the origin
    methods: ["POST", "GET"], //http post and get method
    credentials: true
}));
app.use(cookieParser()); // cookie parse
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json()); // Json body parse requests
app.use(session({
    secret: 'secret', // key used to encrypt session cookie
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 // Cookie Expiration time:1 day
    }  //cookies propertires
}))

// Connection to mysql database
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "task1"
})

//  route to check user authentication
app.get('/', (req, res) => {
    const token = req.cookies.token;
    if(req.session.email && req.cookies.token) {
        jwt.verify(token,"our-jsonwebtoken-secret-key", (error, decoded) => {
            if (error) {
                return res.json({Message: "Token Authentication Error"})
            }else {
                req.fname = decoded.fname;
                req.lname = decoded.lname;
                req.password = decoded.password;
            }
        })
        return res.json({valid: true, email:req.session.email, fname: req.fname, lname:req.lname, password:req.password})
    } else {
        return res.json({valid: false})
    }
})


// Route for user Registration
app.post('/signup', (req, res) => {
    const sql = "INSERT INTO login (`fname`,`lname`,`email`,`password`) VALUES (?)";
    const values = [
        req.body.fname,
        req.body.lname,
        req.body.email,
        req.body.password
    ]
    db.query(sql, [values], (error, result) => {
        if(error) return res.json({Message: "Error in Server"});
        return res.json(result);
    })
})


//Route for User Login
app.post('/login', (req, res) => {
    const sql = "SELECT * FROM login WHERE email = ? and password = ?";
    db.query(sql, [req.body.email, req.body.password], (error, result) => {
        if(error) return res.json({Message: "Error inside Server"});
        if(result.length > 0) {
            req.session.email = result[0].email;
            const fname = result[0].fname;
            const lname = result[0].lname;
            const password = result[0].password;
            const token = jwt.sign({fname,lname, password}, "our-jsonwebtoken-secret-key", {expiresIn: '1d'})
            res.cookie('token',token);
            return res.json({Login: true})
        } else {
            return res.json({Login: false})
        }
    })
})

app.get('/logout',(req, res) => {
    req.session.destroy();
    res.clearCookie('token');
    return res.json({Logout: true})
})

 
app.post("/payment", async (req, res) => {
    let {amount, id} = req.body
    try {
        const payment = await Stripe.paymentIntents.create({
            amount,
            currency: "NPR",
            description: "STRIPE INTEGRATION",
            payment_method: id,
            confirm: true,
            return_url: "http://localhost:3000/"
        })
        console.log("Payment", payment)
        res.json({
            message: "Payment Successful",
            success: true
        })
    } catch (error) {
        console.log("Error", error)
        res.json({
            message: "Payment Failed",
            success: false
        })
    }
})



// Payment Element Config

app.get("/config", (req, res) => {
    res.json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    })
})


app.post("/create-payment-intent", async (req, res) => {
    try {
      const paymentIntent = await Stripe.paymentIntents.create({
        currency: "NPR",
        amount: 130000*100,
        automatic_payment_methods: { enabled: true },
      });
  
      // Sending publishable key and PaymentIntent details to client
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (e) {
      return res.status(400).send({
        error: {
          message: e.message,
        },
      });
    }
  }); 


app.listen(process.env.PORT || 5001, () => {
    console.log("Server Running at 5001")
})