const express = require("express");

const bcrypt = require("bcrypt");
const fs = require("fs");
const session = require("express-session");

// Create the Express app
const app = express();

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

// Use the session middleware to maintain sessions
const chatSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 300000 }
});
app.use(chatSession);

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

// Handle the /register endpoint
app.post("/register", (req, res) => {
    // Get the JSON data from the body
    const { username, avatar, name, password } = req.body;

    //
    // D. Reading the data/users.json file
    //
    const users = JSON.parse(fs.readFileSync("data/users.json"))
    console.log(users)
    //
    // E. Checking for the user data correctness
    //
    if(!(username && avatar && name && password)){
        res.json({ status: "error", error:"Username, avatar, name and password should not empty" });
        return;
    }
    if(!containWordCharsOnly(username)){
        res.json({ status: "error", error:"The username contains only underscores, letters or numbers" });
        return;
    }
    if(users[username]){
        res.json({ status: "error", error: "The username does exist in the current list of users"});
        return;
    }
    //
    // G. Adding the new user account
    //
    const hash = bcrypt.hashSync(password,10);
    users[username] = {avatar, name, hash};
    fs.writeFileSync("data/users.json",
        JSON.stringify(users))
    //
    // H. Saving the data/users.json file
    //

    //
    // I. Sending a success response to the browser
    //
    res.json({status:"success"});
    // Delete when appropriate
    //res.json({ status: "error", error: "This endpoint is not yet implemented." });
});

// Handle the /signin endpoint
app.post("/signin", (req, res) => {
    // Get the JSON data from the body
    const { username, password } = req.body;

    //
    // D. Reading the data/users.json file
    //
    const users = JSON.parse(fs.readFileSync("data/users.json"))
    //
    // E. Checking for username/password
    //
    if(!users[username]){
        res.json({ status: "error", error: "The username does not exist in the current list of users"});
        return;
    }
    const hashedPassword =users[username].hash ;
    if (!bcrypt.compareSync(password, hashedPassword)) {
        res.json({ status: "error", error: "password are not the same"});
        return;
    };
    //
    // G. Sending a success response with the user account
    //
    const user = {username:username,avatar:users[username].avatar , name:users[username].name};
    session.user = user;
    console.log(session.user);
    res.json({ status: "success", user: user });
    
    // Delete when appropriate
    //res.json({ status: "error", error: "This endpoint is not yet implemented.1" });
});

// Handle the /validate endpoint
app.get("/validate", (req, res) => {

    //
    // B. Getting req.session.user
    //
    req.session.user = session.user || null;
    console.log(req.session.user);
    //
    // D. Sending a success response with the user account
    //
    if(req.session.user){
        res.json({ status: "success", user: req.session.user });
        
    }else{
        res.json({ status: "error", error: "usesr have not login" });
    }
    // Delete when appropriate
    //res.json({ status: "error", error: "usesr have not login" });
});

// Handle the /signout endpoint
app.get("/signout", (req, res) => {

    //
    // Deleting req.session.user
    //
    req.session.user = null;
    //
    // Sending a success response
    //
    res.json({ status: "success"});
    // Delete when appropriate
    //res.json({ status: "error", error: "This endpoint is not yet implemented.3" });
});


//
// ***** Please insert your Lab 6 code here *****
//


// Use a web server to listen at port 8000
app.listen(8000, () => {
    console.log("The chat server has started...");
});
