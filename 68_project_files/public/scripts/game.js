const Trap = function(ctx, x, y) {

    const sequences = {
        idle:  { x: 0, y: 0, width: 2400, height: 2400, count: 1, timing: 0, loop: false }
    };

    const sprite = Sprite(ctx, x, y);

    sprite.setSequence(sequences.idle)
          .setScale(0.05)
          .setShadowScale({ x: 0, y: 0 })
          .useSheet("/photo/trap.png");

    return {
        setXY: sprite.setXY,
        draw: sprite.draw ,
        getBoundingBox: sprite.getBoundingBox
    };
};

const Health = function(ctx, x, y) {

    const sequences = {
        idle:  { x: 0, y: 16, width: 16, height: 16, count: 1, timing: 0, loop: false }
    };

    const sprite = Sprite(ctx, x, y);

    sprite.setSequence(sequences.idle)
          .setScale(3)
          .setShadowScale({ x: 0, y: 0 })
          .useSheet("/photo/object_sprites.png");

    return {
        draw: sprite.draw 
    };
};

const Healing = function(ctx, x, y) {

    const sequences = {
        idle:  { x: 0, y: 16, width: 16, height: 16, count: 8, timing: 150, loop: true }
    };

    const sprite = Sprite(ctx, x, y);

    sprite.setSequence(sequences.idle)
          .setScale(2)
          .setShadowScale({ x: 0.75 , y: 0.2 })
          .useSheet("/photo/object_sprites.png");


    const randomize = function(area) {
        /* Randomize the position */
        const {x, y} = area.randomPoint();
        sprite.setXY(x, y);
    };

    return {
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        getBoundingBox: sprite.getBoundingBox,
        randomize: randomize,
        draw: sprite.draw,
        update: sprite.update
    };
};

const Monster = function(ctx, x, y, color, gamearea) {

    const sequences = {
        red:  { x: 0, y: 282, width: 47, height: 47, count: 1, timing: 0, loop: false },  
        pink: { x: 47, y: 94, width: 47, height: 47, count: 1, timing: 0, loop: false },
        blue: { x: 94, y: 188, width: 47, height: 47, count: 1, timing: 0, loop: false },
        orange: { x: 141, y: 0, width: 47, height: 47, count: 1, timing: 0, loop: false }
    };
    //red: eyes look up
    //pink: eyes look down
    //blue: eyes look left
    //orange: eyes look right

    const sprite = Sprite(ctx, x, y);

    sprite.setSequence(sequences[color])
    .setScale(2)
    .setShadowScale({ x: 0.5, y: 0.1 })
    .useSheet("/photo/monster_sprite.png");

    let COLOR = color;
    let x_speed = 250;
    let y_speed = 100;

    const setColor = function(color) {
        sprite.setSequence(sequences[color]);
        COLOR = color;
    };

    const update = function() {
        let {x, y} = sprite.getXY();

        switch (COLOR) {
            case "red": y -= y_speed / 60;    break;
            case "pink": y += y_speed / 60;   break;
            case "blue": x -= x_speed / 60;   break;
            case "orange": x += x_speed / 60; break;
        }

        if (gamearea.isPointInBox(x, y)) {
            sprite.setXY(x, y);  
            return true;    
        }   
        else {      //monster go outside of area          
            sprite.setXY(850,0);    //put to topright, prevent collide with bullet
            return false;       
        }
    };

    const speed_cheat = function() {
        x_speed *= 1.5;
        y_speed *= 1.5;
    };

    return {
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        setColor: setColor,
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: update,
        speed_cheat: speed_cheat
    };
};


