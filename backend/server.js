const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = 5000;
app.listen(port, () => {
  console.log("Connected to port", port);
});
mongoose
  .connect(
    "mongodb+srv://muzzicr7:muzzicr7@kfc.utohoyn.mongodb.net/?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((error) => {
    console.log(error.message);
  });
app.post("/api/contact", (req, res) => {
  const { name,phone, email, message } = req.body;

console.log( req.body.name)

  const transporter = nodemailer.createTransport({
    service: "Gmail", 
    auth: {
      user: "muzzitts56@gmail.com",
      pass: "mzhinqcztxsthcql",
    },
  });
  const mailOptions = {
    from: "muzzitts56@gmail.com",
    to: "muzammiltts56@gmail.com", 
    subject: "Contact Form Submission",
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    } else {
      console.log(`Email sent: ${info.response}`);
      res.status(200).json({ message: "Form submission successful" });
    }
  });
});




