
//function to check the inputs 
function isValidInput(inputs) {
    
    const namePattern = /^[A-Za-z0-9\s:,\.\s]+$/;

    for (let input of inputs) {
        
        if (input.trim() === "") {
            console.log(input)
            return false;
        }
        if (!namePattern.test(input)) {
            console.log(input)
            return false;
        }
    }

    return true;

}

module.exports = isValidInput