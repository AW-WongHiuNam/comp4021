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
    const { username,position,avatar, name, password } = req.body;

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
    users[username] = {avatar,position, name, hash};
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
    const user = {username:username,position:users[username].position,avatar:users[username].avatar , name:users[username].name};
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
    // Deleting req.session.userz
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
const { on } = require("events");
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
    socket.on("reconnect user", (user) => {
        // Add or update the user in the onlineUsers object
        onlineUsers[user.username] = user;
        console.log("User reconnected:", user.username);
        console.log("Online users of reconnected:", onlineUsers);
    });

    socket.on("disconnect",()=>{
    if(socket.request.session.user){
        const username = socket.request.session.user.username;
        delete onlineUsers[username]; // Remove user from onlineUsers
        console.log("User disconnected:", username);
        console.log("Online users:", onlineUsers);
        io.emit("remove user",JSON.stringify(socket.request.session.user));
    }
    });
    socket.on("get users",()=>{
        if(onlineUsers){
            socket.emit("users",JSON.stringify(onlineUsers));
        }
    });
    socket.on("get messages",()=>{
        const chatroom = JSON.parse(fs.readFileSync("data/chatroom.json"));
        socket.emit("messages",JSON.stringify(chatroom));
    });
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
    });
    socket.on("typing",(user)=>{
        io.emit("show_typing",user);
    });
    socket.on("change to defender",(user)=>{
        const User = onlineUsers;
        let have_Defender = false;
        if(User[user.username]){
        for (const username in User) {
            console.log("userpos:", User[username].position); // Log the position of each user
            if (User[username].position === "Defender") {
                have_Defender = true;
                break;
            }
        }
        if(!have_Defender) {
            User[user.username].position = "Defender";
            console.log(User);

            

            const datausers = JSON.parse(fs.readFileSync("data/users.json"))
            datausers[user.username].position = "Defender";
            fs.writeFileSync("data/users.json",
            JSON.stringify(datausers))

            io.emit("change to defender",user,JSON.stringify(onlineUsers));
        }
    }
    });
    socket.on("change to attacker",(user)=>{
        const User = onlineUsers;
        let have_Attacker = false;
        if(User[user.username]){
            for (const username in User) {
            console.log("userpos:", User[username].position); // Log the position of each user
            if (User[username].position === "Attacker") {
                have_Attacker = true;
                break;
            }
        }
        if(!have_Attacker) {
            User[user.username].position = "Attacker";
            console.log(User);
            const datausers = JSON.parse(fs.readFileSync("data/users.json"))
            datausers[user.username].position = "Attacker";
            fs.writeFileSync("data/users.json",
            JSON.stringify(datausers))
            io.emit("change to attacker",user,JSON.stringify(onlineUsers));
        }
    }
    });
    socket.on("change to spectator",(user)=>{
        const User = onlineUsers;
        if(User[user.username]){
            console.log("user data:", User[user.username]); // Log the position of each user
            User[user.username].position = "Spectator";
            console.log(User);
            const datausers = JSON.parse(fs.readFileSync("data/users.json"))
            datausers[user.username].position = "Spectator";
    
            fs.writeFileSync("data/users.json",
            JSON.stringify(datausers))
            io.emit("change to spectator",user,JSON.stringify(onlineUsers));
        }
    });
    socket.on("reconnect user", (user) => {
        // Add or update the user in the onlineUsers object
        onlineUsers[user.username] = user;
        console.log("User reconnected:", user.username);

        // Optionally, notify other clients about the reconnection
        io.emit("user reconnected", user.username);
    });
    socket.on("startgame",()=>{
        io.emit("startgame");
        console.log("startgame event emitted");
    });
    socket.on("request users", () => {
        console.log("Requested users received"); // Log the requested user
        const users = onlineUsers;
        
        console.log("Requested users:", users); // Log the requested user
        if (users) {
            socket.emit("user data", users);
        } 
    });


    socket.on("move",(dir)=>{

        console.log("move event emitted");
        io.emit("move",dir); 
        
    });
    socket.on("stop",(dir)=>{
    
        console.log("stop event emitted");
        io.emit("stop",dir); 
    
    });
    socket.on("shoot",(dir)=>{       
            console.log("shoot event emitted");
            io.emit("shoot",dir);        
    });
    socket.on("trap" , () => {
        io.emit("player hit trap");   
    });
    socket.on("create trap" , (x,y) => {
        io.emit("all browsers create trap",x,y);   
    });
    socket.on("heal" , (x,y) => {
        io.emit("heal player",x,y);   
    });
    socket.on("create monster" , (color,x,y) => {
        io.emit("all browsers create monster",color,x,y);   
    });
    socket.on("playerGetHurt" , () => {
        io.emit("player get hurt");   
    });   
    socket.on("BulletHitMonster" , () => {
        io.emit("bullet hit monster");   
    });  
    socket.on("backToLobby" , () => {
        io.emit("back to lobby");   
    });  
    socket.on("collectGem" , () => {
        io.emit("player collected gem");   
    });  
    socket.on("randomPutGem" , (color,x,y) => {
        io.emit("random put gem",color,x,y);   
    }); 
    socket.on("randomPutHealing" , (x,y) => {
        io.emit("random put healing",x,y);   
    }); 
    socket.on("spent" , (x) => {
        io.emit("attacker spent",x);   
    });
    socket.on("cheat" , () => {
        io.emit("cheating");   
    });   
    socket.on("update_attacker_gems" , (x) => {
        io.emit("update attacker gems",x);   
    });
 
   
})

// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("The chat server has started...");
});
