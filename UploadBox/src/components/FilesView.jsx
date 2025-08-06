import { useEffect, useState } from "react";
import { useLoggedInUserContext } from "../context/LoggedInUserContext";
import './FileView.css'

const FilesView = ({uploadCount}) => {

    console.log(`uploadcount: ${uploadCount}`)
    const [files, setFiles] = useState([]);
    const loggedInUserContext = useLoggedInUserContext();
    const user = loggedInUserContext.loggedInUser;

    useEffect(() => {
        async function getFiles() {
            try {
                const response = await fetch("http://127.0.0.1:3000/file", {
                    headers: {
                        'Authorization': `Bearer ${user.authToken}`
                    },
                });

                if(response.ok) {
                    const data = await response.json();
                    console.log(data);
                    setFiles(data.files_data);
                    
                }
            } catch(error) {
                console.error("Error while getting list of files");
                console.error(error);
            }
        }
        getFiles();
    }, [uploadCount, user.authToken]);

    return (
        <section>
            <h3 className="txt">Files</h3>
            <div className="list">
                <table>
                    <thead>
                        <tr>
                            <th className="txt">File Name</th>
                            <th className="txt">Uploaded By</th>
                            <th className="txt">Department</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map((file) => {
                            return (
                                <tr className="list-item" key={file._id}>
                                    <td className="txt">{file.filename}</td>
                                    <td className="txt">{file.uploadedBy}</td>
                                    <td className="txt">{file.department}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                
            </div>
        </section>
    );
}

export default FilesView;