import React from 'react';
import './signinsocialauth.css'; // Import your CSS file
import img from './img.png'
import {Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';

function SignInAuth() {
  return (
    <div className="content">
      <section>
        <img src={img} alt="img" />
      </section>
      <aside>
        <div className="center">
          <h1>Login to your account</h1>
          <p>Don't have an account? <Link to ="/SignUpForm"  style={{color:'blue'}}>Sign Up</Link></p>
        </div>
        <form>
          <input type="text" placeholder="User name / E-mail" id="username" /><br />
        </form>

        <div className="socialhandles">
          {/* <div className="center"> */}
            <span className="font-size-24"> Sign-in with social media</span><br />
            <button className="btn gmail"><FontAwesomeIcon icon={faEnvelope} style={{ paddingRight:'8px', paddingTop:'3px',color:"#000000" }}/>Sign-in with Gmail</button><br />
            <button className="btn facebook"><FontAwesomeIcon icon={faFacebook} style={{ paddingRight:'8px'}}/>Sign-in with Facebook</button><br />
            <button className="btn github"><FontAwesomeIcon icon={faGithub} style={{ paddingRight:'8px'}}/>Sign-in with Github</button><br />
          {/* </div> */}
          <button className="cancelbtn">Cancel</button><br />
        </div>
      </aside>
    </div>
  );
}

export default SignInAuth;
