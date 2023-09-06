// SignInForm.js

import React from 'react';
import './SignInForm.css';
import img from './img.png'
import {Link } from "react-router-dom";
function SignInForm() {
  return (
    <div className="content">
      <section>
        <img src={img} alt="Image" />
      </section>
      <aside>
        <center>
          <h1>Login to your account</h1>
          <p>Don't have an account? <Link to="/SignUpForm">Sign Up</Link></p>
        </center>
        <form>
          <input type="text" placeholder="User name / E-mail" id="username" /><br />
          <input type="password" placeholder="Password" id="password" /><br />
          <button className="btnsignup">Sign In</button>
        </form>
        <button className="socialmediasignin">
          <Link to="/SignInAuth" style={{ color: 'black' }}>Sign-in with social media</Link>
        </button>
      </aside>
    </div>
  );
}

export default SignInForm;
