//regex
const namePattern = /^[A-Za-z0-9\s:,\.\s|]+$/;


//function to check the inputs 
function isValidInput(inputs) {
    
    
    let result = {
        valid:true,
    };

    for (let input of inputs) {
        
        if (input.trim() === "") {
            result.valid = false;
            result.input = input;
            return result;
        }
        if (!namePattern.test(input)) {
            result.valid = false;
            result.input = input;
            return result;
        }
    }

    return result;

};

function addressValidation(houseName,town,address,city,state,pincode) {
    let result = {
        validation:true
    }
    
    if (houseName.trim() == '' || !namePattern.test(houseName)) {
        result.validation = false;
        result.input = 'housename'
        return result
    };

    if (town.trim() == '' || !namePattern.test(town)) {
        result.validation = false;
        result.input = 'town'
        return result
    };

    if (city.trim() == '' || !namePattern.test(city)) {
        result.validation = false;
        result.input = 'city'
        return result
    };

    if (state.trim() == '' || !namePattern.test(state)) {
        result.validation = false;
        result.input = 'state'
        return result
    };

    if (!pincode.length === 0) {
        result.validation = false;
        result.input = 'pincode';
        return result
    }

    if (address.trim() == '' ) {
        result.validation = false;
        result.input = 'pincode';
        return result
    }

    return result;
}

module.exports = { isValidInput, addressValidation };