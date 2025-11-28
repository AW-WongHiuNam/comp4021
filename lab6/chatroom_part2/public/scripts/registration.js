const Registration = (function() {
    // This function sends a register request to the server
    // * `username`  - The username for the sign-in
    // * `avatar`    - The avatar of the user
    // * `name`      - The name of the user
    // * `password`  - The password of the user
    // * `onSuccess` - This is a callback function to be called when the
    //                 request is successful in this form `onSuccess()`
    // * `onError`   - This is a callback function to be called when the
    //                 request fails in this form `onError(error)`
    const register = function(username, avatar, name, password, onSuccess, onError) {

        //
        // A. Preparing the user data
        //
        JSON.stringify({"username":username,"avatar":avatar,"name":name,"password":password})
        //
        // B. Sending the AJAX request to the server
        //
        fetch("/register",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({"username":username,"avatar":avatar,"name":name,"password":password})
        })
        .then((res)=>res.json())
        .then((json)=>{
            console.log("Successful!");
            console.log(json);
            if(json.status == "error"){ 
                console.log("run error");
                onError(json.error);
            }
            else if (json.status == "success"){
                console.log("run onsuccess");
                onSuccess();
            }
            console.log("nth run");
        })
        .catch((err)=>{
            console.log("Error!");
        });
        
        //
        // F. Processing any error returned by the server
        //

        //
        // J. Handling the success response from the server
        //
 
        // Delete when appropriate
        //if (onError) onError("This function is not yet implemented.");
    };

    return { register };
})();
