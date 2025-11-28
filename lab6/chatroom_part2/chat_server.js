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
    req.session.user = user;
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
    const user = req.session.user;
    console.log(user);
    //
    // D. Sending a success response with the user account
    //
    if(user){
        res.json({ status: "success", user: user });
        
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
const{createServer} = require("http");
const{Server} = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer);

io.use((socket, next) => {
    chatSession(socket.request, {}, next);
}   );

const onlineUsers = {};

io.on("connection",(socket)=>{
    if(socket.request.session.user){
        const username = socket.request.session.user.username;
        onlineUsers[username] = socket.request.session.user; // Add user to onlineUsers
        console.log("User connected:", username);
        console.log("Online users:", onlineUsers);
        io.emit("add user",JSON.stringify(socket.request.session.user));
    
    };
    socket.on("disconnect",()=>{
    if(socket.request.session.user){
        const username = socket.request.session.user.username;
        delete onlineUsers[username]; // Remove user from onlineUsers
        console.log("User disconnected:", username);
        console.log("Online users:", onlineUsers);
        io.emit("remove user",JSON.stringify(socket.request.session.user));
    }
    })
    socket.on("get users",()=>{
        if(onlineUsers){
            socket.emit("users",JSON.stringify(onlineUsers));
        }
    })
    socket.on("get messages",()=>{
        const chatroom = JSON.parse(fs.readFileSync("data/chatroom.json"));
        socket.emit("messages",JSON.stringify(chatroom));
    })
    socket.on("post message",(content)=>{
        const chatroom = JSON.parse(fs.readFileSync("data/chatroom.json"));
        const message = {
            user:socket.request.session.user,
            datetime:new Date(),
            content:content
        };
        chatroom.push(message);
        fs.writeFileSync("data/chatroom.json",JSON.stringify(chatroom));
        io.emit("add message",JSON.stringify(message));
    })
    socket.on("typing",(user)=>{
        io.emit("show_typing",user);
    })
    
})

// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("The chat server has started...");
});
