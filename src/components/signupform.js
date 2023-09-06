// SignUpForm.js

import React from 'react';
import './SignUpForm.css';
import img from './img.png'
import {Link } from "react-router-dom";

function SignUpForm() {
  return (
    <div className="content">
      <section>
        <img src={img} alt="Image" />
      </section>
      <aside>
        <center>
          <h1>Create an account</h1>
          <p>Already have an account? <Link to ="/">Sign in</Link></p>
        </center>
        <form>
          <input type="text" placeholder="User name" id="username" /><br />
          <input type="text" placeholder="First name" id="fname" />
          <input type="text" placeholder="Last name" id="lname" /><br />
          <input type="password" placeholder="Password" id="password" /><br />
          <input type="checkbox" id="checkbox" /><span>I have read and agree to <a href="#">Terms of Service</a></span><br />
          <button className="sgnup">Sign Up</button>
        </form>
      </aside>
    </div>
  );
}

export default SignUpForm;
