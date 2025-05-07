import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'boxicons/css/boxicons.min.css';
import { AUTH_ENDPOINTS } from '../../config/apiConfig';
import { useToast } from '../common/Toast';

const Auth = () => {
    const [isActive, setIsActive] = useState(false);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        role: 'BEGINNER'
    });
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "email": loginData.email,
                    "password": loginData.password
                }),
            });

            let data;
            try {
                data = await response.json();
            } catch (error) {
                // If the response is not JSON, create a fallback error object
                data = { message: `Error: ${response.status} ${response.statusText}` };
            }

            if (response.ok) {
                localStorage.setItem('token', data.token);
                addToast('Login successful!', 'success');
                navigate('/Profile');
            } else {
                addToast(data.message || 'Login failed. Please check your credentials.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            addToast('An error occurred during login. Please try again.', 'error');
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(AUTH_ENDPOINTS.REGISTER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData),
            });

            let data;
            try {
                data = await response.json();
            } catch (error) {
                // If the response is not JSON, create a fallback error object
                data = { message: `Error: ${response.status} ${response.statusText}` };
            }

            if (response.ok) {
                addToast('Registration successful! Please login.', 'success');
                setIsActive(false); // Switch back to login form
            } else {
                addToast(data.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            addToast('An error occurred during registration. Please try again.', 'error');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <div className="relative w-[900px] h-[600px] bg-white m-5 rounded-2xl shadow-2xl overflow-hidden">
                {/* Login Form Box */}
                <div className={`absolute w-1/2 h-full bg-white flex items-center text-gray-800 text-center p-12 z-10 transition-all duration-700 ease-in-out ${isActive ? 'opacity-0 pointer-events-none right-1/2' : 'opacity-100 right-0'}`}>
                    <form onSubmit={handleLoginSubmit} className="w-full">
                        <h1 className="text-4xl font-bold mb-3 text-gray-800 tracking-wide">Welcome Back</h1>
                        <div className="w-16 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto mb-6 rounded-full"></div>
                        <p className="text-gray-600 mb-8">Enter your credentials to access your account</p>

                        <div className="relative my-7">
                            <div className="flex items-center bg-gray-50 rounded-lg overflow-hidden mb-1 group focus-within:ring-2 focus-within:ring-indigo-400 transition-all duration-300">
                                <div className="p-3 bg-indigo-100 text-indigo-600 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all duration-300">
                                    <i className='bx bxs-envelope text-xl'></i>
                                </div>
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                    className="flex-1 py-3 px-4 border-0 bg-transparent outline-none text-gray-800"
                                />
                            </div>
                            <div className="h-0.5 w-0 bg-indigo-600 transition-all duration-500 group-focus-within:w-full"></div>
                        </div>

                        <div className="relative my-7">
                            <div className="flex items-center bg-gray-50 rounded-lg overflow-hidden mb-1 group focus-within:ring-2 focus-within:ring-indigo-400 transition-all duration-300">
                                <div className="p-3 bg-indigo-100 text-indigo-600 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all duration-300">
                                    <i className='bx bxs-lock-alt text-xl'></i>
                                </div>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    required
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                    className="flex-1 py-3 px-4 border-0 bg-transparent outline-none text-gray-800"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-8">
                            <label className="flex items-center text-gray-600 text-sm cursor-pointer">
                                <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 mr-2" />
                                Remember me
                            </label>
                            <a href="#" className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-all">Forgot Password?</a>
                        </div>

                        <button type="submit"
                            className="w-full h-12 rounded-lg shadow-md border-none cursor-pointer text-base text-white font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg">
                            Sign In
                        </button>

                        <div className="relative flex items-center justify-center my-6">
                            <div className="flex-grow h-px bg-gray-300"></div>
                            <span className="mx-2 text-xs text-gray-500 bg-white px-2">OR CONTINUE WITH</span>
                            <div className="flex-grow h-px bg-gray-300"></div>
                        </div>

                        <div className="flex justify-center">
                            <a href="#" className="inline-flex justify-center items-center w-10 h-10 rounded-full border border-gray-300 text-xl text-gray-700 mx-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                                <i className='bx bxl-google'></i>
                            </a>
                            <a href="#" className="inline-flex justify-center items-center w-10 h-10 rounded-full border border-gray-300 text-xl text-gray-700 mx-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                                <i className='bx bxl-facebook'></i>
                            </a>
                            <a href="#" className="inline-flex justify-center items-center w-10 h-10 rounded-full border border-gray-300 text-xl text-gray-700 mx-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                                <i className='bx bxl-github'></i>
                            </a>
                            <a href="#" className="inline-flex justify-center items-center w-10 h-10 rounded-full border border-gray-300 text-xl text-gray-700 mx-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                                <i className='bx bxl-linkedin'></i>
                            </a>
                        </div>
                    </form>
                </div>

                {/* Register Form Box */}
                <div className={`absolute w-1/2 h-full bg-white overflow-y-auto px-12 py-8 scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-100 text-gray-800 text-center z-10 transition-all duration-700 ease-in-out ${isActive ? 'opacity-100 left-0' : 'opacity-0 pointer-events-none right-0'}`}>
                    <form onSubmit={handleRegisterSubmit} className="w-full max-w-md mx-auto">
                        <h1 className="text-3xl font-bold mb-3 text-gray-800 tracking-wide">Create Account</h1>
                        <div className="w-16 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto mb-4 rounded-full"></div>
                        <p className="text-gray-600 mb-6">Join our community today</p>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center bg-gray-50 rounded-lg overflow-hidden group focus-within:ring-2 focus-within:ring-indigo-400 transition-all duration-300">
                                <div className="p-2.5 bg-indigo-100 text-indigo-600 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all duration-300">
                                    <i className='bx bx-user text-lg'></i>
                                </div>
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={registerData.firstName}
                                    onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                                    className="flex-1 py-2.5 px-2 border-0 bg-transparent outline-none text-sm text-gray-800"
                                />
                            </div>
                            <div className="flex items-center bg-gray-50 rounded-lg overflow-hidden group focus-within:ring-2 focus-within:ring-indigo-400 transition-all duration-300">
                                <div className="p-2.5 bg-indigo-100 text-indigo-600 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all duration-300">
                                    <i className='bx bx-user text-lg'></i>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={registerData.lastName}
                                    onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                                    className="flex-1 py-2.5 px-2 border-0 bg-transparent outline-none text-sm text-gray-800"
                                />
                            </div>
                        </div>

                        <div className="flex items-center bg-gray-50 rounded-lg overflow-hidden mb-3 group focus-within:ring-2 focus-within:ring-indigo-400 transition-all duration-300">
                            <div className="p-2.5 bg-indigo-100 text-indigo-600 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all duration-300">
                                <i className='bx bx-at text-lg'></i>
                            </div>
                            <input
                                type="text"
                                placeholder="Username"
                                required
                                value={registerData.username}
                                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                                className="flex-1 py-2.5 px-3 border-0 bg-transparent outline-none text-sm text-gray-800"
                            />
                        </div>

                        <div className="flex items-center bg-gray-50 rounded-lg overflow-hidden mb-3 group focus-within:ring-2 focus-within:ring-indigo-400 transition-all duration-300">
                            <div className="p-2.5 bg-indigo-100 text-indigo-600 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all duration-300">
                                <i className='bx bxs-envelope text-lg'></i>
                            </div>
                            <input
                                type="email"
                                placeholder="Email Address"
                                required
                                value={registerData.email}
                                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                className="flex-1 py-2.5 px-3 border-0 bg-transparent outline-none text-sm text-gray-800"
                            />
                        </div>

                        <div className="flex items-center bg-gray-50 rounded-lg overflow-hidden mb-3 group focus-within:ring-2 focus-within:ring-indigo-400 transition-all duration-300">
                            <div className="p-2.5 bg-indigo-100 text-indigo-600 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all duration-300">
                                <i className='bx bxs-lock-alt text-lg'></i>
                            </div>
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={registerData.password}
                                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                className="flex-1 py-2.5 px-3 border-0 bg-transparent outline-none text-sm text-gray-800"
                            />
                        </div>

                        <div className="flex items-center bg-gray-50 rounded-lg overflow-hidden mb-4 group focus-within:ring-2 focus-within:ring-indigo-400 transition-all duration-300">
                            <div className="p-2.5 bg-indigo-100 text-indigo-600 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all duration-300">
                                <i className='bx bxs-graduation text-lg'></i>
                            </div>
                            <select
                                value={registerData.role}
                                onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                                className="flex-1 py-2.5 px-3 border-0 bg-transparent outline-none text-sm text-gray-800 appearance-none"
                            >
                                <option value="BEGINNER">Beginner</option>
                                <option value="INTERMEDIATE">Intermediate</option>
                                <option value="ADVANCED">Advanced</option>
                            </select>
                            <div className="pr-4">
                                <i className='bx bx-chevron-down text-lg text-gray-500'></i>
                            </div>
                        </div>

                        <div className="flex items-center mb-4">
                            <input
                                type="checkbox"
                                id="terms"
                                className="form-checkbox h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500 mr-2"
                            />
                            <label htmlFor="terms" className="text-xs text-gray-600">
                                I agree to the <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
                            </label>
                        </div>

                        <button type="submit"
                            className="w-full h-10 rounded-lg shadow-md border-none cursor-pointer text-sm text-white font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg">
                            Create Account
                        </button>

                        <div className="relative flex items-center justify-center my-5">
                            <div className="flex-grow h-px bg-gray-300"></div>
                            <span className="mx-2 text-xs text-gray-500 bg-white px-2">OR SIGN UP WITH</span>
                            <div className="flex-grow h-px bg-gray-300"></div>
                        </div>

                        <div className="flex justify-center gap-3">
                            <a href="#" className="inline-flex justify-center items-center w-9 h-9 rounded-full border border-gray-300 text-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                                <i className='bx bxl-google'></i>
                            </a>
                            <a href="#" className="inline-flex justify-center items-center w-9 h-9 rounded-full border border-gray-300 text-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                                <i className='bx bxl-facebook'></i>
                            </a>
                            <a href="#" className="inline-flex justify-center items-center w-9 h-9 rounded-full border border-gray-300 text-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                                <i className='bx bxl-github'></i>
                            </a>
                            <a href="#" className="inline-flex justify-center items-center w-9 h-9 rounded-full border border-gray-300 text-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all">
                                <i className='bx bxl-linkedin'></i>
                            </a>
                        </div>
                    </form>
                </div>

                {/* Toggle Box with sliding background */}
                <div className="absolute w-full h-full">
                    {/* This creates the sliding background */}
                    <div className="absolute w-full h-full overflow-hidden">
                        <div className={`absolute w-[300%] h-full rounded-[150px] transition-all duration-[1.8s] ease-in-out transform ${isActive ? 'left-[calc(-50%+900px)]' : '-left-[250%]'} bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500`}>
                        </div>
                    </div>

                    {/* Left panel - visible when not active */}
                    <div className={`absolute left-0 w-1/2 h-full flex flex-col justify-center items-center z-20 transition-all duration-700 ease-in-out ${isActive ? 'opacity-0 -translate-x-full' : 'opacity-100 translate-x-0'} text-white px-12`}>
                        <div className="flex items-center justify-center mb-4">
                            <i className='bx bxs-user-plus text-5xl'></i>
                        </div>
                        <h1 className="text-4xl font-bold mb-4">New Here?</h1>
                        <p className="mb-8 text-center text-white/90">Sign up and discover a great amount of opportunities!</p>
                        <button
                            className="w-48 h-12 bg-transparent rounded-full font-semibold border-2 border-white text-white hover:bg-white hover:text-indigo-600 transition-all duration-300"
                            onClick={() => setIsActive(true)}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Right panel - visible when active */}
                    <div className={`absolute right-0 w-1/2 h-full flex flex-col justify-center items-center z-20 transition-all duration-700 ease-in-out ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'} text-white px-12`}>
                        <div className="flex items-center justify-center mb-4">
                            <i className='bx bxs-user-check text-5xl'></i>
                        </div>
                        <h1 className="text-4xl font-bold mb-4">One of Us?</h1>
                        <p className="mb-8 text-center text-white/90">Login to access your profile and continue your learning journey!</p>
                        <button
                            className="w-48 h-12 bg-transparent rounded-full font-semibold border-2 border-white text-white hover:bg-white hover:text-indigo-600 transition-all duration-300"
                            onClick={() => setIsActive(false)}
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
