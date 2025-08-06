import { useState } from "react";
import { useLoggedInUserContext } from "../context/LoggedInUserContext";

const CommentComposer = ({refresh, update}) => {
    const [iptxt, setInTxt] = useState('');

    const user = useLoggedInUserContext().loggedInUser;
    // console.log(`user is ${user.name}`);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const jsonBody = JSON.stringify({
                username: user.username,
                commenttxt: iptxt
            });

            // console.log(jsonBody);

            const response = await fetch("http://127.0.0.1:3000/comment", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.authToken}`,
                    'Content-Type': 'application/json',
                },
                body: jsonBody,
            });

            if(response.ok) {
                // const data = await response.json();
                // console.log(data);
                update(refresh+1);
                setInTxt('');
            } else {
                console.log(`Comment Post response not okay`);
            }
        } catch(error) {
            console.error("Error while posting comment");
            console.error(error);
        }
    }
    return (
        <div id="composer-div">
            <form>
                <textarea
                id="composer"
                name="composer-ele"
                maxLength={500}
                rows={5}
                value={iptxt}
                placeholder="Enter your comment"
                onChange={(event) => {
                    setInTxt(event.target.value);
                }}
                ></textarea>

                <input className="btn" type="submit" value="Post" onClick={handleSubmit} />
            </form>

           
        </div>
    );
}

export default CommentComposer