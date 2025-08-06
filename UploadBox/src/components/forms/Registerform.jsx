import { useState } from 'react';
import './Form.css';
import { registerNewUser } from '../../model/user';
import { useNavigate } from 'react-router';


const Register = () => {

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password1, setPassword1] = useState('')
    const [password2, setPassword2] = useState('')
    const [dept, setDept] = useState('1');
    const [role, setRole] = useState('1');

    const navigate = useNavigate();

    function handleDeptChange(event) {
        setDept(event.target.value);
    }

    function handleRoleChange(event) {
        setRole(event.target.value);
    }

    function handleSubmit(event) {
        event.preventDefault();
        if(password1 !== password2) {
            alert("Please re-enter the same password!");
            return;
        }

        let deptValue = '';
        switch(dept) {
            case '1': 
                deptValue = 'hr';
                break;
            case '2':
                deptValue = 'finance';
                break;
            case '3':
                deptValue = 'sales';
                break;
        }

        let roleValue = '';
        switch(role) {
            case '1':
                roleValue = 'employee';
                break;
            case '2':
                roleValue = 'admin';
                break;
        }


        const newUser = {
            name: name,
            username: username,
            password: password1,
            department: deptValue,
            role: roleValue,
        }
        registerNewUser(newUser, (data) => {
            console.log('Data received');
            console.log(data);
            resetForm();
            alert(`${data.user.name} registered successfully, redirecting to home`);
            navigate('/');
        })
    }

    function resetForm() {
        setName('');
        setUsername('');
        setPassword1('');
        setPassword2('');
        setDept(1);
        setRole(1);
    }

    return(
        <section id="form-section">
            <h2 className="title">Register</h2>
            <form>
                <input
                autoComplete='false'
                id='name'
                className='form-input'
                type='string'
                required
                placeholder='Name'
                maxLength={50}
                value={name}
                onChange={(event) => {
                    setName(event.target.value);
                }}
                />
                <input 
                autoComplete='false' 
                id='username' 
                className='form-input' 
                type="string" 
                required 
                placeholder="Username" 
                maxLength={50}
                value={username}
                onChange={(event) => {
                    // TODO: validation
                    setUsername(event.target.value);
                }}
                />
                <input 
                autoComplete='false' 
                id='password1' 
                className='form-input' 
                type="password" 
                required 
                placeholder="Enter Password"
                value={password1}
                onChange={(event) => {
                    setPassword1(event.target.value);
                }}
                />
                <input 
                autoComplete='false' 
                id='password2' 
                className='form-input' 
                type="password" 
                required 
                placeholder="Re-enter Password" 
                value={password2}
                onChange={(event) => {
                    setPassword2(event.target.value);
                }}
                />
                <div id='dept-div' className='form-input'>
                    <p className="div-label">DEPARTMENT</p>
                    <div className='div-entry'>
                        <input 
                        id='hr-dept' 
                        type="radio" 
                        name='dept'
                        value='1' 
                        checked={dept === '1'}
                        onChange={handleDeptChange}
                        />
                        <label className='form-label' htmlFor="hr-dept">HR</label>
                    </div>
                    <div className='div-entry'>
                        <input 
                        id='fin-dept' 
                        type="radio" 
                        name='dept' 
                        value='2'
                        checked={dept === '2'}
                        onChange={handleDeptChange}
                        />
                        <label className='form-label' htmlFor="hr-dept">Finance</label>
                    </div>
                    <div className='div-entry'>
                        <input 
                        id='admin-dept' 
                        type="radio" 
                        name='dept'
                        value='3'
                        checked={dept === '3'}
                        onChange={handleDeptChange}
                        />
                        <label className='form-label' htmlFor="hr-dept">Sales</label>
                    </div>
                </div>

                <div id="role-div" className="form-input">
                    <p className="div-label">ROLE</p>
                    <div className="div-entry">
                        <input 
                        id='emp-role' 
                        type="radio" 
                        name='role' 
                        value='1'
                        checked={role === '1'}
                        onChange={handleRoleChange}
                        />
                        <label htmlFor="emp-role" className="form-label">Employee</label>
                    </div>
                    <div className="div-entry">
                        <input 
                        id='admin-role' 
                        type="radio" 
                        name='role' 
                        value='2'
                        checked={role === '2'}
                        onChange={handleRoleChange}
                        />
                        <label htmlFor="admin-role" className="form-label">Admin</label>
                    </div>
                </div>
                <input className='btn' id='form-submit' type="submit" value="Register" onClick={handleSubmit}/>
            </form>
        </section>
    );
}

export default Register;