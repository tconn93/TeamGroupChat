import { useState } from "react";
import WebUtils from "../utils/WebUtils";


const Login = (props) => {
        const [username, setUsername] = useState('');
        const [password, setPassword] = useState('');
        const [isRegister, setIsRegister] = useState(false);

        const handleSubmit = async (e) => {
          e.preventDefault();
          props.setUser(await WebUtils.getToken(isRegister,username,password));
        };

        return (
          <div className="flex justify-center items-center h-screen">
            <div className="p-6 bg-white rounded shadow-md">
              <h2 className="text-2xl mb-4">{isRegister ? 'Register' : 'Login'}</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={handleSubmit}
                  className="w-full p-2 bg-blue-500 text-white rounded"
                >
                  {isRegister ? 'Register' : 'Login'}
                </button>
                <button
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-blue-500"
                >
                  {isRegister ? 'Switch to Login' : 'Switch to Register'}
                </button>
              </div>
            </div>
          </div>
        );
      };

      export default Login;