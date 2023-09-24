// import express from 'express'
// import mysql from 'mysql'
// import cors from 'cors'
// import session from 'express-session';
// import cookieParser from 'cookie-parser';
// import bodyParser from 'body-parser';

const express = require("express");
const mysql = require("mysql");
require("dotenv").config();
const Stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const app = express();

app.use(express.static(process.env.STATIC_DIR));

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"], // allow request from the origin
    methods: ["POST", "GET"], //http post and get method
    credentials: true,
  })
);
app.use(cookieParser()); // cookie parse
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Json body parse requests
app.use(
  session({
    secret: "secret", // key used to encrypt session cookie
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24, // Cookie Expiration time:1 day
    }, //cookies propertires
  })
);

// Connection to mysql database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "task1",
});

//  route to check user authentication
app.get("/", (req, res) => {
  const token = req.cookies.token;
  if (req.session.email && req.cookies.token) {
    jwt.verify(token, "our-jsonwebtoken-secret-key", (error, decoded) => {
      if (error) {
        return res.json({ Message: "Token Authentication Error" });
      } else {
        req.id = decoded.id;
        req.fname = decoded.fname;
        req.lname = decoded.lname;
        req.password = decoded.password;
        req.status = decoded.status;
      }
    });
    return res.json({
      valid: true,
      id: req.id,
      email: req.session.email,
      fname: req.fname,
      lname: req.lname,
      password: req.password,
      status: req.status,
    });
  } else {
    return res.json({ valid: false });
  }
});

// Route for user Registration
app.post("/signup", (req, res) => {
  const sql =
    "INSERT INTO login (`fname`,`lname`,`email`,`password`) VALUES (?)";
  const values = [
    req.body.fname,
    req.body.lname,
    req.body.email,
    req.body.password,
  ];
  db.query(sql, [values], (error, result) => {
    if (error) return res.json({ Message: "Error in Server" });
    return res.json(result);
  });
});

//Route for User Login
app.post("/login", (req, res) => {
  const sql = "SELECT * FROM login WHERE email = ? and password = ?";
  db.query(sql, [req.body.email, req.body.password], (error, result) => {
    if (error) return res.json({ Message: "Error inside Server" });
    if (result.length > 0) {
      req.session.email = result[0].email;
      const id = result[0].id;
      const fname = result[0].fname;
      const lname = result[0].lname;
      const password = result[0].password;
      const status = result[0].status;
      const token = jwt.sign(
        { id,fname, lname, password,status},
        "our-jsonwebtoken-secret-key",
        { expiresIn: "1d" }
      );
      res.cookie("token", token);
      return res.json({ Login: true });
    } else {
      return res.json({ Login: false });
    }
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.clearCookie("token");
  return res.json({ Logout: true });
});

app.post("/payment", async (req, res) => {
  let { amount, id } = req.body;
  try {
    const payment = await Stripe.paymentIntents.create({
      amount,
      currency: "NPR",
      description: "STRIPE INTEGRATION",
      payment_method: id,
      confirm: true,
      return_url: "http://localhost:3000/",
    });
    console.log("Payment", payment);
    res.json({
      message: "Payment Successful",
      success: true,
    });
  } catch (error) {
    console.log("Error", error);
    res.json({
      message: "Payment Failed",
      success: false,
    });
  }
});

// Payment Element Config

app.get("/config", (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const {amountInCredits} = req.body;

    if (typeof amountInCredits !== 'number' || amountInCredits <= 0) {
      throw new Error('Invalid amountInCredits');
    }
    const amountInNPR = amountInCredits * 10;


    const paymentIntent = await Stripe.paymentIntents.create({
      currency: "NPR",
       amount: amountInNPR * 100,      //130000 * 100,
      automatic_payment_methods: { enabled: true },
    });

    // Sending publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
      purchasedCredits: amountInCredits,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});



// app.post("/verify-user", (req, res) => {
//   const { userId } = req.body;

//   // Update the user's status to 'verified' in the database
//   const updateQuery = `UPDATE login SET status = 'verified' WHERE id = ?`;

//   db.query(updateQuery, [userId], (err, result) => {
//     if (err) {
//       console.error('Error updating user status:', err);
//       res.status(500).json({ error: 'An error occurred while verifying the user' });
//     } else {
//       console.log(`User with ID ${userId} has been verified`);
//       res.json({ success: true });
//     }
//   });
// });

app.post("/verify-user", (req, res) => {
  const { userId } = req.body;

  // Check if the user's status is already 'verified'
  const checkQuery = `SELECT status FROM login WHERE id = ?`;

  db.query(checkQuery, [userId], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Error checking user status:', checkErr);
      res.status(500).json({ error: 'An error occurred while checking the user status' });
    } else {
      if (checkResult.length === 0) {
        // User not found with the given ID
        res.status(404).json({ error: 'User not found' });
      } else if (checkResult[0].status === 'verified') {
        // User's status is already 'verified', no need to update
        console.log(`User with ID ${userId} is already verified`);
        res.json({ success: true });
      } else {
        // Update the user's status to 'verified' in the database
        const updateQuery = `UPDATE login SET status = 'verified' WHERE id = ?`;

        db.query(updateQuery, [userId], (updateErr, updateResult) => {
          if (updateErr) {
            console.error('Error updating user status:', updateErr);
            res.status(500).json({ error: 'An error occurred while verifying the user' });
          } else {
            console.log(`User with ID ${userId} has been verified`);
            res.json({ success: true });
          }
        });
      }
    }
  });
});


