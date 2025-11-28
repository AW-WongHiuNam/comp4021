const Bullet = function (ctx, x, y,gameArea) {
    let sequence =    {
        Left:  { x: 48, y: 112, width: 16, height: 16, count: 1, timing: 50, loop: true },
        Up:    { x: 0, y: 112, width: 16, height: 16, count: 1, timing: 50, loop: true },
        Right: { x: 16, y: 112, width: 16, height: 16, count: 1, timing: 50, loop: true },
        Down:  { x: 32, y: 112, width: 16, height: 16, count: 1, timing: 50, loop: true }
    }
    
    // This is the sprite object of the gem created from the Sprite module.
    const sprite = Sprite(ctx, x, y);
    
    sprite.setSequence(sequence.Down)
    .setScale(2)
    .setShadowScale({ x: 0.75, y: 0.2 })
    .useSheet("/photo/object_sprites.png");

    // The sprite object is configured for the player sprite here.
    let Facing = 0;
    let Direction = 0;
    let Playerx = 0;
    let Playery= 0;
    let Animation_request = false;
    let animating = false;
    // This is the moving direction, which can be a number from 0 to 4:
    // - `0` - not moving
    // - `1` - moving to the left
    // - `2` - moving up
    // - `3` - moving to the right
    // - `4` - moving down
    const shoot = function(dir,playerx,playery) {
        if (dir >= 1 && dir <= 4 && animating == false) {
            Direction = dir;
            Facing =dir;
            Playerx = playerx;
            Playery = playery;
            Animation_request = true;
            console.log("data shoot",Direction,Facing,Playerx,Playery);
            switch (Facing) {
                case 1: sprite.setSequence(sequence.Left); break;
                case 2: sprite.setSequence(sequence.Up); break;
                case 3: sprite.setSequence(sequence.Right); break;
                case 4: sprite.setSequence(sequence.Down); break;
            }
        }
    };
    
    // This function sets the player's moving direction.
    // - `dir` - the moving direction (1: Left, 2: Up, 3: Right, 4: Down)

    // This function updates the player depending on his movement.
    // - `time` - The timestamp when this function is called
    const update = function(time) {
        /* Update the player if the player is moving */
        if (Facing != 0 ) {
            let { x: currentx, y: currenty } = sprite.getXY();
            console.log("currentx,currenty",currentx,currenty,x,y);
            console.log("data shoot",Facing,Playerx,Playery);
            if(currentx == 0 && currenty == 0 && Animation_request == true){
                x = Playerx;
                y = Playery;
                console.log("set x ",x,";y ",y);
            }
            /* Move the player */
            speed = 250;
            switch (Facing) {
                case 1: x -= speed / 60; break;
                case 2: y -= speed / 60; break;
                case 3: x += speed / 60; break;
                case 4: y += speed / 60; break;
            }
            console.log("bullet x,y",x,y);
            console.log("gameArea.isPointInBox(x, y)",gameArea.isPointInBox(x, y));
            /* Set the new position if it is within the game area */
            if (gameArea.isPointInBox(x, y)){
                animating = true;
                sprite.setXY(x, y);
                console.log("bullet setXY",x,y);
            }else{
                sprite.setXY(0,0);
                animating = false;
                Animation_request = false;
                console.log("bullet setXY 0,0",sprite.getXY());
            }
        
        }
        /* Update the sprite object */
        sprite.update(time);
        
    };



    return {
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        shoot:shoot,
        update: update
    };
};