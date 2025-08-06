import { createContext, useContext, useState } from "react";
import { default_user } from "../model/user.js";

const LoggedInUserContext = createContext(null);

// custome hook to use context
export const useLoggedInUserContext = () => {
    const context = useContext(LoggedInUserContext);

    if(context === 'undefined') {
        throw new Error('useLoggedInUserContext must be used within LoggedInUserProvider');
    }

    return context;
}

const LoggedInUserProvider = ({children}) => {
    const [user, setUser] = useState(default_user);
    const [loading, setLoading] = useState(false);

    async function Login(username, password) {

        // alert(`Implement Login: ${username}:${password}`);

        setLoading(true);

        const loginInfo = {
            "username": username,
            "password": password,
        };

        const jsonBody = JSON.stringify(loginInfo);

        const response = await fetch("http://127.0.0.1:3000/user/login", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Tell the server the body is JSON.
            },
            body: jsonBody,
        })
        if(response.ok) {
            const data = await response.json();
            console.log(`login okay:`);
            console.log(data);
            const user = {
                username: data.username,
                authToken: data.authToken,
                name: data.name,
                role: data.role,
                department: data.department
            }
            console.log("Login Successful");
            setUser(user);
            setLoading(false);
        } else {
            console.log(`Login Response Not Okay!!`);
            setUser(default_user);
            setLoading(false);
        }
    }

    function Logout() {
        setUser(default_user);
    }

    const loggedInUserContext = {
        loggedInUser: user,
        loginFunc: Login,
        logoutFunc: Logout,
        loading: loading,
    };

    return (
    <LoggedInUserContext.Provider value={loggedInUserContext}>
      {children}
    </LoggedInUserContext.Provider>
  );
}

export default LoggedInUserProvider;