app.post("/forgot-password-email", async (req, res) => {
  const { email } = req.body;
  // Check if the user exists in the MySQL database
  const query = "SELECT * FROM login WHERE email = ?";
  db.query(query, [email], (error, results) => {
    if (error) {
      console.error("MySQL Error:", error);
      return res.status(500).send({ Status: "Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).send({ Status: "User not existed" });
    }

    const user = results[0];

    // Generate a JWT token
    const token = jwt.sign({ id: user.id }, "jwt_secret_key", {
      expiresIn: "10m",
    });

    // Send a password reset link via email
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "xtha.swagat69@gmail.com",
        pass: "pqfkzrvsjakaijoj",
      },
    });

    var mailOptions = {
      from: "xtha.swagat69@gmail.com",
      to: user.email,
      subject: "Reset Password",
      html: `
      <!doctype html>
      <html lang="en-US">
      
      <head>
          <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
          <title>Reset Password Email Template</title>
          <meta name="description" content="Reset Password Email Template.">
          <style type="text/css">
              a:hover {text-decoration: underline !important;}
          </style>
      </head>
      
      <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
          <!--100% body table-->
          <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
              style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
              <tr>
                  <td>
                      <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                          align="center" cellpadding="0" cellspacing="0">
                          <tr>
                              <td style="height:80px;">&nbsp;</td>
                          </tr>
                          <tr>
                              <td style="text-align:center;">
                                <a href="#" title="logo" target="_blank">
                                  <img width="100" src="https://imgs.search.brave.com/5uFebATDEp_PfkpfvJP_chvLXZEBKhmmcn6pwvSehxY/rs:fit:860:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA0Lzg1LzI4LzY4/LzM2MF9GXzQ4NTI4/Njg1MV9DRFVFMW5B/N3RvSm1DYTlCMnJC/eFphVXA0bnQ0VjhV/UC5qcGc" title="logo" alt="logo">
                                </a>
                              </td>
                          </tr>
                          <tr>
                              <td style="height:20px;">&nbsp;</td>
                          </tr>
                          <tr>
                              <td>
                                  <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                      style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                      <tr>
                                          <td style="height:40px;">&nbsp;</td>
                                      </tr>
                                      <tr>
                                          <td style="padding:0 35px;">
                                              <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">You have
                                                  requested to reset your password</h1>
                                              <span
                                                  style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                              <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                  We cannot simply send you your old password. A unique link to reset your
                                                  password has been generated for you. To reset your password, click the
                                                  following link and follow the instructions.
                                              </p>
                                              <a href="http://localhost:3000/newpassword/${user.id}/${token}"
                                                  style="background:#0000FF;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset
                                                  Password</a>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td style="height:40px;">&nbsp;</td>
                                      </tr>
                                  </table>
                              </td>
                          <tr>
                              <td style="height:20px;">&nbsp;</td>
                          </tr>
                      </table>
                  </td>
              </tr>
          </table>
          <!--/100% body table-->
      </body>
      
      </html>`,
      //   text: `http://localhost:3000/newpassword/${user.id}/${token}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("Email Error:", error);
        return res.status(500).send({ Status: "Email Error" });
      } else {
        return res.send({ Status: "Success" });
      }
    });
  });
});

app.post("/newpassword/:id/:token", (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  jwt.verify(token, "jwt_secret_key", (error, decoded) => {
    if (error) {
      return res.json({ Status: "Error with token" });
    } else {
      const query = "UPDATE login SET password = ? WHERE id = ?";
      db.query(query, [password, id], (error, results) => {
        if (error) {
          console.error("MySQL Error:", error);
          return res.status(500).send({ Status: "Server Error" });
        }

        if (results.affectedRows === 1) {
          return res.send({ Status: "Success" });
        } else {
          console.error("ERROR Affected rows");
          return res.status(404).send({ Status: "User not found" });
        }
      });
    }
  });
});

app.listen(process.env.PORT || 5001, () => {
  console.log("Server Running at 5001");
});
