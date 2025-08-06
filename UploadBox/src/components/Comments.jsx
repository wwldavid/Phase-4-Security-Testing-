import { useEffect, useState } from "react";
import { useLoggedInUserContext } from "../context/LoggedInUserContext";
import CommentComposer from "./CommentComposer";
import './Comment.css';

const Comments = () => {
    const user = useLoggedInUserContext().loggedInUser;
    const [refreshCount, setRefreshCount] = useState(0);

    const [comments, setComments] = useState([]);

    useEffect(() => {
        async function getComments() {
            try {
                const response = await fetch("http://127.0.0.1:3000/comment", {
                    headers: {
                        'Authorization': `Bearer ${user.authToken}`
                    },
                });
                if(response.ok) {
                    const data = await response.json();

                    // console.log(data);

                    setComments(data.comment_list);
                } else {
                    console.log(`Get comments response not okay`);
                }
            } catch(error) {
                console.error(`Error while getting comments`);
                console.error(error);
            }
        }

        getComments();
    }, [refreshCount, user.authToken]);

    return (
        <section id="comment-section">
            {comments.map(comment => 
                <div className="comment-container" key={comment._id}>
                    <p className="usr txt">{comment.user}</p>
                    <p className="cmt txt">{comment.text}</p>
                </div>
            )}
            <CommentComposer refresh={refreshCount} update={setRefreshCount} />
        </section>
    );
};

export default Comments;