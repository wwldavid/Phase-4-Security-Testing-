import { isDefaultUser } from "../model/user.js";
import { useLoggedInUserContext } from "../context/LoggedInUserContext";
import { useState } from "react";
import './Home.css';
import FilesView from "./FilesView.jsx";
import Comments from "./Comments.jsx";

const Home = () => {

    const [refreshFiles, setRefreshFiles] = useState(0);

    const [fileStatus, setFileStatus] = useState('NONE');

    const [selectedFile, setSelectedFile] = useState(null);

    const loggedInUserContext = useLoggedInUserContext();

    const user = loggedInUserContext.loggedInUser;

    // console.log(user);

    // function fileUploaded() {
    //     setUploadCount(uploadCount+1)
    // }
    return (
        <>
            <h1 className="title">Welcome to Upload Box. !</h1>
            <h3 className="title">Easy way to upload and retrieve files</h3>
            {
                isDefaultUser(user)?
                defaultView()
                :
                loggedInView(user, fileStatus, setFileStatus, selectedFile, setSelectedFile, refreshFiles, setRefreshFiles)
            }
        </>
    );
}

function defaultView() {
    return (
        <section id="default-view-section">
            <p className="txt">Please login to upload files</p>
        </section>
    );
}

function loggedInView(user, fileStatus, setFileStatus, selectedFile, setSelectedFile, uploadCount, setUploadCount) {

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
        if (file) {
            setFileStatus(`${file.name}`);
        } else {
            setFileStatus('NONE');
        }
    };
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        if(selectedFile == null) {
            alert("Please select a file to upload!");
            return;
        }
        console.log("uploading file")

        const formData = new FormData();

        formData.append('file', selectedFile);

        try {
            const response = await fetch("http://127.0.0.1:3000/file/", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.authToken}`
                },
                body: formData,
            })

            if(response.ok) {
                // const data = await response.json();
                // console.log(data);
                alert("File Uploaded!");
                setSelectedFile(null);
                setFileStatus("NONE");
                setUploadCount(Math.random()*1000);

            }
        } catch(error) {
            console.error(error);
        }
    }

    return (
        <>
        <section id="file-upload-section">
            <p className="txt"><span className="label">User</span>{user.name}</p>
            <p className="txt"><span className="label">Department</span>{user.department}</p>
            <p className="txt"><span className="label">Role</span>{user.role}</p>

            <form id="file-upload-form">
                <div id="fileinput-div">
                    <input 
                    type="file" 
                    name="file-upload" 
                    id="file-input" 
                    onChange={handleFileChange}
                    />

                    {fileStatus && <p className="txt status-msg"><span className="label">File selected: </span>{fileStatus}</p>}
                </div>

                <input className="btn" type="submit" value="Upload" onClick={handleSubmit} />
            </form>
        </section>
        <FilesView uploadCount={uploadCount}/>
        <Comments />
        </>
        

    );
}

export default Home;