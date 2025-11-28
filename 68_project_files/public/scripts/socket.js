const Socket = (function() {
    // This stores the current Socket.IO socket
    let socket = null;

    // This function gets the socket from the module
    const getSocket = function() {
        return socket;
    };

    // This function connects the server and initializes the socket
    const connect = function() {
        socket = io();

        // Wait for the socket to connect successfully
        socket.on("connect", () => {
            // Get the online user list
            socket.emit("get users");

            // Get the chatroom messages
            socket.emit("get messages");
        });

        // Set up the users event
        socket.on("users", (onlineUsers) => {
            onlineUsers = JSON.parse(onlineUsers);

            // Show the online users
            if(typeof OnlineUsersPanel !== "undefined"){
                OnlineUsersPanel.update(onlineUsers);
            }
           
        });

        // Set up the add user event
        socket.on("add user", (user) => {
            user = JSON.parse(user);

            // Add the online user
            if(typeof OnlineUsersPanel !== "undefined"){
                OnlineUsersPanel.addUser(user);
            }
        });

        // Set up the remove user event
        socket.on("remove user", (user) => {
            user = JSON.parse(user);

            // Remove the online user
            if(typeof OnlineUsersPanel !== "undefined"){
                OnlineUsersPanel.removeUser(user);
            }
            
        });

        // Set up the messages event
        socket.on("messages", (chatroom) => {
            chatroom = JSON.parse(chatroom);

            // Show the chatroom messages
            if(typeof ChatPanel !== "undefined"){
            ChatPanel.update(chatroom);
            }
        });

        // Set up the add message event
        socket.on("add message", (message) => {
            message = JSON.parse(message);

            // Add the message to the chatroom
            if(typeof ChatPanel !== "undefined"){
            ChatPanel.addMessage(message);
            }
        });
        socket.on("show_typing", (user) => {
            ChatPanel.typing(user);
        });
        socket.on("change to defender", (user,onlineUsers) => {
            if (typeof user === "string") {
                user = JSON.parse(user); // Parse only if it's a string
            }
            if(onlineUsers){ 
                OnlineUsersPanel.setusertodefender(user);
                OnlineUsersPanel.update(JSON.parse(onlineUsers));
            } else{
                OnlineUsersPanel.setusertodefender(user);
            }
            
        });
        socket.on("change to attacker", (user,onlineUsers) => {
            if (typeof user === "string") {
                user = JSON.parse(user); // Parse only if it's a string
            }
            if(onlineUsers && (typeof OnlineUsersPanel !== "undefined")) {
                OnlineUsersPanel.setusertoattacker(user);
                OnlineUsersPanel.update(JSON.parse(onlineUsers));
            }else{
                OnlineUsersPanel.setusertoattacker(user);
            }
           
        });
        socket.on("change to spectator", (user,onlineUsers) => {
            if (typeof user === "string") {
                user = JSON.parse(user); // Parse only if it's a string
            }
            if(onlineUsers && (typeof OnlineUsersPanel !== "undefined")){
                OnlineUsersPanel.setusertospectator(user);
                OnlineUsersPanel.update(JSON.parse(onlineUsers));
            }else{
                OnlineUsersPanel.setusertospectator(user);
            }
            
        });
        socket.on("post user", (user) => {
            console.log("User reconnected:", user.username);
            io.emit("reconnect user", JSON.stringify(user));
        });
        socket.on("user data", (users) => {
            OnlineUsersPanel.userdata(users);
        });

        socket.on("move", (dir) => {
            game.move_announce(dir);

        });
        socket.on("stop", (dir) => {
            game.stop_announce(dir);
        });
        socket.on("startgame", () => {
            console.log("startgame event received");
            OnlineUsersPanel.startgame();

        });
        socket.on("user reconnected", (username) => {
            console.log(`User reconnected: ${username}`);
            // Perform any UI updates or actions needed for the reconnected user
        });
        socket.on("shoot", (dir) => {
            game.shoot_announce(dir);
        });
        socket.on("all browsers create trap", (x,y) => {
            game.create_trap_announce(x,y);
        });
        socket.on("player hit trap", () => {
            game.trap_announce();
        });
        socket.on("heal player", (x,y) => {
            game.heal_announce(x,y);
        });
        socket.on("all browsers create monster", (color,x,y) => {
            game.create_monster_announce(color,x,y);
        });
        socket.on("player get hurt", () => {
            game.playerGetHurt_announce();
        });
        socket.on("bullet hit monster", () => {
            game.BulletHitMonster_announce();
        });
        socket.on("back to lobby", () => {
            game.backToLobby_announce();
        });
        socket.on("player collected gem", () => {
            game.collectedGem_announce();
        });
        socket.on("random put gem", (color,x,y) => {
            game.randomPutGem_announce(color,x,y);
        });
        socket.on("random put healing", (x,y) => {
            game.randomPutHealing_announce(x,y);
        });
        socket.on("attacker spent", (x) => {
            game.spent_announce(x);
        });
        socket.on("cheating", () => {
            game.cheat_announce();
        });
        socket.on("update attacker gems", (x) => {
            game.updateAttackerGems_announce(x);
        });
        

    };      //////////////////


    // This function disconnects the socket from the server
    const disconnect = function() {
        socket.disconnect();
        socket = null;
    };

    // This function sends a post message event to the server
    const postMessage = function(content) {
        if (socket && socket.connected) {
            socket.emit("post message", content);
        }
    };

    const typing = function(user) {
        if (socket && user) {
            socket.emit("typing", user);
        }
    };
    const changetodefender = function(user) {
        
        if (socket && user) {
            socket.emit("change to defender", user);
        }
    }
    const changetoattacker = function(user) {
        
        if (socket && user) {
            socket.emit("change to attacker", user);
        }
    }
    const changetospectator = function(user) {
        
        if (socket && user) {
            socket.emit("change to spectator", user);
        }
    }
    const startgame = function() {
        console.log("startgame function called and emit start game");
        socket.emit("startgame");
    };
    const reconnectUser = function (user) {
        if (socket) {
            socket.emit("reconnect user", user); // Notify the server about the reconnection
        }
    };
    const move = function(dir) {
        if (socket && dir >= 1 && dir <= 4 ) {
            socket.emit("move", dir);
            console.log("move function called and emit move");
        }
    };
    const stop = function(dir){
        if (socket ) { 
            socket.emit("stop", dir);
            console.log("stop function called and emit stop");
        }
    };
    const requestUsers = function() {
        return new Promise((resolve, reject) => {
            if (socket) {
                // Emit the request to the server
                socket.emit("request users");
    
                // Listen for the "users" event from the server
                socket.once("user data", (onlineUsers) => {
                    try {
                        const Users = onlineUsers;
                        resolve(Users); // Resolve the Promise with the user data
                    } catch (error) {
                        reject("Failed to parse user data: " + error.message); // Reject if parsing fails
                    }
                });
    
                // Optional: Add a timeout to reject the Promise if no response is received
                setTimeout(() => {
                    reject("Request for users timed out.");
                }, 5000); // 5 seconds timeout
            } else {
                reject("Socket is not connected.");
            }
        });
    };
    const shoot = function(dir) {
        if (socket) {
            socket.emit("shoot",dir);
        }
    };
    const create_trap = function(x,y) {
        if (socket) socket.emit("create trap",x,y);       
    };      
    const trap = function() {
        if (socket) socket.emit("trap");       
    };    
    const heal = function(x,y) {
        if (socket) socket.emit("heal",x,y);
    };   
    const create_monster = function(color,x,y) {
        if (socket) socket.emit("create monster",color,x,y);
    };   
    const playerGetHurt = function() {
        if (socket) socket.emit("playerGetHurt");  
    };
    const BulletHitMonster = function() {
        if (socket) socket.emit("BulletHitMonster"); 
    };
    const backToLobby = function() {
        if (socket) socket.emit("backToLobby"); 
    };
    const collectGem = function() {
        if (socket) socket.emit("collectGem"); 
    };
    const randomPutGem = function(color,x,y) {
        if (socket) socket.emit("randomPutGem",color,x,y); 
    };
    const randomPutHealing = function(x,y) {
        if (socket) socket.emit("randomPutHealing",x,y); 
    };
    const spent = function(x) {
        if (socket) socket.emit("spent",x); 
    };
    const cheat = function() {
        if (socket) socket.emit("cheat"); 
    };   
    const update_attacker_gems = function(x) {
        if (socket) socket.emit("update_attacker_gems",x); 
    };     

    
    return { getSocket, 
        connect, 
        disconnect, 
        postMessage,
        typing,
        changetodefender, changetoattacker,changetospectator ,
        startgame,reconnectUser,requestUsers,
        move,stop,shoot,create_trap,trap,heal,create_monster,playerGetHurt,
        BulletHitMonster,backToLobby,collectGem,randomPutGem,randomPutHealing,
        spent,cheat,update_attacker_gems
       
        };
})();
