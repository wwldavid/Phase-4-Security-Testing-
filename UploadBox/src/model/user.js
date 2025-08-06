class User {
    constructor(name, username, authToken, role, department) {
        this.name = name;
        this.username = username;
        this.authToken = authToken;
        this.role = role;
        this.department = department;
    }
}

export const default_user = {
    name: '',
    username: '',
    authToke: '',
    role: '',
    department: '',
}

export function isDefaultUser(user) {
    if(user == default_user)
        return true;
    return false;
}

export async function registerNewUser(newUser,callback) {
    try {
        const jsonBody = JSON.stringify(newUser);
        console.log(jsonBody);
        const response = await fetch("http://127.0.0.1:3000/user/register", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: jsonBody,
        });

        if(response.ok) {
            const data = await response.json();
            // console.log(data);
            callback(data);
        }
    } catch(error) {
        console.error(error);
        callback(null);
    }
}