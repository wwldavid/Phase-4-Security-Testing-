import { useLoggedInUserContext } from '../context/LoggedInUserContext';
import { useNavigate } from "react-router-dom";
import './Navbar.css';
import { Link } from "react-router-dom"
import { isDefaultUser } from '../model/user.js';

const Navbar = () => {

    const loggedInUserContext = useLoggedInUserContext();

    // console.log(loggedInUserContext);

    const navigate = useNavigate();

    return(
        <header>
            <div id="brand-name">
                <h1>Upload Box</h1>
            </div>
            <nav>
            <ul className="menuList">
                <li className='menu-item'>
                    <Link to='/'>Home</Link>
                </li>
                <li className='menu-item'>
                    {
                        isDefaultUser(loggedInUserContext.loggedInUser)
                        ? 
                        <Link to='/login'>Login</Link>
                        :
                        <p onClick={() => {
                            loggedInUserContext.logoutFunc();
                            navigate('/');
                        }}>Logout</p>
                    }
                    
                    
                </li>
                {/* <li className='menu-item'>
                    <Link to='/register'>Register</Link>
                </li> */}
            </ul>
        </nav>
        </header>
    );
}

export default Navbar;