const game = (function() {
    const cv = $("canvas").get(0);
    const context = cv.getContext("2d");
    
    /* Create the sounds */
    const sounds = {
        background: new Audio("music/background.mp3"),
        collect: new Audio("music/collect.mp3"),
        gameover: new Audio("music/gameover.mp3")
    };
    const totalGameTime = 60;   // Total game time in seconds
    const gemMaxAge = 5000;     // The maximum age of the gems in milliseconds
    let gameStartTime = 0;      // The timestamp when the game starts
    let collectedGems = 0;      // The number of gems collected in the game

    /* Create the game area            top, left, bottom, right*/
    const gameArea = BoundingBox(context, 165, 60, 420, 800);
    const points = gameArea.getPoints();
    /* Create the sprites in the game */
    const player = Player(context, 427, 240, gameArea); // The player
    const gem = Gem(context, 427, 350, "green");        // The gem
    const fires =[fire(context,60,165),
        fire(context,60,420),
        fire(context,800,165),
        fire(context,800,420)];
    const bullet = Bullet(context,0,0,gameArea);

    let enable_trap = false;
    const trap = Trap(context, 0, 0);

    const healing = Healing(context, 427, 350);

    const healths = [Health(context,820,30),Health(context,780,30),Health(context,740,30)];
    const MaxHealth = 3;
    let current_hp = MaxHealth;

    const i_frame = 2000;   //player become invincible for that ms after get hurt, but still can be trapped
    let IN_iframe = false;  //player is in i_frame or not

    let enable_monster = false;
    const monster = Monster(context, 850, 0, "red", gameArea);

    let num_attacker_gems = 10;
    $("#attacker-current-gems").text(num_attacker_gems);
    let attacker_spent = 0;

    function increment_attacker_gems() {   
        Socket.update_attacker_gems(1);
        setTimeout( increment_attacker_gems , 5000 );
    }



    const initializeGame = function (currentUser) {
        console.log("current user on game:",currentUser);

        const userObject = JSON.parse(currentUser);
        if (userObject.position == "Attacker") 
            setTimeout( increment_attacker_gems , 5000 );
        
        
        /* Get the canvas and 2D context */
        
        /* The main processing of the game */
        
        function doFrame(now) {
            if (gameStartTime == 0){ 
                gameStartTime = now;
                
                const {x , y} = gameArea.randomPoint();
                const colors = ["green", "red", "yellow", "purple"];
                const color_index = Math.floor(Math.random() * 4);
                Socket.randomPutGem(colors[color_index] , x , y);

                const {x:x1 , y:y1} = gameArea.randomPoint();
                Socket.randomPutHealing(x1 , y1);

                sounds.background.play();
            }

            /* Update the time remaining */
            const gameTimeSoFar = now - gameStartTime;
            const timeRemaining = Math.ceil((totalGameTime * 1000 - gameTimeSoFar) / 1000);
            $("#time-remaining").text(timeRemaining);


            /* Handle the game over situation here */
            if(current_hp <= 0 || timeRemaining == 0){
                $("#game-over").show();

                if (current_hp <= 0)       //Attacker win
                    $("#who-win").text("Attacker Wins!!!");               
                else 
                    $("#who-win").text("Defender Wins!!!");
                
                $("#final-gems").text(collectedGems);
                $("#attacker-spent").text(attacker_spent);
                sounds.background.pause();
                sounds.gameover.play();                      
                setTimeout(function() {window.location.reload();} , 10000); 
                return;
            }

            /* Update the sprites */
            gem.update(now);
            player.update(now);
            bullet.update(now);
            for(const fire of fires){
                fire.update(now);
            }
            healing.update(now);

            if (enable_monster) {
                if ( monster.update() == false) 
                    enable_monster = false;  
            }
                
               

            // Randomize the gem and collect the gem here  & healing      
            if(gem.getAge(now) > gemMaxAge){
                const {x , y} = gameArea.randomPoint();
                const colors = ["green", "red", "yellow", "purple"];
                const color_index = Math.floor(Math.random() * 4);
                Socket.randomPutGem(colors[color_index] , x , y);

                const {x:x1 , y:y1} = gameArea.randomPoint();
                Socket.randomPutHealing(x1 , y1);
            }

            //player hit gem
            if(player.getBoundingBox().intersect(gem.getBoundingBox())) {
                const {x , y} = gameArea.randomPoint();
                const colors = ["green", "red", "yellow", "purple"];
                const color_index = Math.floor(Math.random() * 4);

                Socket.collectGem();
                Socket.randomPutGem(colors[color_index] , x , y);

                //player get 1 gem, attacker will lose 1 gem
                Socket.update_attacker_gems(-1);
            }
            

            //player hit trap
            if(player.getBoundingBox().intersect(trap.getBoundingBox()))              
                Socket.trap();

            //player hit healing item
            if(player.getBoundingBox().intersect(healing.getBoundingBox())){
                const {x, y} = gameArea.randomPoint();
                Socket.heal(x,y);
            }

            //monster hurt player
            if(player.getBoundingBox().intersect(monster.getBoundingBox())){
                Socket.playerGetHurt();
            }

            //bullet hit monster
            if(bullet.getBoundingBox().intersect(monster.getBoundingBox())){
                Socket.BulletHitMonster();
            }            

            
            /* Clear the screen */
            context.clearRect(0, 0, cv.width, cv.height);

            /* Draw the sprites */
            gem.draw();
            player.draw();
            bullet.draw();
            for(const fire of fires){
                fire.draw();
            }
            if (enable_monster)
                monster.draw();
            if (enable_trap)
                trap.draw();
            for(let i=0 ; i < current_hp ; ++i) {
                healths[i].draw();
            }
            healing.draw();
    
            /* Process the next frame */
            requestAnimationFrame(doFrame);
        }
    

        /* Handle the start of the game */
        
        /* Hide the start screen */
        $("#game-start").hide();
        console.log("current use before keydown",currentUser)

        
        /* Handle the keydown of arrow keys and spacebar */
        $(document).on("keydown", function(event) {
            /* Handle the key down 
            Left arrow key - 37
            Up arrow key - 38
            Right arrow key - 39
            Down arrow key - 40
            1 (Left), 2 (Up), 3 (Right) or 4 (Down)
            */
            
            const userobj = JSON.parse(currentUser);
            position = userobj.position;
            if(position == "Defender"){
                switch (event.keyCode) { 
                    case 32: player.shoot_request(); break; // Spacebar
                    case 37: player.move_request(1); break;
                    case 38: player.move_request(2); break;
                    case 39: player.move_request(3); break;
                    case 40: player.move_request(4); break;
                }
            }
            else if (position == "Attacker") {
                if (event.keyCode == 16) {   //Lshift - 16
                    Socket.cheat();
                    Socket.update_attacker_gems(100);
                }
            }

        });

        /* Handle the keyup of arrow keys and spacebar */
        $(document).on("keyup", function(event) {

            /* Handle the key up */
            const userobj = JSON.parse(currentUser);
            console.log("current user position:",userobj.position);
            position = userobj.position;
            if(position == "Defender"){
                console.log("send stop request");
                switch (event.keyCode) {
                    case 37: player.stop_request(1); break;
                    case 38: player.stop_request(2); break;
                    case 39: player.stop_request(3); break;
                    case 40: player.stop_request(4); break;
                }
            }            
        });

        //Defender cannot see AttackerShop
        const userobj = JSON.parse(currentUser);
        if (userobj.position == "Defender") {
            $("#attacker_shop").hide();
        }

        if (userobj.position == "Attacker") {
            $("#item1").on("click", function() {     //buy monster   
                if (num_attacker_gems >= 2) {         
                    let {x , y} = player.getXY();
                    const colors = ["red", "pink", "blue", "orange"];
                    const color_index = Math.floor(Math.random() * 4);

                    switch (color_index) {
                        case 0: y = 420; break;
                        case 1: y = 165; break;
                        case 2: x = 800; break;
                        case 3: x = 60; break;
                    }

                    Socket.create_monster(colors[color_index] , x , y);  
                    Socket.update_attacker_gems(-2);
                    Socket.spent(2);
                    
                }
            });
        }

        if (userobj.position == "Attacker") {
            $("#item2").on("click", function() {     //buy trap     
                if (num_attacker_gems >= 1) {     
                    const {x, y} = gameArea.randomPoint();
                    Socket.create_trap(x,y);  
                    Socket.update_attacker_gems(-1);
                    Socket.spent(1);
                   
                }     
            });
        }

        if (userobj.position == "Attacker" || userobj.position == "Defender") {
            $("#endpage-lobby-button").on("click", function() {                    
                Socket.backToLobby();       //everyone go back to lobby   
            });
        }
        
       

        /* Start the game */
        requestAnimationFrame(doFrame);

    };      //////////


    const move_announce = function(dir) {
        player.move(dir);
        console.log("move_annoce function called and emit move",dir);
    };

    const stop_announce = function(dir) {
        player.stop(dir);
        console.log("stop_annoce function called and emit stop",dir);
    };

    const shoot_announce = function(facing) {
        const {x:startx,y:starty} = player.getXY();
        console.log("shoot_annoce function called and emit shoot",facing);
        switch(facing){
            //1 (Left), 2 (Up), 3 (Right) or 4 (Down)
            //x: 60 ~ 800,y 165 ~ 420
            case 1: bullet.shoot(facing,startx,starty); break;
            case 2: bullet.shoot(facing,startx,starty); break;
            case 3: bullet.shoot(facing,startx,starty); break;
            case 4: bullet.shoot(facing,startx,starty); break;
        }       
    };

    const create_monster_announce = function(color,x,y) {
        enable_monster = true;
        monster.setColor(color);
        monster.setXY(x,y);       
    };

    const create_trap_announce = function(x,y) {
        enable_trap = true;
        trap.setXY(x,y);
    };

    const trap_announce = function() {      //player hit trap
        enable_trap = false;    //trap disappears after player hit it
        trap.setXY(0,0);
        player.slowDown();              //slow down for 3 seconds
        setTimeout(function() {player.speedUp();} , 3000);  
    };

    const heal_announce = function(x,y) {
        healing.setXY(x,y);
        if (current_hp < MaxHealth) 
            ++current_hp;
    };

    const playerGetHurt_announce = function() {
        if (! IN_iframe) {
            --current_hp;
            IN_iframe = true;
            setTimeout(function() {IN_iframe = false;} , i_frame); 
        }
    };

    const BulletHitMonster_announce = function() {
        monster.setXY(850,0);
        enable_monster = false;
    };

    const backToLobby_announce = function() {
        window.location.href = "index.html";
    };
    
    const collectedGem_announce = function() {
        ++collectedGems;
        sounds.collect.play();
    };

    const randomPutGem_announce = function(color,x,y) {
        gem.setColor(color);
        gem.setXY(x,y);
    };

    const randomPutHealing_announce = function(x,y) {
        healing.setXY(x,y);
    };

    const spent_announce = function(x) {
        attacker_spent += x;
    };

    const cheat_announce = function() {
        monster.speed_cheat();
    };

    const updateAttackerGems_announce = function(x) {
        if (x<0 && num_attacker_gems + x <= 0)      //plus   a negative number
            num_attacker_gems = 0;
        else
            num_attacker_gems += x; 
        
        $("#attacker-current-gems").text(num_attacker_gems);
    };

    return{ initializeGame, move_announce ,stop_announce, shoot_announce, 
            create_monster_announce, create_trap_announce,
            trap_announce, heal_announce, playerGetHurt_announce,
            BulletHitMonster_announce,backToLobby_announce,collectedGem_announce,
            randomPutGem_announce,randomPutHealing_announce,spent_announce,
            cheat_announce,updateAttackerGems_announce
        };

    })();